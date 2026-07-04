from django.urls import path

from .views import (
    InventoryListCreateAPIView,
    InventoryDetailAPIView,
    InventoryStatsAPIView,
)

urlpatterns = [
    path("", InventoryListCreateAPIView.as_view(), name="inventory"),
    path("<int:pk>/", InventoryDetailAPIView.as_view(), name="inventory-detail"),
    path("stats/", InventoryStatsAPIView.as_view(), name="inventory-stats"),
]