from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import InventoryItem
from .serializers import InventoryItemSerializer


# List all inventory items
class InventoryListAPIView(generics.ListAPIView):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer


# Dashboard stats API
class InventoryStatsAPIView(APIView):
    def get(self, request):
        total_items = InventoryItem.objects.count()
        low_stock_items = InventoryItem.objects.filter(quantity__lte=10).count()
        available_items = InventoryItem.objects.filter(quantity__gt=0).count()

        return Response({
            "total_items": total_items,
            "low_stock_items": low_stock_items,
            "available_items": available_items
        })
