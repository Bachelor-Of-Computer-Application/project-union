"""
Seed the database with comprehensive test data.
Run:  venv\\Scripts\\python.exe seed.py

Creates:
  - Admin + 6 customer users (password: password123)
  - Default address per user
  - Full 3-level menu: MainCategory › MenuSection › MenuItem
  - Inventory items + recipe links
  - 13 sample orders across all statuses
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.models import User
from accounts.models import Address, Customer
from menu.models import MainCategory, MenuSection, MenuItem, MenuItemRecipe
from orders.models import Order, OrderItem
from inventory.models import InventoryItem

now = timezone.now()
print("Seeding data...")

# ── Users & Customers ──────────────────────────────────────────────────────
users_data = [
    ("admin",   "admin@example.com",   True,  True,  "Admin",   "9800000000"),
    ("dikshya", "dikshya@example.com", False, False, "Dikshya", "9806194103"),
    ("aska",    "aska@example.com",    False, False, "Aska",    "9800000001"),
    ("hema",    "hema@example.com",    False, False, "Hema",    "9810000000"),
    ("aashika", "aashika@example.com", False, False, "Aashika", "9820000000"),
    ("dibash",  "dibash@example.com",  False, False, "Dibash",  "9700000000"),
    ("sabina",  "sabina@example.com",  False, False, "Sabina",  "9811111111"),
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
    Customer.objects.get_or_create(
        user=u, defaults={"name": cname, "phone": phone, "email": email}
    )
    users[uname] = u
    print(f"  User: {uname} / password123" + (" (admin)" if is_super else ""))

customers = list(Customer.objects.all())

# ── Addresses ──────────────────────────────────────────────────────────────
addr_data = [
    ("admin",   "Home", "New Road, Pokhara",       "Pokhara"),
    ("dikshya", "Home", "Lakeside, Pokhara",        "Pokhara"),
    ("aska",    "Home", "Prithvi Chowk, Pokhara",   "Pokhara"),
    ("hema",    "Home", "Mahendrapul, Pokhara",      "Pokhara"),
    ("aashika", "Home", "Bagar, Pokhara",            "Pokhara"),
    ("dibash",  "Home", "Chipledhunga, Pokhara",     "Pokhara"),
    ("sabina",  "Home", "Newroad, Kathmandu",        "Kathmandu"),
]
for uname, label, full_addr, city in addr_data:
    cust = Customer.objects.filter(user=users[uname]).first()
    if cust:
        # Delete duplicates from previous seed runs, keep/create exactly one
        existing = Address.objects.filter(customer=cust, label=label)
        if existing.count() > 1:
            existing.exclude(pk=existing.first().pk).delete()
        if not existing.exists():
            Address.objects.create(
                customer=cust, label=label,
                full_address=full_addr, city=city, is_default=True,
            )
print(f"  {len(addr_data)} addresses")

# ── Three-level menu structure ─────────────────────────────────────────────
#
# Format:
#   main_menu_data = {
#       "MainCategory": {
#           "MenuSection": [
#               ("Item name", price, "image_file", "description"),
#               ...
#           ]
#       }
#   }

main_menu_data = {
    ("Food", 0): {
        ("Momo",        0): [
            ("Chicken Momo",  210, "chicken.jpg",        "Steamed chicken dumplings with spicy chutney"),
            ("Buff Momo",     180, "buff.jpeg",           "Classic buff dumplings — a Pokhara favourite"),
            ("Veg Momo",      160, "",                    "Crunchy vegetable-filled dumplings"),
            ("Jhol Momo",     230, "",                    "Momos served in a rich tomato jhol broth"),
            ("Fried Momo",    220, "",                    "Crispy fried dumplings with dipping sauce"),
        ],
        ("Pizza",       1): [
            ("Chicken Pizza", 600, "chicken-pizza.jpeg",  "Loaded chicken pizza on a crispy base"),
            ("Veg Pizza",     500, "",                    "Garden-fresh vegetables on tomato sauce"),
            ("Cheese Pizza",  550, "",                    "Double-cheese lover's classic"),
        ],
        ("Burger",      2): [
            ("Chicken Burger",350, "",                    "Juicy grilled chicken in a toasted bun"),
            ("Veg Burger",    280, "",                    "Crispy veggie patty with fresh lettuce"),
        ],
        ("Chowmein",    3): [
            ("Chicken Chowmein", 180, "",                 "Stir-fried noodles with chicken"),
            ("Veg Chowmein",  150, "",                    "Stir-fried noodles with mixed vegetables"),
        ],
        ("Biryani",     4): [
            ("Chicken Biryani",700, "Chicken-Biryani.jpg","Aromatic basmati with tender chicken"),
            ("Mutton Biryani",1000, "",                   "Slow-cooked mutton with fragrant spices"),
        ],
        ("Hot Wings",   5): [
            ("Chicken Wings", 150, "chicken-wings.jpeg",  "Crispy wings tossed in spicy sauce"),
        ],
        ("Noodles",     6): [
            ("Keema Noodles", 150, "",                    "Minced meat noodles — street-style"),
            ("Wai Wai Lafing",100, "",                    "Wai Wai tossed with spicy sauce"),
            ("Dry Lafing",     80, "",                    "Dry noodle snack with a kick"),
        ],
    },
    ("Drinks", 1): {
        ("Soft Drinks", 0): [
            ("Coke",           70, "coke.png",            "Ice-cold Coca-Cola"),
            ("Sprite",         50, "",                    "Refreshing lemon-lime"),
            ("Fanta",          70, "fanta.jpeg",          "Fruity orange Fanta"),
            ("Pepsi",          70, "",                    "Classic Pepsi cola"),
        ],
        ("Juice",       1): [
            ("Orange Juice",   80, "",                    "Fresh-squeezed orange juice"),
            ("Apple Juice",    80, "",                    "Cold pressed apple juice"),
            ("Mango Juice",    90, "",                    "Tropical mango blend"),
        ],
        ("Coffee",      2): [
            ("Americano",     120, "",                    "Bold black espresso with hot water"),
            ("Cappuccino",    150, "",                    "Espresso topped with creamy foam"),
            ("Latte",         160, "",                    "Smooth espresso with steamed milk"),
        ],
        ("Lassi",       3): [
            ("Sweet Lassi",    80, "",                    "Chilled yoghurt drink with sugar"),
            ("Mango Lassi",   100, "",                    "Creamy mango yoghurt smoothie"),
        ],
    },
    ("Snacks", 2): {
        ("Fries",       0): [
            ("French Fries",  120, "",                    "Golden crispy potato fries"),
            ("Masala Fries",  140, "",                    "Fries tossed in spiced masala"),
        ],
        ("Sandwich",    1): [
            ("Chicken Sandwich",220,"",                   "Grilled chicken on toasted bread"),
            ("Veg Sandwich",  180, "",                    "Fresh veggies on multigrain bread"),
        ],
        ("Sausage",     2): [
            ("Chicken Sausage", 50,"chicken-sausages.jpg","Juicy grilled chicken sausage"),
        ],
        ("Spring Roll", 3): [
            ("Veg Spring Roll",100, "",                   "Crispy rolls filled with seasoned veg"),
            ("Chicken Spring Roll",120,"",                "Tender chicken inside a crispy shell"),
        ],
    },
    ("Beverages", 3): {
        ("Tea",         0): [
            ("Milk Tea",       40, "",                    "Classic Nepali dudh chiya"),
            ("Black Tea",      30, "",                    "Strong black tea, no milk"),
            ("Lemon Tea",      45, "",                    "Refreshing lemon-infused tea"),
            ("Masala Tea",     50, "",                    "Spiced chai with cardamom & ginger"),
        ],
        ("Hot Chocolate",1): [
            ("Hot Chocolate", 130, "",                    "Rich and creamy chocolate drink"),
            ("Mocha",         150, "",                    "Espresso blended with chocolate"),
        ],
        ("Milkshake",   2): [
            ("Chocolate Shake",160,"",                    "Thick chocolate milkshake"),
            ("Strawberry Shake",150,"",                   "Fresh strawberry milkshake"),
            ("Vanilla Shake", 140, "",                    "Classic vanilla milkshake"),
        ],
    },
    ("Desserts", 4): {
        ("Ice Cream",   0): [
            ("Vanilla Ice Cream",80,"",                   "Two scoops of creamy vanilla"),
            ("Chocolate Ice Cream",90,"",                 "Rich double-chocolate scoop"),
        ],
        ("Cake",        1): [
            ("Chocolate Cake",  200,"",                   "Moist layered chocolate cake"),
            ("Red Velvet",      220,"",                   "Classic red velvet with cream cheese"),
        ],
    },
}

# Build the three-level structure
sections_map = {}   # (main_name, section_name) → MenuSection instance
items_map    = {}   # item_name → MenuItem instance

mc_count = sec_count = item_count = 0

for (mc_name, mc_order), sections in main_menu_data.items():
    mc, created = MainCategory.objects.get_or_create(
        name=mc_name, defaults={"order": mc_order}
    )
    if created:
        mc_count += 1

    for (sec_name, sec_order), items in sections.items():
        sec, created = MenuSection.objects.get_or_create(
            main_category=mc, name=sec_name,
            defaults={"order": sec_order},
        )
        if created:
            sec_count += 1
        sections_map[(mc_name, sec_name)] = sec

        for item_tuple in items:
            iname, iprice, iimg, idesc = item_tuple
            img_path = f"menu_items/{iimg}" if iimg else ""
            mi, created = MenuItem.objects.get_or_create(
                name=iname,
                defaults={
                    "section": sec,
                    "price": iprice,
                    "description": idesc,
                    "image": img_path,
                    "is_available": True,
                },
            )
            if not created and mi.section != sec:
                # Re-home items that migrated to wrong section
                mi.section = sec
                mi.save(update_fields=["section"])
            if created:
                item_count += 1
            items_map[iname] = mi

print(f"  {mc_count} main categories, {sec_count} sections, {item_count} new items")

# ── Inventory ──────────────────────────────────────────────────────────────
inventory_data = [
    ("Rice",          50, "kg",  10),
    ("Cooking Oil",   50, "ltr", 10),
    ("Chicken",       80, "kg",  20),
    ("Tomato",         8, "kg",   5),
    ("Onion",         10, "kg",   5),
    ("Cheese",         5, "kg",   3),
    ("Flour",         25, "kg",  10),
    ("Vegetable Oil", 12, "ltr",  5),
    ("Potato",        30, "kg",  10),
    ("Spices Mix",    10, "kg",   3),
    ("Milk",          20, "ltr",  5),
    ("Egg",           60, "pcs", 12),
]
inv_items = {}
for name, qty, unit, limit in inventory_data:
    inv, _ = InventoryItem.objects.get_or_create(
        name=name,
        defaults={"quantity": qty, "unit": unit, "low_stock_limit": limit},
    )
    inv_items[name] = inv
print(f"  {len(inventory_data)} inventory items")

# ── Recipes ────────────────────────────────────────────────────────────────
recipes = [
    ("Chicken Momo",    "Chicken",      0.50),
    ("Buff Momo",       "Onion",        0.10),
    ("Buff Momo",       "Spices Mix",   0.05),
    ("Chicken Pizza",   "Chicken",      0.30),
    ("Chicken Pizza",   "Cheese",       0.15),
    ("Chicken Pizza",   "Flour",        0.25),
    ("Chicken Pizza",   "Tomato",       0.10),
    ("Veg Pizza",       "Cheese",       0.20),
    ("Veg Pizza",       "Flour",        0.25),
    ("Veg Pizza",       "Tomato",       0.10),
    ("Chicken Biryani", "Chicken",      0.40),
    ("Chicken Biryani", "Rice",         0.30),
    ("Chicken Biryani", "Spices Mix",   0.10),
    ("Mutton Biryani",  "Rice",         0.35),
    ("Mutton Biryani",  "Spices Mix",   0.10),
    ("Chicken Wings",   "Chicken",      0.40),
    ("Chicken Wings",   "Cooking Oil",  0.10),
    ("Keema Noodles",   "Onion",        0.10),
    ("Keema Noodles",   "Vegetable Oil",0.05),
    ("French Fries",    "Potato",       0.20),
    ("French Fries",    "Cooking Oil",  0.05),
    ("Masala Fries",    "Potato",       0.20),
    ("Masala Fries",    "Spices Mix",   0.03),
    ("Cappuccino",      "Milk",         0.15),
    ("Latte",           "Milk",         0.20),
]
rc = 0
for menu_name, inv_name, qty in recipes:
    try:
        mi  = MenuItem.objects.get(name__iexact=menu_name)
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

# ── Orders ─────────────────────────────────────────────────────────────────
Order.objects.filter(customer__in=customers).delete()
print("  Cleared old seed orders")

orders_data = [
    (1, "Delivered",        "Paid",    336, [("Chicken Momo", 2), ("Coke", 2)]),
    (2, "Delivered",        "Paid",    168, [("Chicken Pizza", 1), ("Sprite", 1)]),
    (3, "Delivered",        "Paid",     72, [("Veg Pizza", 1), ("Fanta", 1)]),
    (4, "Delivered",        "Paid",     48, [("Mutton Biryani", 1), ("Coke", 1)]),
    (5, "Delivered",        "Paid",     24, [("Chicken Wings", 3), ("Sprite", 2)]),
    (6, "Delivered",        "Paid",     12, [("Chicken Biryani", 1), ("Fanta", 1)]),
    (1, "Order Placed",     "Pending",   2, [("Buff Momo", 3), ("Coke", 2)]),
    (2, "Order Placed",     "Pending",   1, [("Keema Noodles", 1), ("Sprite", 1)]),
    (3, "Preparing",        "Pending",   3, [("Veg Pizza", 2), ("Fanta", 2)]),
    (4, "Preparing",        "Pending",   2, [("Chicken Pizza", 1), ("Coke", 1)]),
    (5, "Out for Delivery", "Paid",      4, [("Mutton Biryani", 1), ("Sprite", 2)]),
    (6, "Out for Delivery", "Paid",      2, [("Chicken Momo", 4), ("Fanta", 1)]),
    (1, "Cancelled",        "Pending",   6, [("Chicken Wings", 1)]),
]
oc = 0
for cust_idx, status, payment, hours_ago, order_items in orders_data:
    c = customers[cust_idx]
    o = Order.objects.create(
        customer=c,
        status=status,
        payment_status=payment,
        order_date=now - timedelta(hours=hours_ago),
    )
    for iname, qty in order_items:
        mi = MenuItem.objects.get(name__iexact=iname)
        OrderItem.objects.create(order=o, menu_item=mi, quantity=qty, unit_price=mi.price)
    o.calculate_total()
    oc += 1
print(f"  {oc} orders")

# ── Auto-availability ──────────────────────────────────────────────────────
for mi in MenuItem.objects.filter(recipes__isnull=False).distinct():
    mi.auto_availability()

print("\nSeed complete!")
print("  Admin:  admin / password123")
print("  Users:  dikshya, aska, hema, aashika, dibash, sabina / password123")
total_items = MenuItem.objects.count()
print(f"  Menu:   {MainCategory.objects.count()} main categories, "
      f"{MenuSection.objects.count()} sections, {total_items} items")
