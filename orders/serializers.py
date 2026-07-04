from rest_framework import serializers
from .models import Order


class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.name",
        read_only=True
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "customer",
            "customer_name",
            "status",
            "payment_method",
            "payment_status",
            "total_amount",
            "order_date",
        ]

        extra_kwargs = {
            "customer": {"required": False},
            "total_amount": {"required": False},
            "payment_method": {"required": False},
            "payment_status": {"required": False},
        }