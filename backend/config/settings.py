from __future__ import annotations

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

load_dotenv(ROOT_DIR / ".env")
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-kevin-construction-os-crm-secret-key-2026-prod",
)

DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() in ("true", "1", "yes")

# Multi-tenant custom domains & subdomains are verified by Traefik; allow wildcard host resolution
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party apps
    "corsheaders",
    "rest_framework",
    "django_filters",
    # Local reusable & domain apps
    "common",
    "crm",
    "integrations",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "common.middleware.TenantResolutionMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

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

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# Database: PostgreSQL 18 (with optional SQLite fallback for isolated local unit tests)
USE_SQLITE = os.getenv("USE_SQLITE", "False").lower() in ("true", "1", "yes")

if USE_SQLITE:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB", "beamline_os"),
            "USER": os.getenv("POSTGRES_USER", "postgres"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", "postgres_secure_pass_2026"),
            "HOST": os.getenv("POSTGRES_HOST", "localhost"),
            "PORT": os.getenv("POSTGRES_PORT", "5448"),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Reverse Proxy & Security Header
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# CORS & CSRF Security Best Practices
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://localhost(:\d+)?$",
    r"^http://127\.0\.0\.1(:\d+)?$",
]
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "https://crm.musfiqdehan.com,http://localhost:3017,http://127.0.0.1:3017,http://localhost:5678",
    ).split(",")
    if origin.strip()
]
from corsheaders.defaults import default_headers

CORS_ALLOW_HEADERS = list(default_headers) + [
    "x-tenant-slug",
    "x-tenant-id",
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CSRF_TRUSTED_ORIGINS",
        "https://crm.musfiqdehan.com,http://localhost:3017,http://127.0.0.1:3017",
    ).split(",")
    if origin.strip()
]

# Cloudflare R2 Object Storage Configuration (Bucket: root, Prefix: beamline, Custom Domain: cdn.musfiqdehan.com)
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "root")
R2_KEY_PREFIX = os.getenv("R2_KEY_PREFIX", "beamline").strip("/")
R2_PUBLIC_DOMAIN = os.getenv("R2_PUBLIC_DOMAIN", "cdn.musfiqdehan.com").strip("/")
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "")
R2_ENDPOINT_URL = os.getenv(
    "R2_ENDPOINT_URL",
    f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com" if R2_ACCOUNT_ID else "",
)
USE_R2_STORAGE = os.getenv("USE_R2_STORAGE", "False").lower() in ("true", "1", "yes") or bool(
    R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY and R2_ENDPOINT_URL
)

if USE_R2_STORAGE:
    STORAGES = {
        "default": {
            "BACKEND": "common.storage.BeamlineR2MediaStorage",
        },
        "staticfiles": {
            "BACKEND": "common.storage.BeamlineR2StaticStorage",
        },
    }
else:
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }

SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
DATA_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024  # 50 MB limit for media & video uploads
FILE_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024

# Django REST Framework 3.18 Configuration
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "crm.services.auth_service.BeamlineJWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "common.responses.EnvelopeJSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
    ],
    "DEFAULT_PAGINATION_CLASS": "common.pagination.StandardCursorPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "EXCEPTION_HANDLER": "common.exceptions.custom_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "600/minute",
        "user": "1200/minute",
    },
}

# Built-in Django 6.1 MAILERS Configuration (AuditedEmailBackend logs all notifications into PostgreSQL)
MAILERS = {
    "default": {
        "BACKEND": "common.email_backend.AuditedEmailBackend",
    },
    "audited": {
        "BACKEND": "common.email_backend.AuditedEmailBackend",
    },
}
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "Kevin's Construction OS <ops-automation@crm.musfiqdehan.com>")
NOTIFICATION_RECIPIENT_EMAIL = os.getenv(
    "NOTIFICATION_RECIPIENT_EMAIL", ""
)
SMTP_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("EMAIL_PORT", "465"))
SMTP_USER = os.getenv("EMAIL_HOST_USER", "")
SMTP_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
SMTP_USE_SSL = os.getenv("EMAIL_USE_SSL", "True").lower() in ("true", "1", "yes")
SMTP_USE_TLS = os.getenv("EMAIL_USE_TLS", "False").lower() in ("true", "1", "yes")

# Notion API Settings
NOTION_API_KEY = os.getenv("NOTION_API_KEY", "")
NOTION_ROOT_PAGE_ID = os.getenv(
    "NOTION_ROOT_PAGE_ID", "4098194e-c3e8-811a-b5b1-c1b79f62bce1"
)
NOTION_VERSION = os.getenv("NOTION_VERSION", "2022-06-28")

# Optional LLM Provider Hooks
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "auto")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

# n8n Webhook Settings
N8N_WEBHOOK_URL = os.getenv(
    "N8N_WEBHOOK_URL", "http://n8n:5678/webhook/construction-cost-intake"
)

# Public Domain & API URLs (used for sample invoice PDF links, Notion properties, email notifications)
PUBLIC_BASE_URL = os.getenv(
    "PUBLIC_BASE_URL",
    "http://localhost:8017" if DEBUG else "https://crm.musfiqdehan.com",
).rstrip("/")
PUBLIC_API_URL = os.getenv(
    "PUBLIC_API_URL",
    f"{PUBLIC_BASE_URL}/api/v1",
).rstrip("/")

