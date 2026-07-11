from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Customer, Address, DeliveryMan


# ── Customer ─────────────────────────────────────────────────────────────────

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


# ── DeliveryMan ───────────────────────────────────────────────────────────────

class DeliveryManSerializer(serializers.ModelSerializer):
    """
    Read serializer — includes denormalised username for display.
    Used in admin listings and the delivery man's own profile endpoint.
    """
    username = serializers.CharField(source="user.username", read_only=True)
    email    = serializers.EmailField(source="user.email",    read_only=True)

    class Meta:
        model = DeliveryMan
        fields = ["id", "username", "email", "name", "phone", "vehicle_number", "is_active", "created_at"]


class DeliveryManCreateSerializer(serializers.Serializer):
    """
    Write serializer used by admin to create a new delivery man account.
    Creates both the Django User and the linked DeliveryMan profile.
    """
    username       = serializers.CharField(max_length=150)
    email          = serializers.EmailField(required=False, allow_blank=True, default="")
    password       = serializers.CharField(write_only=True, min_length=6)
    name           = serializers.CharField(max_length=100)
    phone          = serializers.CharField(max_length=15)
    vehicle_number = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        delivery_man = DeliveryMan.objects.create(
            user=user,
            name=validated_data["name"],
            phone=validated_data["phone"],
            vehicle_number=validated_data.get("vehicle_number", ""),
        )
        return delivery_man


class DeliveryManUpdateSerializer(serializers.ModelSerializer):
    """
    Write serializer for updating a delivery man's own profile fields.
    Does NOT allow changing username or password (separate endpoints).
    """
    class Meta:
        model = DeliveryMan
        fields = ["name", "phone", "vehicle_number"]


# ── User (shared) ─────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    # Safe access — users without a Customer profile return null
    customer = serializers.SerializerMethodField()
    is_admin = serializers.BooleanField(source="is_superuser", read_only=True)
    # Delivery man role flag — true when the user has an active DeliveryMan profile
    is_delivery_man  = serializers.SerializerMethodField()
    delivery_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "is_active",
            "is_admin", "is_delivery_man",
            "customer", "delivery_profile",
        ]

    def get_customer(self, obj):
        try:
            return CustomerSerializer(obj.customer).data
        except Customer.DoesNotExist:
            return None

    def get_is_delivery_man(self, obj):
        try:
            return obj.delivery_profile.is_active
        except Exception:
            return False

    def get_delivery_profile(self, obj):
        try:
            return DeliveryManSerializer(obj.delivery_profile).data
        except Exception:
            return None


# ── Profile update / password change (shared) ────────────────────────────────

class ProfileUpdateSerializer(serializers.Serializer):
    """Allows the authenticated user to update their Customer profile fields."""

    name  = serializers.CharField(max_length=100, required=False)
    phone = serializers.CharField(max_length=15,  required=False)
    email = serializers.EmailField(required=False)

    def validate_email(self, value):
        user = self.context["request"].user
        if Customer.objects.exclude(user=user).filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value


class PasswordChangeSerializer(serializers.Serializer):
    """Allows the authenticated user to change their password."""

    current_password = serializers.CharField(write_only=True)
    new_password     = serializers.CharField(write_only=True, min_length=6)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
