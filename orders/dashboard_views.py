from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Customer
from menu.models import MenuItem
from orders.models import Order


class DashboardAPIView(APIView):

    def get(self, request):

        total_customers = Customer.objects.count()
        total_orders = Order.objects.count()
        total_menu_items = MenuItem.objects.count()

        total_revenue = sum(
            order.total_amount
            for order in Order.objects.all()
        )

        return Response({
            "total_customers": total_customers,
            "total_orders": total_orders,
            "total_menu_items": total_menu_items,
            "total_revenue": total_revenue
        })