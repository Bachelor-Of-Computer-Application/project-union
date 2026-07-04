from django.contrib import admin
from .models import InventoryItem


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ["name", "quantity", "unit", "low_stock_limit", "is_low_stock"]
    list_filter = ["unit"]
    search_fields = ["name"]
