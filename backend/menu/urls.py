from django.urls import path
from .views import (
    # Public
    MenuFullAPIView,
    MainCategoryListAPIView,
    MenuSectionListAPIView,
    MenuItemListAPIView,
    MenuItemDetailAPIView,
    # Admin — main categories
    MainCategoryManageAPIView,
    MainCategoryManageDetailAPIView,
    # Admin — sections
    MenuSectionManageAPIView,
    MenuSectionManageDetailAPIView,
    # Admin — items
    MenuItemManageAPIView,
    MenuItemManageDetailAPIView,
    # Admin — recipes
    MenuItemRecipeListCreateAPIView,
    MenuItemRecipeDetailAPIView,
    # Legacy shim
    LegacyCategoriesWithItemsAPIView,
)

urlpatterns = [

    # ── Public ────────────────────────────────────────────────────────────
    # Full nested tree (one call for the entire menu page)
    path("full/",             MenuFullAPIView.as_view(),           name="menu-full"),

    # Level-1 flat list
    path("main-categories/",  MainCategoryListAPIView.as_view(),   name="main-categories"),

    # Level-2 flat list — ?main_category=<id> to filter
    path("sections/",         MenuSectionListAPIView.as_view(),    name="menu-sections"),

    # Level-3 flat list — ?section=<id> or ?section__main_category=<id>
    path("items/",            MenuItemListAPIView.as_view(),       name="menu-items"),
    path("items/<int:pk>/",   MenuItemDetailAPIView.as_view(),     name="menu-item-detail"),

    # ── Admin — MainCategory CRUD ─────────────────────────────────────────
    path("admin/main-categories/",
         MainCategoryManageAPIView.as_view(),          name="admin-main-categories"),
    path("admin/main-categories/<int:pk>/",
         MainCategoryManageDetailAPIView.as_view(),    name="admin-main-category-detail"),

    # ── Admin — MenuSection CRUD ──────────────────────────────────────────
    path("admin/sections/",
         MenuSectionManageAPIView.as_view(),           name="admin-sections"),
    path("admin/sections/<int:pk>/",
         MenuSectionManageDetailAPIView.as_view(),     name="admin-section-detail"),

    # ── Admin — MenuItem CRUD ─────────────────────────────────────────────
    path("admin/items/",
         MenuItemManageAPIView.as_view(),              name="admin-menu-items"),
    path("admin/items/<int:pk>/",
         MenuItemManageDetailAPIView.as_view(),        name="admin-menu-item-detail"),

    # ── Admin — Recipe CRUD ───────────────────────────────────────────────
    path("recipes/",          MenuItemRecipeListCreateAPIView.as_view(), name="recipes"),
    path("recipes/<int:pk>/", MenuItemRecipeDetailAPIView.as_view(),     name="recipe-detail"),

    # ── Legacy shim (keep old frontend working during transition) ─────────
    path("categories/with-items/", LegacyCategoriesWithItemsAPIView.as_view(),
         name="legacy-categories-with-items"),

    # ── Legacy admin category manage (returns main-categories now) ────────
    path("categories/manage/",        MainCategoryManageAPIView.as_view(),
         name="legacy-category-manage"),
    path("categories/manage/<int:pk>/", MainCategoryManageDetailAPIView.as_view(),
         name="legacy-category-manage-detail"),

    # ── Legacy admin item manage ──────────────────────────────────────────
    path("manage/",           MenuItemManageAPIView.as_view(),     name="legacy-menu-manage"),
    path("manage/<int:pk>/",  MenuItemManageDetailAPIView.as_view(), name="legacy-menu-manage-detail"),
]
