from django.urls import path
from .views import (
    CartDetailAPIView, CartAddItemAPIView, CartUpdateItemAPIView, CartRemoveItemAPIView,
    CheckoutAPIView,
    OrderListAPIView, OrderDetailAPIView, OrderUpdateStatusAPIView,
    AdminOrderListAPIView, AdminOrderUpdateAPIView,
    DashboardAPIView,
)

urlpatterns = [
    path("cart/", CartDetailAPIView.as_view(), name="cart-detail"),
    path("cart/add/", CartAddItemAPIView.as_view(), name="cart-add"),
    path("cart/item/<int:item_id>/", CartUpdateItemAPIView.as_view(), name="cart-update"),
    path("cart/item/<int:item_id>/remove/", CartRemoveItemAPIView.as_view(), name="cart-remove"),
    path("checkout/", CheckoutAPIView.as_view(), name="checkout"),
    path("", OrderListAPIView.as_view(), name="orders"),
    path("<int:pk>/", OrderDetailAPIView.as_view(), name="order-detail"),
    path("<int:pk>/status/", OrderUpdateStatusAPIView.as_view(), name="order-status"),
    path("admin/all/", AdminOrderListAPIView.as_view(), name="admin-orders"),
    path("admin/<int:pk>/", AdminOrderUpdateAPIView.as_view(), name="admin-order-update"),
    path("dashboard/", DashboardAPIView.as_view(), name="dashboard"),
]
