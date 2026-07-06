from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from config.permissions import IsAdminUser
from .models import Address, Customer
from .serializers import (
    AddressSerializer,
    PasswordChangeSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
)


class RegisterAPIView(generics.CreateAPIView):
    """POST — Public: register a new user and create the associated Customer profile."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = []


class UserDetailAPIView(APIView):
    """GET — Returns the currently authenticated user's profile."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ProfileUpdateAPIView(APIView):
    """
    PATCH — Update the authenticated user's name, phone, and/or email.
    The Customer record is updated; the Django User email is kept in sync.
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        customer = get_object_or_404(Customer, user=request.user)
        if "name" in data:
            customer.name = data["name"]
        if "phone" in data:
            customer.phone = data["phone"]
        if "email" in data:
            customer.email = data["email"]
            request.user.email = data["email"]
            request.user.save(update_fields=["email"])
        customer.save()

        return Response(UserSerializer(request.user).data)


class PasswordChangeAPIView(APIView):
    """POST — Change the authenticated user's password."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()
        return Response({"detail": "Password changed successfully."})


class AddressListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  — List the authenticated user's delivery addresses.
    POST — Add a new delivery address.
    """

    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(customer__user=self.request.user)

    def perform_create(self, serializer):
        customer = get_object_or_404(Customer, user=self.request.user)
        serializer.save(customer=customer)


class AddressDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / PUT / DELETE — Manage a specific delivery address."""

    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(customer__user=self.request.user)


# ──────────────────────────────────────────────
# Admin views
# ──────────────────────────────────────────────

class AdminUserListAPIView(generics.ListAPIView):
    """GET — Admin only: list all registered users."""

    queryset = User.objects.all().select_related("customer").order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class AdminUserDetailAPIView(APIView):
    """
    GET   — Admin only: retrieve a user's full profile.
    PATCH — Admin only: update a user's is_active flag.
    """

    permission_classes = [IsAdminUser]

    def get(self, request, user_id):
        try:
            user = User.objects.select_related("customer").get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserSerializer(user).data)

    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if "is_active" in request.data:
            user.is_active = bool(request.data["is_active"])
            user.save(update_fields=["is_active"])

        return Response(UserSerializer(user).data)


class AdminPaymentsAPIView(APIView):
    """GET — Admin only: list all orders with payment information."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        from orders.models import Order
        payments = (
            Order.objects
            .order_by("-order_date")
            .values(
                "id",
                "customer__name",
                "total_amount",
                "payment_method",
                "payment_status",
                "order_date",
            )
        )
        return Response(list(payments))
