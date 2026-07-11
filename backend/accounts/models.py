from django.db import models
from django.contrib.auth.models import User


class Customer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15)
    phone_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class DeliveryMan(models.Model):
    """
    Delivery personnel profile linked to a Django User.
    Created by admin; the linked user can log in and see their assigned orders.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="delivery_profile",
    )
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    vehicle_number = models.CharField(max_length=20, blank=True, default="")
    is_active = models.BooleanField(default=True, help_text="Can this delivery man accept orders?")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Delivery Man"
        verbose_name_plural = "Delivery Men"

    def __str__(self):
        return f"{self.name} ({self.user.username})"


class Address(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="addresses")
    label = models.CharField(max_length=50, default="Home")
    full_address = models.TextField()
    city = models.CharField(max_length=100)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.label}: {self.full_address[:50]}"
