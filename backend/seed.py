"""
Seed the database with comprehensive test data.
Run: python manage.py shell < seed.py

This creates:
  - Admin user (admin/password123)
  - 6 customer users (customer1–customer6 / password123)
  - 8 food categories with 14 menu items (+ images)
  - Inventory items with stock levels
  - MenuItemRecipe links (auto inventory mgmt)
  - 10+ orders across all statuses and payment states
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.contrib.auth.models import User
from accounts.models import Customer
from menu.models import Category, MenuItem, MenuItemRecipe
from orders.models import Order, OrderItem
from inventory.models import InventoryItem

now = timezone.now()
print("Seeding data...")

# ── Users & Customers ──────────────────────────────────────────────
users_data = [
    ("admin",      "admin@example.com",      True,  True,  "Admin",          "9800000000"),
    ("dikshya",    "dikshya@example.com",    False, False, "Dikshya",        "9806194103"),
    ("aska",       "aska@example.com",       False, False, "Aska",           "9800000000"),
    ("hema",       "hema@example.com",       False, False, "Hema",           "9810000000"),
    ("aashika",    "aashika@example.com",    False, False, "Aashika",        "9820000000"),
    ("dibash",     "dibash@example.com",     False, False, "Dibash",         "9700000000"),
    ("sabina",     "sabina@example.com",     False, False, "Sabina",         "123456789"),
]
users = {}
for uname, email, is_super, is_staff, cname, phone in users_data:
    u, created = User.objects.get_or_create(
        username=uname,
        defaults={"email": email, "is_superuser": is_super, "is_staff": is_staff},
    )
    if created:
        u.set_password("password123")
        u.save()
    Customer.objects.get_or_create(user=u, defaults={"name": cname, "phone": phone, "email": email})
    users[uname] = u
    print(f"  User: {uname} / password123" + (" (admin)" if is_super else ""))

customers = list(Customer.objects.all())

# ── Categories ──────────────────────────────────────────────────────
cat_names = [
    "Momo", "Pizza", "Biryani", "Drinks", "Hot Wings",
    "Keema Noodles", "Lafing", "Sausage",
]
cats = {}
for name in cat_names:
    c, _ = Category.objects.get_or_create(name=name)
    cats[name] = c
print(f"  {len(cat_names)} categories")

# ── Menu Items ──────────────────────────────────────────────────────
menu_data = [
    ("Chicken Momo",       "Momo",          210.00, "chicken.jpg",             True),
    ("Buff Momo",          "Momo",          180.00, "buff.jpeg",               True),
    ("Chicken Pizza",      "Pizza",         600.00, "chicken-pizza.jpeg",      True),
    ("Mushroom Pizza",     "Pizza",         500.00, "Mushroom-Pizza.jpg",      True),
    ("Chicken Biryani",    "Biryani",       700.00, "Chicken-Biryani.jpg",     True),
    ("Mutton Biryani",     "Biryani",      1000.00, "mutton-briyani.jpg",     True),
    ("Coke",               "Drinks",         70.00, "coke.png",               True),
    ("Sprite",             "Drinks",         50.00, "sprite.jpg",              True),
    ("Fanta",              "Drinks",         70.00, "fanta.jpeg",              True),
    ("Chicken Wings",      "Hot Wings",     150.00, "chicken-wings.jpeg",      True),
    ("Keema Noodles",      "Keema Noodles", 150.00, "keema-noodles.webp",      True),
    ("Dry Lafing",         "Lafing",         80.00, "lafing.jpeg",             True),
    ("Wai Wai Lafing",     "Lafing",        100.00, "wiwi-lafing.jpeg",        True),
    ("Chicken Sausage",     "Sausage",       50.00, "chicken-sausages.jpg",    True),
]
for name, cat_name, price, img, avail in menu_data:
    mi, _ = MenuItem.objects.get_or_create(
        name=name,
        defaults={
            "category": cats[cat_name],
            "price": price,
            "description": f"Delicious {name.lower()} — a customer favourite!",
            "image": f"menu_items/{img}",
            "is_available": avail,
        },
    )
print(f"  {len(menu_data)} menu items")

# ── Inventory ───────────────────────────────────────────────────────
inventory_data = [
    ("Rice",           50, "kg",  10),
    ("Cooking Oil",    50, "ltr", 10),
    ("Chicken",        80, "kg",  20),
    ("Tomato",          8, "kg",   5),
    ("Onion",          10, "kg",   5),
    ("Cheese",          5, "kg",   3),
    ("Flour",          25, "kg",  10),
    ("Vegetable Oil",  12, "ltr",  5),
    ("Potato",         30, "kg",  10),
    ("Spices Mix",     10, "kg",   3),
]
inv_items = {}
for name, qty, unit, limit in inventory_data:
    inv, _ = InventoryItem.objects.get_or_create(
        name=name,
        defaults={"quantity": qty, "unit": unit, "low_stock_limit": limit},
    )
    inv_items[name] = inv
print(f"  {len(inventory_data)} inventory items")

# ── MenuItemRecipe (link menu → inventory) ─────────────────────────
recipes = [
    ("Chicken Momo",   "Chicken",       0.50),
    ("Buff Momo",     "Onion",         0.10),
    ("Buff Momo",     "Spices Mix",    0.05),
    ("Chicken Pizza",  "Chicken",       0.30),
    ("Chicken Pizza",  "Cheese",        0.15),
    ("Chicken Pizza",  "Flour",         0.25),
    ("Chicken Pizza",  "Tomato",        0.10),
    ("Mushroom Pizza", "Cheese",        0.20),
    ("Mushroom Pizza", "Flour",         0.25),
    ("Mushroom Pizza", "Tomato",        0.10),
    ("Chicken Biryani","Chicken",       0.40),
    ("Chicken Biryani","Rice",          0.30),
    ("Chicken Biryani","Spices Mix",    0.10),
    ("Mutton Biryani", "Rice",          0.35),
    ("Mutton Biryani", "Spices Mix",    0.10),
    ("Chicken Wings",  "Chicken",       0.40),
    ("Chicken Wings",  "Cooking Oil",   0.10),
    ("Keema Noodles",  "Onion",         0.10),
    ("Keema Noodles",  "Vegetable Oil", 0.05),
]
rc = 0
for menu_name, inv_name, qty in recipes:
    try:
        mi = MenuItem.objects.get(name__iexact=menu_name)
        inv = InventoryItem.objects.get(name=inv_name)
        _, created = MenuItemRecipe.objects.get_or_create(
            menu_item=mi, inventory_item=inv,
            defaults={"quantity_required": qty},
        )
        if created:
            rc += 1
    except Exception:
        pass
print(f"  {rc} recipe links")

# ── Orders ──────────────────────────────────────────────────────────
# Clear previous seed orders (keep ones made via UI)
# Only delete orders created by seed customers
Order.objects.filter(customer__in=customers).delete()
print("  Cleared old seed orders")

orders_data = [
    # (customer_idx, status, payment, hours_ago, items)
    (1, "Delivered",        "Paid",   336, [("Chicken Momo", 2), ("Coke", 2)]),
    (2, "Delivered",        "Paid",   168, [("Chicken Pizza", 1), ("Sprite", 1)]),
    (3, "Delivered",        "Paid",    72, [("Mushroom Pizza", 1), ("Fanta", 1)]),
    (4, "Delivered",        "Paid",    48, [("Mutton Biryani", 1), ("Coke", 1)]),
    (5, "Delivered",        "Paid",    24, [("Chicken Wings", 3), ("Sprite", 2)]),
    (6, "Delivered",        "Paid",    12, [("Chicken Biryani", 1), ("Fanta", 1)]),
    (1, "Order Placed",     "Pending",  2, [("Buff Momo", 3), ("Coke", 2)]),
    (2, "Order Placed",     "Pending",  1, [("Keema Noodles", 1), ("Sprite", 1)]),
    (3, "Preparing",        "Pending",  3, [("Mushroom Pizza", 2), ("Fanta", 2)]),
    (4, "Preparing",        "Pending",  2, [("Chicken Pizza", 1), ("Coke", 1)]),
    (5, "Out for Delivery", "Paid",     4, [("Mutton Biryani", 1), ("Sprite", 2)]),
    (6, "Out for Delivery", "Paid",     2, [("Chicken Momo", 4), ("Fanta", 1)]),
    (1, "Cancelled",        "Pending",  6, [("Chicken Wings", 1)]),
]
oc = 0
for cust_idx, status, payment, hours_ago, items in orders_data:
    c = customers[cust_idx]
    o = Order.objects.create(
        customer=c,
        status=status,
        payment_status=payment,
        order_date=now - timedelta(hours=hours_ago),
    )
    for item_name, qty in items:
        mi = MenuItem.objects.get(name__iexact=item_name)
        OrderItem.objects.create(order=o, menu_item=mi, quantity=qty, unit_price=mi.price)
    o.calculate_total()
    oc += 1
print(f"  {oc} orders")

# ── Auto-availability check ────────────────────────────────────────
for mi in MenuItem.objects.filter(recipes__isnull=False).distinct():
    mi.auto_availability()

print("\n✅ Seed complete!")
print("   Admin: admin / password123")
print("   Users: dikshya, aska, hema, aashika, dibash, sabina / password123")
print(f"   {len(customers)} customers, {oc} orders, {rc} recipes")
