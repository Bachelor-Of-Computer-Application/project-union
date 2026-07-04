from django.contrib import admin
from .models import Customer, Address


class AddressInline(admin.TabularInline):
    model = Address
    extra = 1


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "phone", "phone_verified", "created_at"]
    list_filter = ["phone_verified"]
    search_fields = ["name", "email", "phone"]
    inlines = [AddressInline]


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ["label", "customer", "city", "is_default"]
    list_filter = ["is_default", "city"]
