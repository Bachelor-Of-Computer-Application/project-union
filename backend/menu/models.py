from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="items")
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default="")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to="menu_items/", null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def check_inventory(self):
        recipes = self.recipes.all()
        if not recipes.exists():
            return True
        for r in recipes:
            if r.inventory_item.quantity < r.quantity_required:
                return False
        return True

    def auto_availability(self):
        self.is_available = self.check_inventory()
        self.save(update_fields=["is_available"])


class MenuItemRecipe(models.Model):
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name="recipes")
    inventory_item = models.ForeignKey("inventory.InventoryItem", on_delete=models.CASCADE)
    quantity_required = models.DecimalField(max_digits=10, decimal_places=2, default=1)

    class Meta:
        verbose_name_plural = "menu item recipes"
        unique_together = [["menu_item", "inventory_item"]]

    def __str__(self):
        return f"{self.menu_item.name} → {self.inventory_item.name} x{self.quantity_required}"
