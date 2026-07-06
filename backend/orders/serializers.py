from rest_framework import serializers

from .models import Cart, CartItem, Order, OrderItem


# ──────────────────────────────────────────────
# Cart serializers
# ──────────────────────────────────────────────

class CartItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="menu_item.name", read_only=True)
    item_price = serializers.DecimalField(
        source="menu_item.price", read_only=True, max_digits=10, decimal_places=2
    )
    item_image = serializers.ImageField(source="menu_item.image", read_only=True)
    total_price = serializers.DecimalField(read_only=True, max_digits=10, decimal_places=2)

    class Meta:
        model = CartItem
        fields = ["id", "menu_item", "item_name", "item_price", "item_image", "quantity", "total_price"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(read_only=True, max_digits=10, decimal_places=2)

    class Meta:
        model = Cart
        fields = ["id", "items", "total_price", "updated_at"]


class CartItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ["menu_item", "quantity"]


# ──────────────────────────────────────────────
# Order serializers
# ──────────────────────────────────────────────

class OrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="menu_item.name", read_only=True)
    item_price = serializers.DecimalField(
        source="unit_price", read_only=True, max_digits=10, decimal_places=2
    )

    class Meta:
        model = OrderItem
        fields = ["id", "menu_item", "item_name", "item_price", "quantity"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    delivery_address_detail = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "customer",
            "customer_name",
            "delivery_address",
            "delivery_address_detail",
            "order_date",
            "status",
            "total_amount",
            "payment_method",
            "payment_status",
            "notes",
            "items",
        ]
        extra_kwargs = {
            "customer": {"read_only": True},
            "total_amount": {"read_only": True},
        }

    def get_delivery_address_detail(self, obj):
        if obj.delivery_address:
            return {
                "label": obj.delivery_address.label,
                "full_address": obj.delivery_address.full_address,
                "city": obj.delivery_address.city,
            }
        return None


class OrderCreateSerializer(serializers.Serializer):
    delivery_address_id = serializers.IntegerField()
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_delivery_address_id(self, value):
        from accounts.models import Address
        user = self.context["request"].user
        if not Address.objects.filter(id=value, customer__user=user).exists():
            raise serializers.ValidationError("Address not found.")
        return value


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    """Used by both customer (status) and admin (status + payment_status) update flows."""

    class Meta:
        model = Order
        fields = ["status", "payment_status"]
        # Both fields optional so partial updates work
        extra_kwargs = {
            "status": {"required": False},
            "payment_status": {"required": False},
        }
