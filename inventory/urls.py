from django.urls import path
from .views import InventoryListAPIView, InventoryStatsAPIView

urlpatterns = [
    path('items/', InventoryListAPIView.as_view()),
    path('stats/', InventoryStatsAPIView.as_view()),
]