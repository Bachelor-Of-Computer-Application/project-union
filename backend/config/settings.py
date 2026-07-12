"""
Django settings for FoodExpress.

Reads sensitive values from environment variables so this file is safe to
commit.  Copy backend/.env.example → backend/.env and fill in the values
before starting the server.
"""

import os
from datetime import timedelta
from pathlib import Path

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

# ─────────────────────────────────────────────
# BASE DIRECTORY
# ─────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent


# ─────────────────────────────────────────────
# SECURITY
# ─────────────────────────────────────────────
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-change-me-before-deploying",
)

DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost 127.0.0.1").split()


# ─────────────────────────────────────────────
# APPLICATIONS
# ─────────────────────────────────────────────
INSTALLED_APPS = [
    "jazzmin",  # must come before django.contrib.admin
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
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


# ─────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────
_cors_origins = os.environ.get("DJANGO_CORS_ORIGINS", "")
if _cors_origins:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(",") if o.strip()]
else:
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
# EMAIL  (configured via .env)
# ─────────────────────────────────────────────
EMAIL_BACKEND    = os.environ.get("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
EMAIL_HOST       = os.environ.get("EMAIL_HOST",    "smtp.gmail.com")
EMAIL_PORT       = int(os.environ.get("EMAIL_PORT", 587))
EMAIL_USE_TLS    = os.environ.get("EMAIL_USE_TLS", "True") == "True"
EMAIL_HOST_USER  = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL  = os.environ.get(
    "DEFAULT_FROM_EMAIL",
    f"QuickServer1 <{EMAIL_HOST_USER}>" if EMAIL_HOST_USER else "QuickServer1 <noreply@quickserver1.com>",
)


# ─────────────────────────────────────────────
# LOGGING — makes email send/fail visible in terminal
# ─────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{levelname}] {asctime} {name}: {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "orders": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}


# ─────────────────────────────────────────────
# JAZZMIN — Django Admin Theme
# ─────────────────────────────────────────────
JAZZMIN_SETTINGS = {
    "site_title":    "QuickServer1 Admin",
    "site_header":   "QuickServer1",
    "site_brand":    "QuickServer1",
    "site_logo":     None,
    "site_icon":     None,
    "welcome_sign":  "Welcome to QuickServer1 Admin",
    "copyright":     "QuickServer1 © 2025",
    "search_model":  ["accounts.Customer", "orders.Order", "menu.MenuItem"],
    "user_avatar":   None,
    "topmenu_links": [
        {"name": "Home",      "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "View Site", "url": "/",           "new_window": True},
    ],
    "usermenu_links": [
        {"name": "View Site", "url": "/", "new_window": True},
    ],
    "show_sidebar":        True,
    "navigation_expanded": True,
    "hide_apps":           [],
    "hide_models":         [],
    "order_with_respect_to": ["auth", "accounts", "menu", "orders", "inventory"],
    "icons": {
        "auth":                    "fas fa-users-cog",
        "auth.user":               "fas fa-user",
        "auth.Group":              "fas fa-users",
        "accounts.Customer":       "fas fa-user-tag",
        "accounts.Address":        "fas fa-map-marker-alt",
        "menu.Category":           "fas fa-th-large",
        "menu.MenuItem":           "fas fa-utensils",
        "menu.MenuItemRecipe":     "fas fa-book-open",
        "orders.Order":            "fas fa-receipt",
        "orders.Cart":             "fas fa-shopping-cart",
        "inventory.InventoryItem": "fas fa-boxes",
    },
    "default_icon_parents":  "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",
    "related_modal_active":  True,
    "custom_css":            None,
    "custom_js":             None,
    "use_google_fonts_cdn":  True,
    "show_ui_builder":       False,
    "changeform_format":     "horizontal_tabs",
    "changeform_format_overrides": {
        "auth.user":  "collapsible",
        "auth.group": "vertical_tabs",
    },
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text":          False,
    "footer_small_text":          False,
    "body_small_text":            False,
    "brand_small_text":           False,
    "brand_colour":               "navbar-orange",
    "accent":                     "accent-orange",
    "navbar":                     "navbar-white navbar-light",
    "no_navbar_border":           False,
    "navbar_fixed":               True,
    "layout_boxed":               False,
    "footer_fixed":               False,
    "sidebar_fixed":              True,
    "sidebar":                    "sidebar-dark-orange",
    "sidebar_nav_small_text":     False,
    "sidebar_disable_expand":     False,
    "sidebar_nav_child_indent":   True,
    "sidebar_nav_compact_style":  False,
    "sidebar_nav_legacy_style":   False,
    "sidebar_nav_flat_style":     False,
    "theme":                      "default",
    "dark_mode_theme":            None,
    "button_classes": {
        "primary":   "btn-primary",
        "secondary": "btn-secondary",
        "info":      "btn-info",
        "warning":   "btn-warning",
        "danger":    "btn-danger",
        "success":   "btn-success",
    },
}
