from django.contrib import admin
from .models import Customer, Address, DeliveryMan


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


@admin.register(DeliveryMan)
class DeliveryManAdmin(admin.ModelAdmin):
    list_display = ["name", "username_display", "phone", "vehicle_number", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "phone", "user__username"]
    readonly_fields = ["created_at"]

    @admin.display(description="Username")
    def username_display(self, obj):
        return obj.user.username
