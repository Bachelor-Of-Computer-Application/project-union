from django.db import models
from accounts.models import Customer
from menu.models import MenuItem


class Order(models.Model):

    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Preparing', 'Preparing'),
        ('Ready', 'Ready'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
    ]

    PAYMENT_METHODS = [
        ('Cash', 'Cash'),
        ('Card', 'Card'),
        ('eSewa', 'eSewa'),
    ]

    PAYMENT_STATUS = [
        ('Pending', 'Pending'),
        ('Paid', 'Paid'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)

    order_date = models.DateTimeField(auto_now_add=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='Pending'
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHODS,
        default='Cash'
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS,
        default='Pending'
    )

    def calculate_total(self):
        total = 0

        for item in self.orderitem_set.all():
            total += item.menu_item.price * item.quantity

        self.total_amount = total
        self.save()

    def __str__(self):
        return f"Order {self.id}"


class OrderItem(models.Model):

    order = models.ForeignKey(Order, on_delete=models.CASCADE)

    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)

    quantity = models.PositiveIntegerField(default=1)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.order.calculate_total()

    def __str__(self):
        return f"{self.menu_item.name} x {self.quantity}"