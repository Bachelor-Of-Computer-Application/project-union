from django.contrib import admin
from .models import MainCategory, MenuSection, MenuItem, MenuItemRecipe


# ── Inlines ───────────────────────────────────────────────────────────────────

class MenuSectionInline(admin.TabularInline):
    """Shows sections directly on the MainCategory change page."""
    model = MenuSection
    extra = 1
    fields = ["name", "order"]
    ordering = ["order", "name"]
    show_change_link = True


class MenuItemInline(admin.TabularInline):
    """Shows items directly on the MenuSection change page."""
    model = MenuItem
    extra = 1
    fields = ["name", "price", "is_available", "image"]
    readonly_fields = []
    show_change_link = True


class MenuItemRecipeInline(admin.TabularInline):
    """Shows ingredient recipes on the MenuItem change page."""
    model = MenuItemRecipe
    extra = 1
    fields = ["inventory_item", "quantity_required"]
    autocomplete_fields = []


# ── MainCategory ──────────────────────────────────────────────────────────────

@admin.register(MainCategory)
class MainCategoryAdmin(admin.ModelAdmin):
    list_display  = ["name", "order", "section_count"]
    search_fields = ["name"]
    ordering      = ["order", "name"]
    inlines       = [MenuSectionInline]

    @admin.display(description="Sections")
    def section_count(self, obj):
        return obj.sections.count()


# ── MenuSection ───────────────────────────────────────────────────────────────

@admin.register(MenuSection)
class MenuSectionAdmin(admin.ModelAdmin):
    list_display   = ["name", "main_category", "order", "item_count"]
    list_filter    = ["main_category"]
    search_fields  = ["name", "main_category__name"]
    ordering       = ["main_category__order", "main_category__name", "order", "name"]
    autocomplete_fields = ["main_category"]
    inlines        = [MenuItemInline]

    @admin.display(description="Items")
    def item_count(self, obj):
        return obj.items.count()


# ── MenuItem ──────────────────────────────────────────────────────────────────

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display   = ["name", "section", "main_category_name", "price", "rating", "is_available"]
    list_filter    = ["section__main_category", "section", "is_available"]
    search_fields  = ["name", "description", "section__name", "section__main_category__name"]
    ordering       = ["section__main_category__order", "section__order", "name"]
    autocomplete_fields = ["section"]
    inlines        = [MenuItemRecipeInline]

    @admin.display(description="Main Category", ordering="section__main_category__name")
    def main_category_name(self, obj):
        return obj.section.main_category.name


# ── MenuItemRecipe ────────────────────────────────────────────────────────────

@admin.register(MenuItemRecipe)
class MenuItemRecipeAdmin(admin.ModelAdmin):
    list_display   = ["menu_item", "inventory_item", "quantity_required"]
    list_filter    = ["inventory_item"]
    search_fields  = ["menu_item__name", "inventory_item__name"]
    autocomplete_fields = ["menu_item"]
