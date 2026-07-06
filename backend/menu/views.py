from rest_framework import generics, filters
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend

from config.permissions import IsAdminUser
from .models import Category, MenuItem, MenuItemRecipe
from .serializers import (
    CategorySerializer,
    CategoryWithItemsSerializer,
    MenuItemSerializer,
    MenuItemWriteSerializer,
    MenuItemRecipeWriteSerializer,
)


# ──────────────────────────────────────────────
# Category views
# ──────────────────────────────────────────────

class CategoryListAPIView(generics.ListAPIView):
    """GET — Public: list all categories."""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class CategoryWithItemsAPIView(generics.ListAPIView):
    """GET — Public: list all categories with their available menu items nested."""

    queryset = Category.objects.prefetch_related("items").all()
    serializer_class = CategoryWithItemsSerializer
    permission_classes = [AllowAny]


class CategoryManageAPIView(generics.ListCreateAPIView):
    """
    GET  — Admin only: list all categories.
    POST — Admin only: create a new category.
    """

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]


class CategoryManageDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / PUT / DELETE — Admin only: manage a specific category."""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]


# ──────────────────────────────────────────────
# Menu item views
# ──────────────────────────────────────────────

class MenuItemListAPIView(generics.ListAPIView):
    """
    GET — Public: list all available menu items.
    Supports filtering by category, search by name/description, and ordering.
    """

    queryset = MenuItem.objects.filter(is_available=True).select_related("category")
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "is_available"]
    search_fields = ["name", "description", "category__name"]
    ordering_fields = ["price", "rating", "name"]


class MenuItemDetailAPIView(generics.RetrieveAPIView):
    """GET — Public: retrieve a single menu item by ID."""

    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]


class MenuItemManageAPIView(generics.ListCreateAPIView):
    """
    GET  — Admin only: list all menu items (including unavailable).
    POST — Admin only: create a new menu item.
    """

    queryset = MenuItem.objects.all().select_related("category")
    serializer_class = MenuItemWriteSerializer
    permission_classes = [IsAdminUser]


class MenuItemManageDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / PUT / DELETE — Admin only: manage a specific menu item."""

    queryset = MenuItem.objects.all()
    serializer_class = MenuItemWriteSerializer
    permission_classes = [IsAdminUser]


# ──────────────────────────────────────────────
# Recipe views
# ──────────────────────────────────────────────

class MenuItemRecipeListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  — Admin only: list all menu item recipes (ingredient mappings).
    POST — Admin only: create a new recipe entry and auto-update availability.
    """

    queryset = MenuItemRecipe.objects.select_related("menu_item", "inventory_item").all()
    serializer_class = MenuItemRecipeWriteSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        recipe = serializer.save()
        recipe.menu_item.auto_availability()


class MenuItemRecipeDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / PUT / DELETE — Admin only: manage a recipe entry."""

    queryset = MenuItemRecipe.objects.all()
    serializer_class = MenuItemRecipeWriteSerializer
    permission_classes = [IsAdminUser]

    def perform_update(self, serializer):
        recipe = serializer.save()
        recipe.menu_item.auto_availability()

    def perform_destroy(self, instance):
        menu_item = instance.menu_item
        instance.delete()
        menu_item.auto_availability()
