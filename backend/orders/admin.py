from django.contrib import admin
from .models import Order, OrderItem, Cart, CartItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    readonly_fields = ["unit_price"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "customer", "status", "total_amount", "payment_method", "payment_status", "order_date"]
    list_filter = ["status", "payment_status", "payment_method"]
    search_fields = ["customer__name", "id"]
    inlines = [OrderItemInline]
    readonly_fields = ["total_amount", "order_date"]


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 1


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ["customer", "total_price", "updated_at"]
    inlines = [CartItemInline]
