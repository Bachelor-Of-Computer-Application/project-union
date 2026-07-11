"""
Migration: add DeliveryMan model to accounts app.
"""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="DeliveryMan",
            fields=[
                ("id",             models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name",           models.CharField(max_length=100)),
                ("phone",          models.CharField(max_length=15)),
                ("vehicle_number", models.CharField(blank=True, default="", max_length=20)),
                ("is_active",      models.BooleanField(default=True, help_text="Can this delivery man accept orders?")),
                ("created_at",     models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="delivery_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Delivery Man",
                "verbose_name_plural": "Delivery Men",
            },
        ),
    ]
