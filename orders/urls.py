from django.urls import path
from .views import (
    OrderListAPIView,
    OrderUpdateAPIView,
    DashboardAPIView,
)

urlpatterns = [
    path("", OrderListAPIView.as_view(), name="orders"),
    path("dashboard/", DashboardAPIView.as_view(), name="dashboard"),
    path("<int:pk>/", OrderUpdateAPIView.as_view(), name="order-update"),
]