"""
Shared custom DRF permission classes used across all apps.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminUser(BasePermission):
    """
    Allows access only to admin (superuser) users.
    """

    message = "Admin access required."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsAdminOrReadOnly(BasePermission):
    """
    Allows read-only access to any authenticated user,
    but write operations are restricted to admin (superuser) users.
    """

    message = "Admin access required for write operations."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsAdminOrPublicReadOnly(BasePermission):
    """
    Allows public read-only access (e.g. menu browsing without login),
    but write operations are restricted to admin (superuser) users.
    """

    message = "Admin access required for write operations."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)
