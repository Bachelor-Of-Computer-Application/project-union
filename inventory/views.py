from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import InventoryItem
from .serializers import InventoryItemSerializer


class InventoryListCreateAPIView(generics.ListCreateAPIView):
    queryset = InventoryItem.objects.all().order_by("name")
    serializer_class = InventoryItemSerializer
    permission_classes = [AllowAny]


class InventoryDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [AllowAny]


class InventoryStatsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "total_items": InventoryItem.objects.count(),
            "low_stock_items": InventoryItem.objects.filter(quantity__lte=10).count(),
            "available_items": InventoryItem.objects.filter(quantity__gt=0).count(),
        })
