from collections import defaultdict

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError as DRFValidationError

from accounts.models import Address, Customer, DeliveryMan
from config.permissions import IsAdminUser, IsDeliveryMan
from menu.models import MenuItem

from .models import Cart, CartItem, Order, OrderItem
from .email import send_order_confirmation_email
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
    return get_object_or_404(Customer, user=user)


def update_inventory_for_order(order, *, deduct: bool):
    """Inventory handling is disabled; this hook is kept for compatibility."""
    return


# ──────────────────────────────────────────────
# Cart views
# ──────────────────────────────────────────────

class CartDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        customer = get_customer_or_404(request.user)
        cart, _ = Cart.objects.get_or_create(customer=customer)
        return Response(CartSerializer(cart).data)


class CartAddItemAPIView(APIView):
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

        # Send order confirmation email in background thread (never blocks response)
        send_order_confirmation_email(order)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


# ──────────────────────────────────────────────
# Customer-facing order views
# ──────────────────────────────────────────────

class OrderListAPIView(generics.ListAPIView):
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
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        customer = get_customer_or_404(request.user)
        order = get_object_or_404(Order, pk=pk, customer=customer)

        if order.status not in ["Order Placed"]:
            return Response(
                {"error": "Orders can only be cancelled before the kitchen starts preparing. This order cannot be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = "Cancelled"
        order.save(update_fields=["status"])
        return Response(OrderSerializer(order).data)


class OrderUpdateStatusAPIView(APIView):
    """
    PATCH — Delivery man updates the status of one of their assigned orders.
    Allowed transitions:
        Ready → Out for Delivery
        Out for Delivery → Delivered   (also marks COD as Paid)
    """
    permission_classes = [IsDeliveryMan]

    def patch(self, request, pk):
        try:
            delivery_man = request.user.delivery_profile
        except Exception:
            return Response({"error": "Delivery man profile not found."}, status=status.HTTP_403_FORBIDDEN)

        order = get_object_or_404(Order, pk=pk, assigned_to=delivery_man)
        new_status = request.data.get("status")

        allowed = {
            "Ready":            "Out for Delivery",
            "Out for Delivery": "Delivered",
        }

        if new_status not in allowed.values():
            return Response(
                {"error": f"Invalid status. Allowed values: {list(allowed.values())}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.status not in allowed or allowed[order.status] != new_status:
            return Response(
                {"error": f"Cannot transition from '{order.status}' to '{new_status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = new_status
        # For COD orders, do NOT auto-mark as Paid — delivery man must confirm
        # cash was collected via the separate /collect-cash/ endpoint.
        # For eSewa, payment_status is already Paid and must not be changed here.
        order.save(update_fields=["status"])

        return Response(OrderSerializer(order).data)


class DeliveryCollectCashAPIView(APIView):
    """
    PATCH /orders/<pk>/collect-cash/
    Delivery man confirms cash has been collected for a COD order.

    Rules:
      - Only the delivery man assigned to this order may call this.
      - Order must be in "Delivered" status.
      - Payment method must be COD.
      - Payment status must still be Pending (idempotent if already Paid).
    """
    permission_classes = [IsDeliveryMan]

    def patch(self, request, pk):
        try:
            delivery_man = request.user.delivery_profile
        except Exception:
            return Response(
                {"error": "Delivery man profile not found."},
                status=status.HTTP_403_FORBIDDEN,
            )

        order = get_object_or_404(Order, pk=pk, assigned_to=delivery_man)

        if order.payment_method != "COD":
            return Response(
                {"error": "Cash collection only applies to Cash on Delivery orders."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.status != "Delivered":
            return Response(
                {"error": "Cash can only be collected after the order has been delivered."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.payment_status == "Paid":
            # Already collected — return current state without error
            return Response(OrderSerializer(order).data)

        order.payment_status = "Paid"
        order.save(update_fields=["payment_status"])

        return Response(OrderSerializer(order).data)


# ──────────────────────────────────────────────
# Delivery man views
# ──────────────────────────────────────────────

class DeliveryDashboardAPIView(APIView):
    """
    GET /orders/delivery/dashboard/
    Returns KPI stats for the logged-in delivery man.
    """
    permission_classes = [IsDeliveryMan]

    def get(self, request):
        try:
            delivery_man = request.user.delivery_profile
        except Exception:
            return Response({"error": "Delivery man profile not found."}, status=status.HTTP_403_FORBIDDEN)

        orders = Order.objects.filter(assigned_to=delivery_man)
        active_statuses = ["Ready", "Out for Delivery"]

        return Response({
            "total_assigned": orders.count(),
            "pending":        orders.filter(status__in=active_statuses).count(),
            "out_for_delivery": orders.filter(status="Out for Delivery").count(),
            "completed":      orders.filter(status="Delivered").count(),
        })


class DeliveryOrdersAPIView(APIView):
    """
    GET /orders/delivery/orders/
    Returns all orders assigned to the logged-in delivery man.
    """
    permission_classes = [IsDeliveryMan]

    def get(self, request):
        try:
            delivery_man = request.user.delivery_profile
        except Exception:
            return Response({"error": "Delivery man profile not found."}, status=status.HTTP_403_FORBIDDEN)

        orders = (
            Order.objects
            .filter(assigned_to=delivery_man)
            .select_related("customer", "delivery_address")
            .prefetch_related("items__menu_item")
            .order_by("-order_date")
        )

        data = []
        for order in orders:
            data.append({
                "id":             order.id,
                "customer":       order.customer.name,
                "phone":          order.customer.phone,
                "address":        (
                    f"{order.delivery_address.full_address}, {order.delivery_address.city}"
                    if order.delivery_address else ""
                ),
                "items": [
                    {"name": item.menu_item.name, "quantity": item.quantity}
                    for item in order.items.all()
                ],
                "total":          str(order.total_amount),
                "status":         order.status,
                "payment_method": order.payment_method,
                "payment_status": order.payment_status,
                "notes":          order.notes,
                "order_date":     order.order_date.isoformat(),
            })

        return Response(data)


# ──────────────────────────────────────────────
# Admin order views
# ──────────────────────────────────────────────

class AdminOrderListAPIView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = (
            Order.objects
            .select_related("customer", "assigned_to")
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
    """
    PATCH — Admin: update order status, payment status, and/or assign delivery man.
    """
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
            "total_customers":       DjangoUser.objects.count(),
            "total_menu_items":      MenuItem.objects.count(),
            "available_menu_items":  MenuItem.objects.filter(is_available=True).count(),
            "total_orders":          Order.objects.count(),
            "pending_orders":        Order.objects.filter(status="Order Placed").count(),
            "preparing_orders":      Order.objects.filter(status="Preparing").count(),
            "out_for_delivery":      Order.objects.filter(status="Out for Delivery").count(),
            "delivered_orders":      Order.objects.filter(status="Delivered").count(),
            "paid_orders":           Order.objects.filter(payment_status="Paid").count(),
            "total_revenue":         float(total_revenue),
            "revenue_trend":         revenue_trend,
            "recent_orders":         OrderSerializer(recent_orders, many=True).data,
        })


# ──────────────────────────────────────────────
# Payment views
# ──────────────────────────────────────────────

class PaymentInitiateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        customer = get_customer_or_404(request.user)

        serializer = PaymentInitiateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        order = get_object_or_404(Order, id=serializer.validated_data["order_id"], customer=customer)

        payment_service = eSewaPaymentService()
        transaction_uuid = payment_service.generate_transaction_uuid()

        order.transaction_uuid = transaction_uuid
        order.payment_method = "eSewa"
        order.save(update_fields=["transaction_uuid", "payment_method"])

        form_data = payment_service.prepare_payment_form_data(
            order_id=order.id,
            amount=order.total_amount,
            transaction_uuid=transaction_uuid,
            customer_email=customer.user.email or "",
            customer_phone=customer.phone or "",
        )

        return Response({
            "payment_form_url": payment_service.get_payment_form_url(),
            "form_data":        form_data,
            "transaction_uuid": transaction_uuid,
        }, status=status.HTTP_200_OK)


class PaymentSuccessCallbackAPIView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        serializer = PaymentCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        transaction_uuid = serializer.validated_data.get("transaction_uuid")
        order = get_object_or_404(Order, transaction_uuid=transaction_uuid)

        payment_service = eSewaPaymentService()
        is_verified, response_data = payment_service.verify_payment(
            transaction_uuid, total_amount=order.total_amount
        )

        if is_verified:
            order.payment_status = "Paid"
            order.transaction_code = payment_service.extract_transaction_code(response_data)
            order.save(update_fields=["payment_status", "transaction_code"])
            return Response({
                "success": True,
                "message": "Payment verified successfully",
                "order":   OrderSerializer(order).data,
            })
        else:
            order.payment_status = "Failed"
            order.save(update_fields=["payment_status"])
            return Response({
                "success": False,
                "message": "Payment verification failed",
                "error":   response_data.get("error", "Unknown error"),
            }, status=status.HTTP_400_BAD_REQUEST)


class PaymentFailureCallbackAPIView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        serializer = PaymentCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        transaction_uuid = serializer.validated_data.get("transaction_uuid")
        order = get_object_or_404(Order, transaction_uuid=transaction_uuid)

        order.payment_status = "Failed"
        order.save(update_fields=["payment_status"])

        return Response({"success": False, "message": "Payment failed", "order_id": order.id})


class PaymentVerifyAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        customer = get_customer_or_404(request.user)
        transaction_uuid = request.query_params.get("transaction_uuid")

        if not transaction_uuid:
            return Response(
                {"error": "transaction_uuid query param required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = get_object_or_404(Order, transaction_uuid=transaction_uuid, customer=customer)

        payment_service = eSewaPaymentService()
        is_verified, response_data = payment_service.verify_payment(
            transaction_uuid, total_amount=order.total_amount
        )

        if is_verified:
            if order.payment_status != "Paid":
                order.payment_status = "Paid"
                order.transaction_code = payment_service.extract_transaction_code(response_data)
                order.save(update_fields=["payment_status", "transaction_code"])
            return Response({
                "success":        True,
                "message":        "Payment verified",
                "payment_status": "Paid",
                "order":          OrderSerializer(order).data,
            })
        else:
            return Response({
                "success":        False,
                "message":        "Payment not verified",
                "payment_status": order.payment_status,
            }, status=status.HTTP_400_BAD_REQUEST)
