from rest_framework import serializers
from .models import MainCategory, MenuSection, MenuItem, MenuItemRecipe
from inventory.models import InventoryItem


# ── Level 3 helpers ──────────────────────────────────────────────────────────

class MenuItemRecipeSerializer(serializers.ModelSerializer):
    inventory_name = serializers.CharField(source="inventory_item.name", read_only=True)

    class Meta:
        model = MenuItemRecipe
        fields = ["id", "inventory_item", "inventory_name", "quantity_required"]


class MenuItemRecipeWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItemRecipe
        fields = ["id", "menu_item", "inventory_item", "quantity_required"]


# ── Level 3 — MenuItem ───────────────────────────────────────────────────────

class MenuItemSerializer(serializers.ModelSerializer):
    """
    Read serializer — includes denormalised section/main-category names
    and nested recipe list.  Used by public endpoints and admin GET.
    """
    section_name       = serializers.CharField(source="section.name",                    read_only=True)
    main_category_id   = serializers.IntegerField(source="section.main_category.id",     read_only=True)
    main_category_name = serializers.CharField(source="section.main_category.name",      read_only=True)
    recipes            = MenuItemRecipeSerializer(many=True, read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            "id",
            "section", "section_name",
            "main_category_id", "main_category_name",
            "name", "description",
            "price", "image", "rating", "is_available",
            "created_at", "recipes",
        ]


class MenuItemWriteSerializer(serializers.ModelSerializer):
    """
    Write serializer — accepts section FK for create/update.
    Returns the same denormalised fields as the read serializer.
    """
    section_name       = serializers.CharField(source="section.name",                read_only=True)
    main_category_id   = serializers.IntegerField(source="section.main_category.id", read_only=True)
    main_category_name = serializers.CharField(source="section.main_category.name",  read_only=True)
    recipes            = MenuItemRecipeSerializer(many=True, read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            "id",
            "section", "section_name",
            "main_category_id", "main_category_name",
            "name", "description",
            "price", "image", "rating", "is_available",
            "recipes",
        ]


# ── Level 2 — MenuSection ────────────────────────────────────────────────────

class MenuSectionSerializer(serializers.ModelSerializer):
    """Flat section — used for admin CRUD and cascading dropdowns."""
    main_category_name = serializers.CharField(source="main_category.name", read_only=True)

    class Meta:
        model = MenuSection
        fields = ["id", "main_category", "main_category_name", "name", "order"]


class MenuSectionWithItemsSerializer(serializers.ModelSerializer):
    """Section with its available items nested — used by the public menu."""
    items = serializers.SerializerMethodField()

    class Meta:
        model = MenuSection
        fields = ["id", "name", "order", "items"]

    def get_items(self, obj):
        # Only expose available items on the public menu
        qs = obj.items.filter(is_available=True)
        return MenuItemSerializer(qs, many=True, context=self.context).data


# ── Level 1 — MainCategory ───────────────────────────────────────────────────

class MainCategorySerializer(serializers.ModelSerializer):
    """Flat main-category — used for admin CRUD and dropdown population."""
    section_count = serializers.IntegerField(source="sections.count", read_only=True)

    class Meta:
        model = MainCategory
        fields = ["id", "name", "order", "section_count"]


class MainCategoryWithSectionsSerializer(serializers.ModelSerializer):
    """
    Full nested tree — MainCategory › sections › items.
    Used by the public /menu/full/ endpoint so the frontend fetches
    everything in one request.
    """
    sections = MenuSectionWithItemsSerializer(many=True, read_only=True)

    class Meta:
        model = MainCategory
        fields = ["id", "name", "order", "sections"]
