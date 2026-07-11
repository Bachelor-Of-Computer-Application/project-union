from django.db import models
from accounts.models import Customer, Address, DeliveryMan
from menu.models import MenuItem


class Order(models.Model):
    STATUS_CHOICES = [
        ("Order Placed", "Order Placed"),
        ("Preparing", "Preparing"),
        ("Ready", "Ready"),
        ("Out for Delivery", "Out for Delivery"),
        ("Delivered", "Delivered"),
        ("Cancelled", "Cancelled"),
    ]

    PAYMENT_METHODS = [
        ("COD", "Cash on Delivery"),
        ("eSewa", "eSewa"),
    ]

    PAYMENT_STATUS = [
        ("Pending", "Pending"),
        ("Paid", "Paid"),
        ("Failed", "Failed"),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    delivery_address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True)
    assigned_to = models.ForeignKey(
        DeliveryMan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_orders",
        help_text="Delivery man assigned to deliver this order",
    )
    order_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Order Placed")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default="COD")
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default="Pending")
    transaction_uuid = models.CharField(max_length=100, blank=True, null=True, unique=True, help_text="Unique transaction ID from eSewa")
    transaction_code = models.CharField(max_length=100, blank=True, null=True, help_text="Transaction code returned by eSewa")
    notes = models.TextField(blank=True, default="")

    def calculate_total(self):
        total = sum(item.menu_item.price * item.quantity for item in self.items.all())
        self.total_amount = total
        self.save()

    def __str__(self):
        return f"Order #{self.id} - {self.customer.name}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        if not self.unit_price:
            self.unit_price = self.menu_item.price
        super().save(*args, **kwargs)
        self.order.calculate_total()

    def __str__(self):
        return f"{self.menu_item.name} x {self.quantity}"


class Cart(models.Model):
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name="cart")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def total_price(self):
        return sum(item.total_price() for item in self.items.all())

    def __str__(self):
        return f"Cart - {self.customer.name}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def total_price(self):
        return self.menu_item.price * self.quantity

    def __str__(self):
        return f"{self.menu_item.name} x {self.quantity}"
