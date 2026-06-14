from rest_framework import generics
from .models import MenuItem
from .serializers import MenuItemSerializer


class MenuItemListAPIView(generics.ListAPIView):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer

