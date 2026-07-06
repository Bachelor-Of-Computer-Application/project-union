from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Customer, Address


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    name = serializers.CharField()
    phone = serializers.CharField()

    class Meta:
        model = User
        fields = ["username", "email", "password", "name", "phone"]

    def create(self, validated_data):
        name = validated_data.pop("name")
        phone = validated_data.pop("phone")
        user = User.objects.create_user(**validated_data)
        Customer.objects.create(user=user, name=name, email=validated_data["email"], phone=phone)
        return user


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ["id", "name", "email", "phone", "phone_verified", "created_at"]


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ["id", "label", "full_address", "city", "is_default"]


class UserSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    is_admin = serializers.BooleanField(source="is_superuser", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "is_active", "is_admin", "customer"]


class ProfileUpdateSerializer(serializers.Serializer):
    """Allows the authenticated user to update their Customer profile fields."""

    name = serializers.CharField(max_length=100, required=False)
    phone = serializers.CharField(max_length=15, required=False)
    email = serializers.EmailField(required=False)

    def validate_email(self, value):
        from .models import Customer
        user = self.context["request"].user
        if Customer.objects.exclude(user=user).filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value


class PasswordChangeSerializer(serializers.Serializer):
    """Allows the authenticated user to change their password."""

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
