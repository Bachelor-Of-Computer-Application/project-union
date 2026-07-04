from django.contrib import admin
from .models import Category, MenuItem, MenuItemRecipe


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name"]
    search_fields = ["name"]


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "price", "rating", "is_available"]
    list_filter = ["category", "is_available"]
    search_fields = ["name", "description"]


@admin.register(MenuItemRecipe)
class MenuItemRecipeAdmin(admin.ModelAdmin):
    list_display = ["menu_item", "inventory_item", "quantity_required"]
    list_filter = ["inventory_item"]
