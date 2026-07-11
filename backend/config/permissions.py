"""
Shared custom DRF permission classes used across all apps.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminUser(BasePermission):
    """Allows access only to admin (superuser) users."""

    message = "Admin access required."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsDeliveryMan(BasePermission):
    """
    Allows access only to users that have a DeliveryMan profile and are active.
    Admins are NOT automatically granted delivery-man access — they use their
    own admin endpoints.
    """

    message = "Delivery man access required."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        try:
            return request.user.delivery_profile.is_active
        except Exception:
            return False


class IsAdminOrDeliveryMan(BasePermission):
    """
    Allows access to admins OR active delivery men.
    Used on shared order-related endpoints.
    """

    message = "Admin or delivery man access required."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        try:
            return request.user.delivery_profile.is_active
        except Exception:
            return False


class IsAdminOrReadOnly(BasePermission):
    """
    Allows read-only access to any authenticated user;
    write operations are restricted to admin (superuser) users.
    """

    message = "Admin access required for write operations."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsAdminOrPublicReadOnly(BasePermission):
    """
    Allows public read-only access (e.g. menu browsing without login);
    write operations are restricted to admin (superuser) users.
    """

    message = "Admin access required for write operations."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)
