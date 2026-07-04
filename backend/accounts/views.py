from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer, UserSerializer, AddressSerializer
from .models import Customer, Address


class RegisterAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = []


class UserDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class AddressListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(customer__user=self.request.user)

    def perform_create(self, serializer):
        customer = Customer.objects.get(user=self.request.user)
        serializer.save(customer=customer)


class AddressDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(customer__user=self.request.user)


class AdminUserListAPIView(generics.ListAPIView):
    queryset = User.objects.all().select_related("customer").order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response({"error": "Admin access required"}, status=403)
        return super().get(request, *args, **kwargs)


class AdminUserDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        if not request.user.is_superuser:
            return Response({"error": "Admin access required"}, status=403)
        try:
            user = User.objects.select_related("customer").get(id=user_id)
            return Response(UserSerializer(user).data)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

    def patch(self, request, user_id):
        if not request.user.is_superuser:
            return Response({"error": "Admin access required"}, status=403)
        try:
            user = User.objects.get(id=user_id)
            if "is_active" in request.data:
                user.is_active = request.data["is_active"]
                user.save()
            return Response(UserSerializer(user).data)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)


class AdminPaymentsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_superuser:
            return Response({"error": "Admin access required"}, status=403)
        from orders.models import Order
        payments = Order.objects.all().order_by("-order_date").values(
            "id", "customer__name", "total_amount", "payment_method",
            "payment_status", "order_date"
        )
        return Response(list(payments))
