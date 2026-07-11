from django.db import models


class MainCategory(models.Model):
    """
    Level 1 — top-level grouping: Food, Drinks, Snacks, Desserts, Beverages, Others.
    Shown as the primary navigation tabs on the menu page.
    """
    name = models.CharField(max_length=100, unique=True)
    order = models.PositiveSmallIntegerField(default=0, help_text="Display order (lower = first)")

    class Meta:
        verbose_name = "Main Category"
        verbose_name_plural = "Main Categories"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class MenuSection(models.Model):
    """
    Level 2 — sub-group within a MainCategory: Momo, Pizza, Soft Drinks, Coffee…
    Shown as section pills / sidebar items after selecting a MainCategory.
    """
    main_category = models.ForeignKey(
        MainCategory,
        on_delete=models.CASCADE,
        related_name="sections",
    )
    name = models.CharField(max_length=100)
    order = models.PositiveSmallIntegerField(default=0, help_text="Display order within the main category")

    class Meta:
        verbose_name = "Menu Section"
        verbose_name_plural = "Menu Sections"
        ordering = ["order", "name"]
        unique_together = [["main_category", "name"]]

    def __str__(self):
        return f"{self.main_category.name} › {self.name}"


class MenuItem(models.Model):
    """
    Level 3 — an individual dish or drink.
    Belongs to one MenuSection (which belongs to one MainCategory).
    """
    section = models.ForeignKey(
        MenuSection,
        on_delete=models.CASCADE,
        related_name="items",
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default="")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to="menu_items/", null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    # ── Inventory helpers ────────────────────────────────────────────

    def check_inventory(self):
        """Return True if every linked ingredient has sufficient stock."""
        recipes = self.recipes.all()
        if not recipes.exists():
            return True
        for r in recipes:
            if r.inventory_item.quantity < r.quantity_required:
                return False
        return True

    def auto_availability(self):
        """Update is_available based on current inventory levels."""
        self.is_available = self.check_inventory()
        self.save(update_fields=["is_available"])


class MenuItemRecipe(models.Model):
    """
    Maps a MenuItem to the InventoryItems (ingredients) it consumes.
    Used to auto-update availability when stock changes.
    """
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name="recipes")
    inventory_item = models.ForeignKey("inventory.InventoryItem", on_delete=models.CASCADE)
    quantity_required = models.DecimalField(max_digits=10, decimal_places=2, default=1)

    class Meta:
        verbose_name = "Menu Item Recipe"
        verbose_name_plural = "Menu Item Recipes"
        unique_together = [["menu_item", "inventory_item"]]

    def __str__(self):
        return f"{self.menu_item.name} → {self.inventory_item.name} x{self.quantity_required}"
