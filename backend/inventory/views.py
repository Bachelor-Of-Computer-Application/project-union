from django.db.models import F
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import IsAdminUser
from .models import InventoryItem
from .serializers import InventoryItemSerializer


class InventoryListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  — Admin only: list all inventory items (ordered by name).
    POST — Admin only: create a new inventory item.
    """

    queryset = InventoryItem.objects.all().order_by("name")
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAdminUser]


class InventoryDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / PUT / DELETE — Admin only: manage a specific inventory item."""

    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAdminUser]


class InventoryRestockAPIView(APIView):
    """
    POST — Admin only: add stock to an existing inventory item.

    Request body:
        { "quantity": <number>  }   (amount to ADD to current stock)

    After restocking, all menu items linked to this ingredient have their
    availability recalculated automatically.
    """

    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        item = get_object_or_404(InventoryItem, pk=pk)

        try:
            add_qty = float(request.data.get("quantity", 0))
        except (TypeError, ValueError):
            return Response(
                {"error": "quantity must be a positive number."},
                status=400,
            )

        if add_qty <= 0:
            return Response(
                {"error": "quantity must be greater than zero."},
                status=400,
            )

        item.quantity += add_qty
        item.save(update_fields=["quantity"])

        # Re-evaluate availability for every menu item that uses this ingredient
        from menu.models import MenuItemRecipe
        affected = (
            MenuItemRecipe.objects
            .filter(inventory_item=item)
            .select_related("menu_item")
        )
        for recipe in affected:
            recipe.menu_item.auto_availability()

        return Response(InventoryItemSerializer(item).data)


class InventoryStatsAPIView(APIView):
    """GET — Admin only: aggregate inventory statistics."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        low_stock = InventoryItem.objects.filter(quantity__lte=F("low_stock_limit"))
        return Response({
            "total_items": InventoryItem.objects.count(),
            "low_stock_items": low_stock.count(),
            "available_items": InventoryItem.objects.filter(quantity__gt=0).count(),
            "low_stock_names": list(low_stock.values_list("name", flat=True)),
        })
