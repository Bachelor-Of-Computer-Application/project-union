"""
Django settings for FoodExpress.

Reads sensitive values from environment variables so this file is safe to
commit.  Copy backend/.env.example → backend/.env and fill in the values
before starting the server.
"""

import os
from datetime import timedelta
from pathlib import Path

# ─────────────────────────────────────────────
# BASE DIRECTORY
# ─────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent


# ─────────────────────────────────────────────
# SECURITY
# ─────────────────────────────────────────────
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    # Fallback only used in local dev; never rely on this in production.
    "django-insecure-change-me-before-deploying",
)

DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost 127.0.0.1").split()


# ─────────────────────────────────────────────
# APPLICATIONS
# ─────────────────────────────────────────────
INSTALLED_APPS = [
    # Jazzmin must come BEFORE django.contrib.admin
    "jazzmin",

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",

    # Local apps
    "accounts",
    "menu",
    "orders",
    "inventory",
]


# ─────────────────────────────────────────────
# MIDDLEWARE
# ─────────────────────────────────────────────
MIDDLEWARE = [
    # CorsMiddleware must be before CommonMiddleware
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ─────────────────────────────────────────────
# URL & WSGI
# ─────────────────────────────────────────────
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"


# ─────────────────────────────────────────────
# TEMPLATES
# ─────────────────────────────────────────────
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ─────────────────────────────────────────────
# DATABASE
# Uses SQLite by default; set DATABASE_URL for Postgres in production.
# ─────────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ─────────────────────────────────────────────
# PASSWORD VALIDATION
# ─────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ─────────────────────────────────────────────
# INTERNATIONALISATION
# ─────────────────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# ─────────────────────────────────────────────
# STATIC & MEDIA FILES
# ─────────────────────────────────────────────
STATIC_URL = "static/"
# STATICFILES_DIRS is intentionally omitted — add it only if you have a
# project-level static folder (backend/static/).
STATIC_ROOT = BASE_DIR / "staticfiles"   # used by collectstatic

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


# ─────────────────────────────────────────────
# CORS
# In production set DJANGO_CORS_ORIGINS to a comma-separated list of
# allowed frontend origins, e.g. "https://foodexpress.example.com"
# ─────────────────────────────────────────────
_cors_origins = os.environ.get("DJANGO_CORS_ORIGINS", "")
if _cors_origins:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(",") if o.strip()]
else:
    # Allow all origins only in local dev (DEBUG must be True)
    CORS_ALLOW_ALL_ORIGINS = DEBUG


# ─────────────────────────────────────────────
# DJANGO REST FRAMEWORK
# ─────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
    ],
}


# ─────────────────────────────────────────────
# SIMPLE JWT
# ─────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=12),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "UPDATE_LAST_LOGIN": True,
}


# ─────────────────────────────────────────────
# JAZZMIN — Django Admin Theme
# ─────────────────────────────────────────────
JAZZMIN_SETTINGS = {
    # ── Branding ──────────────────────────────
    "site_title": "QuickServer1 Admin",
    "site_header": "QuickServer1",
    "site_brand": "QuickServer1",
    "site_logo": None,          # place a logo at static/img/logo.png and set "img/logo.png"
    "site_icon": None,
    "welcome_sign": "Welcome to QuickServer1 Admin",
    "copyright": "QuickServer1 © 2025",

    # ── Top-bar search ─────────────────────────
    "search_model": ["accounts.Customer", "orders.Order", "menu.MenuItem"],

    # ── User avatar ────────────────────────────
    "user_avatar": None,

    # ── Top navigation links ───────────────────
    "topmenu_links": [
        {"name": "Home",      "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "View Site", "url": "/",           "new_window": True},
    ],

    # ── User menu (top-right) ──────────────────
    "usermenu_links": [
        {"name": "View Site", "url": "/", "new_window": True},
    ],

    # ── Sidebar ────────────────────────────────
    "show_sidebar": True,
    "navigation_expanded": True,
    "hide_apps": [],
    "hide_models": [],
    "order_with_respect_to": [
        "auth",
        "accounts",
        "menu",
        "orders",
        "inventory",
    ],

    # Custom icons per model (Font Awesome 5 classes)
    "icons": {
        "auth":                     "fas fa-users-cog",
        "auth.user":                "fas fa-user",
        "auth.Group":               "fas fa-users",
        "accounts.Customer":        "fas fa-user-tag",
        "accounts.Address":         "fas fa-map-marker-alt",
        "menu.Category":            "fas fa-th-large",
        "menu.MenuItem":            "fas fa-utensils",
        "menu.MenuItemRecipe":      "fas fa-book-open",
        "orders.Order":             "fas fa-receipt",
        "orders.Cart":              "fas fa-shopping-cart",
        "inventory.InventoryItem":  "fas fa-boxes",
    },
    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",

    # ── Related modals ─────────────────────────
    "related_modal_active": True,

    # ── UI tweaks ──────────────────────────────
    "custom_css": None,
    "custom_js": None,
    "use_google_fonts_cdn": True,
    "show_ui_builder": False,   # set True temporarily to customise via the UI

    # ── Change-view UI ─────────────────────────
    "changeform_format": "horizontal_tabs",
    "changeform_format_overrides": {
        "auth.user":  "collapsible",
        "auth.group": "vertical_tabs",
    },
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-orange",
    "accent": "accent-orange",
    "navbar": "navbar-white navbar-light",
    "no_navbar_border": False,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-orange",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": True,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "default",
    "dark_mode_theme": None,
    "button_classes": {
        "primary":   "btn-primary",
        "secondary": "btn-secondary",
        "info":      "btn-info",
        "warning":   "btn-warning",
        "danger":    "btn-danger",
        "success":   "btn-success",
    },
}
