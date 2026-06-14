from django.urls import path
from .views import OrderListAPIView
from .dashboard_views import DashboardAPIView

urlpatterns = [
    path('orders/', OrderListAPIView.as_view()),
    path('dashboard/', DashboardAPIView.as_view()),
]