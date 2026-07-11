"""
Migration: flat Category → three-level MainCategory › MenuSection › MenuItem

Steps
-----
1. Create menu_maincategory
2. Create menu_menusection  (FK → maincategory)
3. Add menu_menuitem.section_id  (nullable for now)
4. DATA: for every old Category row create a MenuSection under a
         "Food" MainCategory, then point every MenuItem at that section
5. Make section_id NOT NULL
6. Remove menu_menuitem.category_id
7. Delete menu_category table
"""

import django.db.models.deletion
from django.db import migrations, models


# ── forward data migration ──────────────────────────────────────────────────

def migrate_categories_to_sections(apps, schema_editor):
    """
    Converts old flat categories into MainCategory + MenuSection pairs.

    Every existing category (Momo, Pizza, Drinks …) becomes a MenuSection
    under a single "Food" MainCategory.  Items are re-pointed at the
    new section.  The seed script will later replace this with the full
    three-level structure, but this guarantees zero data loss on migration.
    """
    Category    = apps.get_model("menu", "Category")
    MainCategory = apps.get_model("menu", "MainCategory")
    MenuSection  = apps.get_model("menu", "MenuSection")
    MenuItem     = apps.get_model("menu", "MenuItem")

    if not Category.objects.exists():
        return   # fresh database — nothing to migrate

    # Create (or reuse) the default top-level bucket
    food_main, _ = MainCategory.objects.get_or_create(
        name="Food",
        defaults={"order": 0},
    )

    for idx, old_cat in enumerate(Category.objects.all()):
        section, _ = MenuSection.objects.get_or_create(
            main_category=food_main,
            name=old_cat.name,
            defaults={"order": idx},
        )
        # Re-point every menu item that belonged to this old category
        MenuItem.objects.filter(category_id=old_cat.pk).update(section=section)


def reverse_migrate(apps, schema_editor):
    """
    Reverse: re-create Category rows from MenuSections and point items back.
    Used only when reversing the migration (e.g. during development).
    """
    Category   = apps.get_model("menu", "Category")
    MenuSection = apps.get_model("menu", "MenuSection")
    MenuItem    = apps.get_model("menu", "MenuItem")

    for section in MenuSection.objects.all():
        old_cat, _ = Category.objects.get_or_create(name=section.name)
        MenuItem.objects.filter(section=section).update(category_id=old_cat.pk)


# ── migration class ─────────────────────────────────────────────────────────

class Migration(migrations.Migration):

    dependencies = [
        ("menu", "0002_menuitemrecipe"),
    ]

    operations = [

        # ── 1. MainCategory table ──────────────────────────────────────────
        migrations.CreateModel(
            name="MainCategory",
            fields=[
                ("id",    models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name",  models.CharField(max_length=100, unique=True)),
                ("order", models.PositiveSmallIntegerField(default=0, help_text="Display order (lower = first)")),
            ],
            options={
                "verbose_name": "Main Category",
                "verbose_name_plural": "Main Categories",
                "ordering": ["order", "name"],
            },
        ),

        # ── 2. MenuSection table ───────────────────────────────────────────
        migrations.CreateModel(
            name="MenuSection",
            fields=[
                ("id",    models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name",  models.CharField(max_length=100)),
                ("order", models.PositiveSmallIntegerField(default=0, help_text="Display order within the main category")),
                (
                    "main_category",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sections",
                        to="menu.maincategory",
                    ),
                ),
            ],
            options={
                "verbose_name": "Menu Section",
                "verbose_name_plural": "Menu Sections",
                "ordering": ["order", "name"],
            },
        ),
        migrations.AlterUniqueTogether(
            name="menusection",
            unique_together={("main_category", "name")},
        ),

        # ── 3. Add nullable section FK to MenuItem ─────────────────────────
        migrations.AddField(
            model_name="menuitem",
            name="section",
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="items",
                to="menu.menusection",
            ),
        ),

        # ── 4. Data migration: populate section_id from old category_id ────
        migrations.RunPython(
            migrate_categories_to_sections,
            reverse_code=reverse_migrate,
        ),

        # ── 5. Make section NOT NULL now that every row is populated ────────
        migrations.AlterField(
            model_name="menuitem",
            name="section",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="items",
                to="menu.menusection",
            ),
        ),

        # ── 6. Drop the old category FK from MenuItem ───────────────────────
        migrations.RemoveField(
            model_name="menuitem",
            name="category",
        ),

        # ── 7. Drop the old Category table ─────────────────────────────────
        migrations.DeleteModel(
            name="Category",
        ),
    ]
