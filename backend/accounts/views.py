from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from config.permissions import IsAdminUser
from .models import Address, Customer, DeliveryMan
from .serializers import (
    AddressSerializer,
    PasswordChangeSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
    DeliveryManSerializer,
    DeliveryManCreateSerializer,
    DeliveryManUpdateSerializer,
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
    The Customer or DeliveryMan record is updated; the Django User email is kept in sync.
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        
        # Check if the user is a delivery man
        is_delivery = hasattr(user, 'delivery_profile') and user.delivery_profile is not None
        
        if is_delivery:
            delivery_man = user.delivery_profile
            data = request.data
            
            if "name" in data:
                delivery_man.name = data["name"]
            if "phone" in data:
                delivery_man.phone = data["phone"]
            if "vehicle_number" in data:
                delivery_man.vehicle_number = data["vehicle_number"]
            
            if "email" in data:
                email = data["email"]
                if email and User.objects.exclude(pk=user.pk).filter(email=email).exists():
                    return Response({"email": ["This email is already in use."]}, status=400)
                user.email = email
                user.save(update_fields=["email"])
                
            delivery_man.save()
            return Response(UserSerializer(user).data)
            
        else:
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


class AdminDeliveryManListCreateAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        delivery_men = DeliveryMan.objects.all().order_by("-created_at")
        serializer = DeliveryManSerializer(delivery_men, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DeliveryManCreateSerializer(data=request.data)

        if serializer.is_valid():
            delivery_man = serializer.save()
            return Response(
                DeliveryManSerializer(delivery_man).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminDeliveryManDetailAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        delivery_man = get_object_or_404(DeliveryMan, pk=pk)
        return Response(DeliveryManSerializer(delivery_man).data)

    def patch(self, request, pk):
        delivery_man = get_object_or_404(DeliveryMan, pk=pk)

        serializer = DeliveryManUpdateSerializer(
            delivery_man,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()
            return Response(DeliveryManSerializer(delivery_man).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        delivery_man = get_object_or_404(DeliveryMan, pk=pk)
        delivery_man.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
