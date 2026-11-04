from __future__ import annotations

from django.contrib import admin
from integrations.models import (
    IntegrationExecutionLog,
    PaymentTransaction,
    PlatformIntegrationConfig,
    TenantIntegrationConfig,
)


@admin.register(PlatformIntegrationConfig)
class PlatformIntegrationConfigAdmin(admin.ModelAdmin):
    list_display = (
        "provider_key",
        "is_enabled_globally",
        "availability_mode",
        "allow_platform_credentials_fallback",
        "allow_tenant_custom_credentials",
        "last_test_status",
        "updated_at",
    )
    list_filter = ("is_enabled_globally", "availability_mode", "last_test_status")
    search_fields = ("provider_key",)


@admin.register(TenantIntegrationConfig)
class TenantIntegrationConfigAdmin(admin.ModelAdmin):
    list_display = (
        "organization",
        "provider_key",
        "is_enabled",
        "use_custom_credentials",
        "status",
        "last_tested_at",
        "updated_at",
    )
    list_filter = ("provider_key", "is_enabled", "status")
    search_fields = ("organization__name", "organization__slug", "provider_key")


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "provider_key",
        "scope",
        "organization",
        "amount",
        "currency",
        "status",
        "external_transaction_id",
        "created_at",
    )
    list_filter = ("provider_key", "scope", "status", "is_sandbox")
    search_fields = ("external_transaction_id", "customer_email", "description")


@admin.register(IntegrationExecutionLog)
class IntegrationExecutionLogAdmin(admin.ModelAdmin):
    list_display = (
        "provider_key",
        "action",
        "organization",
        "status",
        "credential_source",
        "duration_ms",
        "created_at",
    )
    list_filter = ("provider_key", "status", "credential_source")
    search_fields = ("provider_key", "action", "summary")

