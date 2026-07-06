from collections import defaultdict

from django.db.models import F, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Address, Customer
from config.permissions import IsAdminUser
from inventory.models import InventoryItem
from menu.models import MenuItem, MenuItemRecipe

from .models import Cart, CartItem, Order, OrderItem
from .serializers import (
    CartItemWriteSerializer,
    CartSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
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
    """
    Adjust inventory quantities based on an order's recipe links.

    deduct=True  → subtract stock   (order → Preparing)
    deduct=False → restore stock    (Preparing order → Cancelled)

    Re-evaluates availability on every affected MenuItem afterwards.
    """
    affected_menu_items = set()

    for order_item in order.items.select_related("menu_item").all():
        recipes = (
            MenuItemRecipe.objects
            .filter(menu_item=order_item.menu_item)
            .select_related("inventory_item")
        )
        for recipe in recipes:
            inv = recipe.inventory_item
            needed = recipe.quantity_required * order_item.quantity
            inv.quantity = max(inv.quantity - needed, 0) if deduct else inv.quantity + needed
            inv.save(update_fields=["quantity"])
            affected_menu_items.add(order_item.menu_item)

    for menu_item in affected_menu_items:
        menu_item.auto_availability()


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
    POST — Cancel an order that is still in "Order Placed" status.
    Once the kitchen starts preparing it, cancellation is no longer allowed.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        customer = get_customer_or_404(request.user)
        order = get_object_or_404(Order, pk=pk, customer=customer)

        if order.status != "Order Placed":
            return Response(
                {"error": "Only orders with status 'Order Placed' can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = "Cancelled"
        order.save(update_fields=["status"])
        return Response(OrderSerializer(order).data)


class OrderUpdateStatusAPIView(generics.UpdateAPIView):
    """PATCH — Generic customer-facing status update (kept for backwards compat)."""

    serializer_class = OrderStatusUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer = get_customer_or_404(self.request.user)
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
    """
    PATCH — Admin only: update order status and/or payment status.

    Inventory side-effects:
      Order Placed → Preparing   : deduct stock
      Preparing    → Cancelled   : restore stock
    """

    queryset = Order.objects.all()
    serializer_class = OrderStatusUpdateSerializer
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
            "low_stock_items": InventoryItem.objects.filter(
                quantity__lte=F("low_stock_limit")
            ).count(),
            "total_revenue": float(total_revenue),
            "revenue_trend": revenue_trend,
            "recent_orders": OrderSerializer(recent_orders, many=True).data,
        })
