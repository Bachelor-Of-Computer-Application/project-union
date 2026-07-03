from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import MenuItem
from .serializers import MenuItemSerializer


class MenuItemListAPIView(generics.ListAPIView):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]