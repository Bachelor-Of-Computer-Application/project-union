from collections import defaultdict

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Address, Customer
from config.permissions import IsAdminUser
from menu.models import MenuItem

from .models import Cart, CartItem, Order, OrderItem
from .payment_service import eSewaPaymentService
from .serializers import (
    CartItemWriteSerializer,
    CartSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
    AdminOrderStatusUpdateSerializer,
    PaymentInitiateSerializer,
    PaymentCallbackSerializer,
    PaymentVerifySerializer,
)


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def get_customer_or_404(user):
    """
    Returns the Customer for a given User.
    Superusers created via createsuperuser won't have a Customer profile,
    so all views that need one call this instead of bare .get().
    """
    return get_object_or_404(Customer, user=user)


def update_inventory_for_order(order, *, deduct: bool):
    """Inventory handling is disabled; this hook is kept for compatibility."""
    return


# ──────────────────────────────────────────────
# Cart views
# ──────────────────────────────────────────────

class CartDetailAPIView(APIView):
    """GET — Returns the current user's cart (creates one if needed)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        customer = get_customer_or_404(request.user)
        cart, _ = Cart.objects.get_or_create(customer=customer)
        return Response(CartSerializer(cart).data)


class CartAddItemAPIView(APIView):
    """POST — Add an item to the cart; increments quantity if already present."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        customer = get_customer_or_404(request.user)
        cart, _ = Cart.objects.get_or_create(customer=customer)

        menu_item_id = request.data.get("menu_item")
        quantity = max(int(request.data.get("quantity", 1)), 1)
        menu_item = get_object_or_404(MenuItem, id=menu_item_id, is_available=True)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            menu_item=menu_item,
            defaults={"quantity": quantity},
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        return Response(CartSerializer(cart).data)


class CartUpdateItemAPIView(APIView):
    """PATCH — Update cart item quantity; removes item when quantity ≤ 0."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, item_id):
        customer = get_customer_or_404(request.user)
        cart_item = get_object_or_404(CartItem, id=item_id, cart__customer=customer)

        quantity = request.data.get("quantity")
        if quantity is not None and int(quantity) > 0:
            cart_item.quantity = int(quantity)
            cart_item.save()
        else:
            cart_item.delete()

        cart = get_object_or_404(Cart, customer=customer)
        return Response(CartSerializer(cart).data)


class CartRemoveItemAPIView(APIView):
    """DELETE — Remove a specific item from the cart."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        customer = get_customer_or_404(request.user)
        CartItem.objects.filter(id=item_id, cart__customer=customer).delete()
        cart = get_object_or_404(Cart, customer=customer)
        return Response(CartSerializer(cart).data)


# ──────────────────────────────────────────────
# Checkout
# ──────────────────────────────────────────────

class CheckoutAPIView(APIView):
    """
    POST — Convert the cart into an Order.
    Validates the delivery address, creates OrderItems via bulk_create,
    recalculates total, and empties the cart.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        customer = get_customer_or_404(request.user)
        cart = Cart.objects.filter(customer=customer).prefetch_related("items").first()

        if not cart or not cart.items.exists():
            return Response({"error": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = OrderCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        address = get_object_or_404(
            Address,
            id=serializer.validated_data["delivery_address_id"],
            customer=customer,
        )

        order = Order.objects.create(
            customer=customer,
            delivery_address=address,
            payment_method=serializer.validated_data.get("payment_method", "COD"),
            notes=serializer.validated_data.get("notes", ""),
        )

        OrderItem.objects.bulk_create([
            OrderItem(
                order=order,
                menu_item=cart_item.menu_item,
                quantity=cart_item.quantity,
                unit_price=cart_item.menu_item.price,
            )
            for cart_item in cart.items.select_related("menu_item").all()
        ])

        order.calculate_total()
        cart.items.all().delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


# ──────────────────────────────────────────────
# Customer-facing order views
# ──────────────────────────────────────────────

class OrderListAPIView(generics.ListAPIView):
    """GET — List the authenticated customer's orders, newest first."""

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer = get_customer_or_404(self.request.user)
        return (
            Order.objects
            .filter(customer=customer)
            .prefetch_related("items__menu_item")
            .order_by("-order_date")
        )


class OrderDetailAPIView(generics.RetrieveAPIView):
    """GET — Retrieve one of the authenticated customer's orders."""

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer = get_customer_or_404(self.request.user)
        return (
            Order.objects
            .filter(customer=customer)
            .prefetch_related("items__menu_item")
        )


class OrderCancelAPIView(APIView):
    """
    POST — Cancel an order that is still in "Order Placed" or "Preparing" status.
    Once the order reaches "Ready" status, cancellation is no longer allowed.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        customer = get_customer_or_404(request.user)
        order = get_object_or_404(Order, pk=pk, customer=customer)

        if order.status not in ["Order Placed", "Preparing"]:
            return Response(
                {"error": "Only orders with status 'Order Placed' or 'Preparing' can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = "Cancelled"
        order.save(update_fields=["status"])
        return Response(OrderSerializer(order).data)


class OrderUpdateStatusAPIView(generics.UpdateAPIView):
    """PATCH — Status update for customer (their own orders) or delivery man (their assigned orders)."""

    serializer_class = OrderStatusUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        try:
            if hasattr(user, 'delivery_profile') and user.delivery_profile.is_active:
                return Order.objects.filter(assigned_to=user.delivery_profile)
        except Exception:
            pass
        customer = get_customer_or_404(user)
        return Order.objects.filter(customer=customer)


# ──────────────────────────────────────────────
# Admin order views
# ──────────────────────────────────────────────

class AdminOrderListAPIView(generics.ListAPIView):
    """
    GET — Admin only: list all orders.
    Supports filtering via query params:
      ?status=Preparing
      ?payment_status=Paid
      ?customer=<name substring>
      ?date_from=YYYY-MM-DD   (inclusive)
      ?date_to=YYYY-MM-DD     (inclusive)
    """

    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = (
            Order.objects
            .select_related("customer")
            .prefetch_related("items__menu_item")
            .order_by("-order_date")
        )

        p = self.request.query_params

        if status_val := p.get("status"):
            qs = qs.filter(status=status_val)

        if payment_status := p.get("payment_status"):
            qs = qs.filter(payment_status=payment_status)

        if customer_name := p.get("customer"):
            qs = qs.filter(customer__name__icontains=customer_name)

        if date_from := p.get("date_from"):
            qs = qs.filter(order_date__date__gte=date_from)

        if date_to := p.get("date_to"):
            qs = qs.filter(order_date__date__lte=date_to)

        return qs


class AdminOrderUpdateAPIView(generics.UpdateAPIView):
    """PATCH — Admin only: update order status, payment status, and delivery assignment."""

    queryset = Order.objects.all()
    serializer_class = AdminOrderStatusUpdateSerializer
    permission_classes = [IsAdminUser]

    def patch(self, request, *args, **kwargs):
        order = self.get_object()
        old_status = order.status
        new_status = request.data.get("status", old_status)

        if new_status != old_status:
            if new_status == "Preparing":
                update_inventory_for_order(order, deduct=True)
            elif new_status == "Cancelled" and old_status == "Preparing":
                update_inventory_for_order(order, deduct=False)

        serializer = self.get_serializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(OrderSerializer(order).data)


# ──────────────────────────────────────────────
# Admin dashboard
# ──────────────────────────────────────────────

class DashboardAPIView(APIView):
    """GET — Admin only: KPI stats + 12-month revenue trend + recent orders."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        from django.contrib.auth.models import User as DjangoUser

        paid_orders = Order.objects.filter(payment_status="Paid")
        total_revenue = sum(o.total_amount for o in paid_orders)

        rev_by_month: dict[str, float] = defaultdict(float)
        for order in paid_orders:
            rev_by_month[order.order_date.strftime("%Y-%m")] += float(order.total_amount)

        now = timezone.now()
        revenue_trend = []
        for i in range(11, -1, -1):
            m = now.month - i
            y = now.year
            while m < 1:
                m += 12
                y -= 1
            revenue_trend.append(round(rev_by_month.get(f"{y}-{m:02d}", 0.0), 2))

        recent_orders = (
            Order.objects
            .select_related("customer")
            .prefetch_related("items__menu_item")
            .order_by("-order_date")[:5]
        )

        return Response({
            "total_customers": DjangoUser.objects.count(),
            "total_menu_items": MenuItem.objects.count(),
            "available_menu_items": MenuItem.objects.filter(is_available=True).count(),
            "total_orders": Order.objects.count(),
            "pending_orders": Order.objects.filter(status="Order Placed").count(),
            "preparing_orders": Order.objects.filter(status="Preparing").count(),
            "out_for_delivery": Order.objects.filter(status="Out for Delivery").count(),
            "delivered_orders": Order.objects.filter(status="Delivered").count(),
            "paid_orders": Order.objects.filter(payment_status="Paid").count(),
            "total_revenue": float(total_revenue),
            "revenue_trend": revenue_trend,
            "recent_orders": OrderSerializer(recent_orders, many=True).data,
        })


# ──────────────────────────────────────────────
# Payment views
# ──────────────────────────────────────────────

class PaymentInitiateAPIView(APIView):
    """
    POST — Initiate eSewa payment for an order.
    
    Request:
        {
            "order_id": <order_id>,
            "payment_method": "eSewa"
        }
    
    Response:
        {
            "payment_form_url": "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
            "form_data": {
                "amount": "1000.00",
                "transaction_uuid": "...",
                "product_code": "EPAYTEST",
                ...
            },
            "transaction_uuid": "..."
        }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        customer = get_customer_or_404(request.user)
        
        serializer = PaymentInitiateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        
        order = get_object_or_404(Order, id=serializer.validated_data["order_id"], customer=customer)
        
        # Generate transaction UUID and update order
        payment_service = eSewaPaymentService()
        transaction_uuid = payment_service.generate_transaction_uuid()
        
        order.transaction_uuid = transaction_uuid
        order.payment_method = "eSewa"
        order.save(update_fields=["transaction_uuid", "payment_method"])
        
        # Prepare payment form data
        form_data = payment_service.prepare_payment_form_data(
            order_id=order.id,
            amount=order.total_amount,
            transaction_uuid=transaction_uuid,
            customer_email=customer.user.email or "",
            customer_phone=customer.phone or "",
        )
        
        return Response({
            "payment_form_url": payment_service.get_payment_form_url(),
            "form_data": form_data,
            "transaction_uuid": transaction_uuid,
        }, status=status.HTTP_200_OK)


class PaymentSuccessCallbackAPIView(APIView):
    """
    POST — eSewa success callback endpoint.
    Verifies payment with eSewa and marks order as paid.
    
    Can be called from:
    1. Frontend redirect after payment (may not have all data)
    2. Backend verification endpoint
    """
    permission_classes = []  # Callback from eSewa, no auth required
    authentication_classes = []

    def post(self, request):
        serializer = PaymentCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        transaction_uuid = serializer.validated_data.get("transaction_uuid")
        
        # Find the order
        order = get_object_or_404(Order, transaction_uuid=transaction_uuid)
        
        # Verify payment with eSewa (pass total_amount so the API can match the transaction)
        payment_service = eSewaPaymentService()
        is_verified, response_data = payment_service.verify_payment(
            transaction_uuid, total_amount=order.total_amount
        )

        if is_verified:
            # Payment is successful
            order.payment_status = "Paid"
            order.transaction_code = payment_service.extract_transaction_code(response_data)
            order.save(update_fields=["payment_status", "transaction_code"])

            return Response({
                "success": True,
                "message": "Payment verified successfully",
                "order": OrderSerializer(order).data,
            }, status=status.HTTP_200_OK)
        else:
            # Payment verification failed
            order.payment_status = "Failed"
            order.save(update_fields=["payment_status"])
            
            return Response({
                "success": False,
                "message": "Payment verification failed",
                "error": response_data.get("error", "Unknown error"),
            }, status=status.HTTP_400_BAD_REQUEST)


class PaymentFailureCallbackAPIView(APIView):
    """
    POST — eSewa failure callback endpoint.
    Marks order payment as failed.
    """
    permission_classes = []  # Callback from eSewa, no auth required
    authentication_classes = []

    def post(self, request):
        serializer = PaymentCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        transaction_uuid = serializer.validated_data.get("transaction_uuid")
        
        # Find the order
        order = get_object_or_404(Order, transaction_uuid=transaction_uuid)
        
        # Mark as failed
        order.payment_status = "Failed"
        order.save(update_fields=["payment_status"])
        
        return Response({
            "success": False,
            "message": "Payment failed",
            "order_id": order.id,
        }, status=status.HTTP_200_OK)


class PaymentVerifyAPIView(APIView):
    """
    GET — Verify payment status with eSewa.
    
    Query params:
        ?transaction_uuid=<uuid>
    
    This endpoint can be called by frontend after user returns from eSewa
    to verify if payment was successful.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        customer = get_customer_or_404(request.user)
        transaction_uuid = request.query_params.get("transaction_uuid")
        
        if not transaction_uuid:
            return Response(
                {"error": "transaction_uuid query param required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Find order
        order = get_object_or_404(Order, transaction_uuid=transaction_uuid, customer=customer)
        
        # Verify with eSewa (pass total_amount so the API can match the transaction)
        payment_service = eSewaPaymentService()
        is_verified, response_data = payment_service.verify_payment(
            transaction_uuid, total_amount=order.total_amount
        )

        if is_verified:
            # Update order if not already marked paid
            if order.payment_status != "Paid":
                order.payment_status = "Paid"
                order.transaction_code = payment_service.extract_transaction_code(response_data)
                order.save(update_fields=["payment_status", "transaction_code"])
            
            return Response({
                "success": True,
                "message": "Payment verified",
                "payment_status": "Paid",
                "order": OrderSerializer(order).data,
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "success": False,
                "message": "Payment not verified",
                "payment_status": order.payment_status,
            }, status=status.HTTP_400_BAD_REQUEST)
            from accounts.models import DeliveryMan
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response


class DeliveryDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            delivery_man = request.user.delivery_profile
        except DeliveryMan.DoesNotExist:
            return Response({"error": "You are not a delivery man."}, status=403)

        orders = Order.objects.filter(assigned_to=delivery_man)

        return Response({
            "total_assigned": orders.count(),
            "pending": orders.exclude(status="Delivered").count(),
            "completed": orders.filter(status="Delivered").count(),
        })


class DeliveryOrdersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            delivery_man = request.user.delivery_profile
        except DeliveryMan.DoesNotExist:
            return Response({"error": "You are not a delivery man."}, status=403)

        orders = Order.objects.filter(
            assigned_to=delivery_man
        ).select_related(
            "customer",
            "delivery_address"
        ).prefetch_related("items__menu_item")

        data = []

        for order in orders:
            data.append({
                "id": order.id,
                "customer": order.customer.name,
                "phone": order.customer.phone,
                "address": order.delivery_address.full_address if order.delivery_address else "",
                "items": [
                    {
                        "name": item.menu_item.name,
                        "quantity": item.quantity,
                    }
                    for item in order.items.all()
                ],
                "total": order.total_amount,
                "status": order.status,
            })

        return Response(data)
