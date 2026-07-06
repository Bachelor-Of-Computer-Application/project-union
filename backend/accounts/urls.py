from django.urls import path
from .views import (
    RegisterAPIView,
    UserDetailAPIView,
    ProfileUpdateAPIView,
    PasswordChangeAPIView,
    AddressListCreateAPIView,
    AddressDetailAPIView,
    AdminUserListAPIView,
    AdminUserDetailAPIView,
    AdminPaymentsAPIView,
)

urlpatterns = [
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("me/", UserDetailAPIView.as_view(), name="user-detail"),
    path("me/update/", ProfileUpdateAPIView.as_view(), name="profile-update"),
    path("me/change-password/", PasswordChangeAPIView.as_view(), name="change-password"),
    path("addresses/", AddressListCreateAPIView.as_view(), name="address-list"),
    path("addresses/<int:pk>/", AddressDetailAPIView.as_view(), name="address-detail"),
    path("admin/users/", AdminUserListAPIView.as_view(), name="admin-users"),
    path("admin/users/<int:user_id>/", AdminUserDetailAPIView.as_view(), name="admin-user-detail"),
    path("admin/payments/", AdminPaymentsAPIView.as_view(), name="admin-payments"),
]
