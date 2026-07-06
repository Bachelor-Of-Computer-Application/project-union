from django.urls import path
from .views import (
    CategoryListAPIView,
    CategoryWithItemsAPIView,
    CategoryManageAPIView,
    CategoryManageDetailAPIView,
    MenuItemListAPIView,
    MenuItemDetailAPIView,
    MenuItemManageAPIView,
    MenuItemManageDetailAPIView,
    MenuItemRecipeListCreateAPIView,
    MenuItemRecipeDetailAPIView,
)

urlpatterns = [
    # Public category endpoints
    path("categories/", CategoryListAPIView.as_view(), name="categories"),
    path("categories/with-items/", CategoryWithItemsAPIView.as_view(), name="categories-with-items"),

    # Admin-only category CRUD
    path("categories/manage/", CategoryManageAPIView.as_view(), name="category-manage"),
    path("categories/manage/<int:pk>/", CategoryManageDetailAPIView.as_view(), name="category-manage-detail"),

    # Public menu item endpoints
    path("items/", MenuItemListAPIView.as_view(), name="menu-items"),
    path("items/<int:pk>/", MenuItemDetailAPIView.as_view(), name="menu-item-detail"),

    # Admin-only menu item CRUD
    path("manage/", MenuItemManageAPIView.as_view(), name="menu-manage"),
    path("manage/<int:pk>/", MenuItemManageDetailAPIView.as_view(), name="menu-manage-detail"),

    # Admin-only recipe management
    path("recipes/", MenuItemRecipeListCreateAPIView.as_view(), name="recipes"),
    path("recipes/<int:pk>/", MenuItemRecipeDetailAPIView.as_view(), name="recipe-detail"),
]
