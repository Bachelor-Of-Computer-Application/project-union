from rest_framework import generics, filters
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from config.permissions import IsAdminUser
from .models import MainCategory, MenuSection, MenuItem, MenuItemRecipe
from .serializers import (
    MainCategorySerializer,
    MainCategoryWithSectionsSerializer,
    MenuSectionSerializer,
    MenuSectionWithItemsSerializer,
    MenuItemSerializer,
    MenuItemWriteSerializer,
    MenuItemRecipeWriteSerializer,
)


# ══════════════════════════════════════════════════════════════════════════════
# Public endpoints  (AllowAny)
# ══════════════════════════════════════════════════════════════════════════════

class MenuFullAPIView(generics.ListAPIView):
    """
    GET /menu/full/
    Returns the complete three-level tree:
        MainCategory › MenuSection › MenuItem (available only)

    The frontend calls this once on mount to populate the entire menu page.
    """
    serializer_class = MainCategoryWithSectionsSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return (
            MainCategory.objects
            .prefetch_related("sections__items__recipes")
            .all()
        )


class MainCategoryListAPIView(generics.ListAPIView):
    """
    GET /menu/main-categories/
    Flat list of main categories — used to populate Level-1 tabs.
    """
    queryset = MainCategory.objects.all()
    serializer_class = MainCategorySerializer
    permission_classes = [AllowAny]


class MenuSectionListAPIView(generics.ListAPIView):
    """
    GET /menu/sections/?main_category=<id>
    Flat list of sections, optionally filtered by main_category.
    Used for the Level-2 pills and for the admin cascading dropdown.
    """
    serializer_class = MenuSectionSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["main_category"]

    def get_queryset(self):
        return MenuSection.objects.select_related("main_category").all()


class MenuItemListAPIView(generics.ListAPIView):
    """
    GET /menu/items/?section=<id>&main_category=<id>&search=<q>
    Public list of AVAILABLE menu items with search + filter support.
    """
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["section", "section__main_category", "is_available"]
    search_fields = ["name", "description", "section__name", "section__main_category__name"]
    ordering_fields = ["price", "rating", "name"]

    def get_queryset(self):
        return (
            MenuItem.objects
            .filter(is_available=True)
            .select_related("section__main_category")
        )


class MenuItemDetailAPIView(generics.RetrieveAPIView):
    """GET /menu/items/<pk>/ — public single item detail."""
    queryset = MenuItem.objects.select_related("section__main_category")
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]


# ══════════════════════════════════════════════════════════════════════════════
# Admin — MainCategory CRUD
# ══════════════════════════════════════════════════════════════════════════════

class MainCategoryManageAPIView(generics.ListCreateAPIView):
    """
    GET  /menu/admin/main-categories/      — list
    POST /menu/admin/main-categories/      — create
    """
    queryset = MainCategory.objects.all()
    serializer_class = MainCategorySerializer
    permission_classes = [IsAdminUser]


class MainCategoryManageDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET / PATCH / DELETE /menu/admin/main-categories/<pk>/
    """
    queryset = MainCategory.objects.all()
    serializer_class = MainCategorySerializer
    permission_classes = [IsAdminUser]


# ══════════════════════════════════════════════════════════════════════════════
# Admin — MenuSection CRUD
# ══════════════════════════════════════════════════════════════════════════════

class MenuSectionManageAPIView(generics.ListCreateAPIView):
    """
    GET  /menu/admin/sections/             — list (filterable by main_category)
    POST /menu/admin/sections/             — create
    """
    serializer_class = MenuSectionSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["main_category"]

    def get_queryset(self):
        return MenuSection.objects.select_related("main_category").all()


class MenuSectionManageDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET / PATCH / DELETE /menu/admin/sections/<pk>/
    """
    queryset = MenuSection.objects.select_related("main_category").all()
    serializer_class = MenuSectionSerializer
    permission_classes = [IsAdminUser]


# ══════════════════════════════════════════════════════════════════════════════
# Admin — MenuItem CRUD
# ══════════════════════════════════════════════════════════════════════════════

class MenuItemManageAPIView(generics.ListCreateAPIView):
    """
    GET  /menu/admin/items/                — list ALL items (incl. unavailable)
    POST /menu/admin/items/                — create
    """
    serializer_class = MenuItemWriteSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["section", "section__main_category", "is_available"]
    search_fields = ["name", "description"]

    def get_queryset(self):
        return MenuItem.objects.select_related("section__main_category").all()


class MenuItemManageDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET / PATCH / DELETE /menu/admin/items/<pk>/
    """
    queryset = MenuItem.objects.select_related("section__main_category").all()
    serializer_class = MenuItemWriteSerializer
    permission_classes = [IsAdminUser]


# ══════════════════════════════════════════════════════════════════════════════
# Admin — MenuItemRecipe CRUD  (unchanged logic, new URLs)
# ══════════════════════════════════════════════════════════════════════════════

class MenuItemRecipeListCreateAPIView(generics.ListCreateAPIView):
    queryset = MenuItemRecipe.objects.select_related("menu_item", "inventory_item").all()
    serializer_class = MenuItemRecipeWriteSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        recipe = serializer.save()
        recipe.menu_item.auto_availability()


class MenuItemRecipeDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
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


# ══════════════════════════════════════════════════════════════════════════════
# Legacy compatibility shim
# Keeps GET /menu/categories/with-items/ working so any cached frontend
# requests don't immediately 404.  Returns MainCategories shaped like the
# old Category+items response so old code degrades gracefully.
# ══════════════════════════════════════════════════════════════════════════════

class LegacyCategoriesWithItemsAPIView(APIView):
    """
    GET /menu/categories/with-items/
    Deprecated — returns a flat list of sections shaped like the old
    {id, name, items[]} response so old frontend code still renders.
    Remove once the new MenuPage is deployed.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        sections = (
            MenuSection.objects
            .prefetch_related("items")
            .all()
        )
        data = []
        for s in sections:
            data.append({
                "id": s.id,
                "name": s.name,
                "items": MenuItemSerializer(
                    s.items.filter(is_available=True), many=True, context={"request": request}
                ).data,
            })
        return Response(data)
