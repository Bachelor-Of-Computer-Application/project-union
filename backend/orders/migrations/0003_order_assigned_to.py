"""
Migration: add Order.assigned_to FK → DeliveryMan.
"""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_deliveryman"),
        ("orders",   "0002_order_transaction_code_order_transaction_uuid_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="assigned_to",
            field=models.ForeignKey(
                blank=True,
                null=True,
                help_text="Delivery man assigned to deliver this order",
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="assigned_orders",
                to="accounts.deliveryman",
            ),
        ),
    ]
