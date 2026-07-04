from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order, Cart, CartItem
from .serializers import (
    OrderSerializer, OrderCreateSerializer, OrderStatusUpdateSerializer,
    CartSerializer, CartItemWriteSerializer,
)
from accounts.models import Customer, Address
from menu.models import MenuItem


class CartDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        customer = Customer.objects.get(user=request.user)
        cart, _ = Cart.objects.get_or_create(customer=customer)
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class CartAddItemAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        customer = Customer.objects.get(user=request.user)
        cart, _ = Cart.objects.get_or_create(customer=customer)
        menu_item_id = request.data.get("menu_item")
        quantity = int(request.data.get("quantity", 1))

        try:
            menu_item = MenuItem.objects.get(id=menu_item_id, is_available=True)
        except MenuItem.DoesNotExist:
            return Response({"error": "Menu item not found or unavailable"}, status=404)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, menu_item=menu_item,
            defaults={"quantity": quantity},
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        serializer = CartSerializer(cart)
        return Response(serializer.data)


class CartUpdateItemAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, item_id):
        customer = Customer.objects.get(user=request.user)
        try:
            cart_item = CartItem.objects.get(id=item_id, cart__customer=customer)
        except CartItem.DoesNotExist:
            return Response({"error": "Cart item not found"}, status=404)

        quantity = request.data.get("quantity")
        if quantity is not None and int(quantity) > 0:
            cart_item.quantity = int(quantity)
            cart_item.save()
        else:
            cart_item.delete()

        cart = Cart.objects.get(customer=customer)
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class CartRemoveItemAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        customer = Customer.objects.get(user=request.user)
        try:
            cart_item = CartItem.objects.get(id=item_id, cart__customer=customer)
            cart_item.delete()
        except CartItem.DoesNotExist:
            pass

        cart = Cart.objects.get(customer=customer)
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class CheckoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        customer = Customer.objects.get(user=request.user)
        cart = Cart.objects.filter(customer=customer).first()

        if not cart or not cart.items.exists():
            return Response({"error": "Cart is empty"}, status=400)

        address_id = request.data.get("delivery_address_id")
        notes = request.data.get("notes", "")

        try:
            address = Address.objects.get(id=address_id, customer=customer)
        except Address.DoesNotExist:
            return Response({"error": "Invalid delivery address"}, status=400)

        order = Order.objects.create(
            customer=customer,
            delivery_address=address,
            notes=notes,
        )

        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                menu_item=cart_item.menu_item,
                quantity=cart_item.quantity,
                unit_price=cart_item.menu_item.price,
            )

        order.calculate_total()
        cart.items.all().delete()

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class OrderListAPIView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer = Customer.objects.get(user=self.request.user)
        return Order.objects.filter(customer=customer).prefetch_related("items__menu_item").order_by("-order_date")


class OrderDetailAPIView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer = Customer.objects.get(user=self.request.user)
        return Order.objects.filter(customer=customer).prefetch_related("items__menu_item")


class OrderUpdateStatusAPIView(generics.UpdateAPIView):
    serializer_class = OrderStatusUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer = Customer.objects.get(user=self.request.user)
        return Order.objects.filter(customer=customer)


class AdminOrderListAPIView(generics.ListAPIView):
    queryset = Order.objects.all().prefetch_related("items__menu_item", "customer").order_by("-order_date")
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response({"error": "Admin access required"}, status=403)
        return super().get(request, *args, **kwargs)


class AdminOrderUpdateAPIView(generics.UpdateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderStatusUpdateSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response({"error": "Admin access required"}, status=403)
        order = self.get_object()
        if "status" in request.data:
            order.status = request.data["status"]
        if "payment_status" in request.data:
            order.payment_status = request.data["payment_status"]
        order.save()
        return Response(OrderSerializer(order).data)


class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_superuser:
            return Response({"error": "Admin access required"}, status=403)
        from accounts.models import Customer
        from menu.models import MenuItem
        from inventory.models import InventoryItem

        total_revenue = sum(
            order.total_amount
            for order in Order.objects.filter(payment_status="Paid")
        )

        recent_orders = Order.objects.order_by("-order_date")[:5]

        return Response({
            "total_customers": Customer.objects.count(),
            "total_menu_items": MenuItem.objects.count(),
            "available_menu_items": MenuItem.objects.filter(is_available=True).count(),
            "total_orders": Order.objects.count(),
            "pending_orders": Order.objects.filter(status="Order Placed").count(),
            "preparing_orders": Order.objects.filter(status="Preparing").count(),
            "out_for_delivery": Order.objects.filter(status="Out for Delivery").count(),
            "delivered_orders": Order.objects.filter(status="Delivered").count(),
            "paid_orders": Order.objects.filter(payment_status="Paid").count(),
            "low_stock_items": InventoryItem.objects.filter(quantity__lte=10).count(),
            "total_revenue": float(total_revenue),
            "recent_orders": OrderSerializer(recent_orders, many=True).data,
        })


from .models import OrderItem  # noqa
