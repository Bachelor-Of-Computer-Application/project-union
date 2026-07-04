from rest_framework import generics, filters
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import MenuItem, Category
from .serializers import MenuItemSerializer, MenuItemWriteSerializer, CategorySerializer, CategoryWithItemsSerializer


class MenuItemListAPIView(generics.ListAPIView):
    queryset = MenuItem.objects.filter(is_available=True).select_related("category")
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "is_available"]
    search_fields = ["name", "description", "category__name"]
    ordering_fields = ["price", "rating", "name"]


class MenuItemDetailAPIView(generics.RetrieveAPIView):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]


class MenuItemManageAPIView(generics.ListCreateAPIView):
    queryset = MenuItem.objects.all().select_related("category")
    serializer_class = MenuItemWriteSerializer
    permission_classes = [IsAuthenticated]


class MenuItemManageDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemWriteSerializer
    permission_classes = [IsAuthenticated]


class CategoryListAPIView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class CategoryWithItemsAPIView(generics.ListAPIView):
    queryset = Category.objects.prefetch_related("items").all()
    serializer_class = CategoryWithItemsSerializer
    permission_classes = [AllowAny]
