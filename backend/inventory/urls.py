from django.urls import path
from .views import (
    InventoryListCreateAPIView,
    InventoryDetailAPIView,
    InventoryRestockAPIView,
    InventoryStatsAPIView,
)

urlpatterns = [
    path("", InventoryListCreateAPIView.as_view(), name="inventory"),
    path("<int:pk>/", InventoryDetailAPIView.as_view(), name="inventory-detail"),
    path("<int:pk>/restock/", InventoryRestockAPIView.as_view(), name="inventory-restock"),
    path("stats/", InventoryStatsAPIView.as_view(), name="inventory-stats"),
]
