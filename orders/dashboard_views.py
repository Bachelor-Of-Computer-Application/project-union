from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Customer
from menu.models import MenuItem
from inventory.models import InventoryItem
from orders.models import Order
from .serializers import OrderSerializer


class DashboardAPIView(APIView):

    def get(self, request):

        total_customers = Customer.objects.count()
        total_orders = Order.objects.count()
        total_menu_items = MenuItem.objects.count()
        available_menu_items = MenuItem.objects.filter(
            is_available=True
        ).count()
        pending_orders = Order.objects.filter(
            status="Pending"
        ).count()
        low_stock_items = InventoryItem.objects.filter(
            quantity__lte=10
        ).count()

        total_revenue = sum(
            order.total_amount
            for order in Order.objects.all()
        )

        recent_orders = Order.objects.order_by("-order_date")[:5]

        return Response({
            "total_customers": total_customers,
            "total_orders": total_orders,
            "total_menu_items": total_menu_items,
            "available_menu_items": available_menu_items,
            "pending_orders": pending_orders,
            "low_stock_items": low_stock_items,
            "total_revenue": total_revenue,
            "recent_orders": OrderSerializer(recent_orders, many=True).data,
        })