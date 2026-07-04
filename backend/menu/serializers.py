from rest_framework import serializers
from .models import Category, MenuItem, MenuItemRecipe
from inventory.models import InventoryItem


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class MenuItemRecipeSerializer(serializers.ModelSerializer):
    inventory_name = serializers.CharField(source="inventory_item.name", read_only=True)

    class Meta:
        model = MenuItemRecipe
        fields = ["id", "inventory_item", "inventory_name", "quantity_required"]


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    recipes = MenuItemRecipeSerializer(many=True, read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            "id", "category", "category_name", "name", "description",
            "price", "image", "rating", "is_available", "created_at", "recipes",
        ]


class MenuItemWriteSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    recipes = MenuItemRecipeSerializer(many=True, read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            "id", "category", "category_name", "name", "description",
            "price", "image", "rating", "is_available", "recipes",
        ]


class CategoryWithItemsSerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "items"]


class MenuItemRecipeWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItemRecipe
        fields = ["id", "menu_item", "inventory_item", "quantity_required"]
