from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order
from .serializers import OrderSerializer

from menu.models import MenuItem
from inventory.models import InventoryItem
from accounts.models import Customer


class OrderListAPIView(generics.ListCreateAPIView):
    queryset = Order.objects.all().order_by("-order_date")
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

class OrderUpdateAPIView(generics.UpdateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        order = self.get_object()

        order.status = request.data.get("status", order.status)
        order.save()

        serializer = OrderSerializer(order)

        return Response(serializer.data)


class DashboardAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):

        recent_orders = Order.objects.order_by("-order_date")[:5]

        total_revenue = sum(
            order.total_amount for order in Order.objects.all()
        )

        return Response({
            "total_customers": Customer.objects.count(),
            "total_menu_items": MenuItem.objects.count(),
            "available_menu_items": MenuItem.objects.filter(
                is_available=True
            ).count(),
            "total_orders": Order.objects.count(),
            "pending_orders": Order.objects.filter(
                status="Pending"
            ).count(),
            "low_stock_items": InventoryItem.objects.filter(
                quantity__lte=10
            ).count(),
            "total_revenue": total_revenue,
            "recent_orders": OrderSerializer(
                recent_orders,
                many=True
            ).data,
        })