from rest_framework import serializers
from .models import Category, MenuItem


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            "id", "category", "category_name", "name", "description",
            "price", "image", "rating", "is_available", "created_at",
        ]


class MenuItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = [
            "category", "name", "description", "price", "image",
            "rating", "is_available",
        ]


class CategoryWithItemsSerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "items"]
