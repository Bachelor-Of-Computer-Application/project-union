from django.urls import path
from .views import (
    MenuItemListAPIView, MenuItemDetailAPIView,
    MenuItemManageAPIView, MenuItemManageDetailAPIView,
    CategoryListAPIView, CategoryWithItemsAPIView,
)

urlpatterns = [
    path("items/", MenuItemListAPIView.as_view(), name="menu-items"),
    path("items/<int:pk>/", MenuItemDetailAPIView.as_view(), name="menu-item-detail"),
    path("manage/", MenuItemManageAPIView.as_view(), name="menu-manage"),
    path("manage/<int:pk>/", MenuItemManageDetailAPIView.as_view(), name="menu-manage-detail"),
    path("categories/", CategoryListAPIView.as_view(), name="categories"),
    path("categories/with-items/", CategoryWithItemsAPIView.as_view(), name="categories-with-items"),
]
