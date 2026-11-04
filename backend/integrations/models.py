from __future__ import annotations

from decimal import Decimal
from typing import Any
import uuid
from django.db import models
from django.utils import timezone
from common.tenancy import ClientSubscription, Organization
from integrations.crypto import CredentialVault


class PlatformIntegrationConfig(models.Model):
    """
    Tier 1 (Platform Superadmin) configuration and governance for a third-party service plugin.
    Controls global availability, allowed tenants/plan tiers, fallback credential policy,
    and platform-wide default credentials.
    """

    class AvailabilityMode(models.TextChoices):
        ALL_TENANTS = "ALL_TENANTS", "Available to All Tenants"
        SPECIFIC_TENANTS = "SPECIFIC_TENANTS", "Specific Tenants Only"
        PLAN_TIERS = "PLAN_TIERS", "Specific Subscription Plan Tiers"
        PLATFORM_ONLY = "PLATFORM_ONLY", "Platform Internal Only"
        DISABLED = "DISABLED", "Disabled Globally"

    class TestStatus(models.TextChoices):
        UNTESTED = "UNTESTED", "Untested"
        HEALTHY = "HEALTHY", "Healthy / Connected"
        FAILED = "FAILED", "Connection Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider_key = models.CharField(max_length=64, unique=True, db_index=True)
    is_enabled_globally = models.BooleanField(default=True, db_index=True)
    availability_mode = models.CharField(
        max_length=32,
        choices=AvailabilityMode.choices,
        default=AvailabilityMode.ALL_TENANTS,
        db_index=True,
    )
    allowed_plan_tiers = models.JSONField(
        default=list,
        blank=True,
        help_text="List of ClientSubscription.PlanTier values when availability_mode is PLAN_TIERS.",
    )
    allowed_organizations = models.ManyToManyField(
        Organization,
        blank=True,
        related_name="entitled_integrations",
        help_text="Explicitly entitled tenant organizations when availability_mode is SPECIFIC_TENANTS.",
    )
    allow_platform_credentials_fallback = models.BooleanField(
        default=True,
        help_text="If True, tenants without custom credentials can fall back to Platform credentials.",
    )
    allow_tenant_custom_credentials = models.BooleanField(
        default=True,
        help_text="If True, tenants can configure their own Bring-Your-Own-Credentials (BYOC).",
    )
    encrypted_credentials = models.JSONField(default=dict, blank=True)
    config = models.JSONField(default=dict, blank=True)
    last_tested_at = models.DateTimeField(null=True, blank=True)
    last_test_status = models.CharField(
        max_length=24, choices=TestStatus.choices, default=TestStatus.UNTESTED
    )
    last_test_message = models.TextField(blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["provider_key"]
        verbose_name = "Platform Integration Config"
        verbose_name_plural = "Platform Integration Configs"

    def __str__(self) -> str:
        return f"PlatformIntegrationConfig({self.provider_key}, mode={self.availability_mode})"

    def get_decrypted_credentials(self) -> dict[str, Any]:
        return CredentialVault.decrypt_credentials_dict(self.encrypted_credentials)

    def set_credentials(self, incoming: dict[str, Any], secret_keys: set[str] | None = None) -> None:
        self.encrypted_credentials = CredentialVault.encrypt_credentials_dict(
            incoming=incoming,
            existing_encrypted=self.encrypted_credentials,
            secret_keys=secret_keys,
        )

    def is_available_to_organization(self, organization: Organization | None) -> bool:
        if not self.is_enabled_globally or self.availability_mode == self.AvailabilityMode.DISABLED:
            return False
        if self.availability_mode == self.AvailabilityMode.ALL_TENANTS:
            return True
        if not organization:
            return self.availability_mode != self.AvailabilityMode.DISABLED
        if self.availability_mode == self.AvailabilityMode.PLATFORM_ONLY:
            return False
        if self.availability_mode == self.AvailabilityMode.SPECIFIC_TENANTS:
            return self.allowed_organizations.filter(pk=organization.pk).exists()
        if self.availability_mode == self.AvailabilityMode.PLAN_TIERS:
            sub = getattr(organization, "subscription", None)
            plan_tier = sub.plan_tier if sub else ClientSubscription.PlanTier.ENTERPRISE
            return plan_tier in (self.allowed_plan_tiers or [])
        return True


class TenantIntegrationConfig(models.Model):
    """
    Tier 2 (Tenant / Client Organization) integration configuration and BYOC credentials.
    """

    class ConnectionStatus(models.TextChoices):
        CONNECTED = "CONNECTED", "Connected"
        DISCONNECTED = "DISCONNECTED", "Disconnected"
        ERROR = "ERROR", "Connection Error"
        PENDING_SETUP = "PENDING_SETUP", "Pending Setup"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="integration_configs",
        db_index=True,
    )
    provider_key = models.CharField(max_length=64, db_index=True)
    is_enabled = models.BooleanField(default=False, db_index=True)
    use_custom_credentials = models.BooleanField(
        default=True,
        help_text="If True, uses this tenant's custom credentials. If False, uses platform fallback if permitted.",
    )
    encrypted_credentials = models.JSONField(default=dict, blank=True)
    config = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=24,
        choices=ConnectionStatus.choices,
        default=ConnectionStatus.PENDING_SETUP,
        db_index=True,
    )
    last_synced_at = models.DateTimeField(null=True, blank=True)
    last_tested_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("organization", "provider_key")
        ordering = ["organization", "provider_key"]
        verbose_name = "Tenant Integration Config"
        verbose_name_plural = "Tenant Integration Configs"

    def __str__(self) -> str:
        return f"TenantIntegrationConfig({self.organization.slug} -> {self.provider_key})"

    def get_decrypted_credentials(self) -> dict[str, Any]:
        return CredentialVault.decrypt_credentials_dict(self.encrypted_credentials)

    def set_credentials(self, incoming: dict[str, Any], secret_keys: set[str] | None = None) -> None:
        self.encrypted_credentials = CredentialVault.encrypt_credentials_dict(
            incoming=incoming,
            existing_encrypted=self.encrypted_credentials,
            secret_keys=secret_keys,
        )


class PaymentTransaction(models.Model):
    """
    Unified payment ledger supporting both:
    1. PLATFORM_SUBSCRIPTION: Tenant paying Beamline for SaaS plan via Stripe/bKash/SSLCommerz.
    2. TENANT_INVOICE / TENANT_DEAL: Tenant collecting or settling construction project invoices/deals.
    """

    class Scope(models.TextChoices):
        PLATFORM_SUBSCRIPTION = "PLATFORM_SUBSCRIPTION", "Platform SaaS Subscription"
        TENANT_INVOICE = "TENANT_INVOICE", "Tenant Project Invoice / Cost"
        TENANT_DEAL = "TENANT_DEAL", "Tenant Construction Deal Deposit"

    class Status(models.TextChoices):
        INITIATED = "INITIATED", "Initiated"
        PENDING = "PENDING", "Pending Customer Action"
        SUCCEEDED = "SUCCEEDED", "Succeeded / Paid"
        FAILED = "FAILED", "Failed"
        CANCELED = "CANCELED", "Canceled"
        REFUNDED = "REFUNDED", "Refunded"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="payment_transactions",
        null=True,
        blank=True,
        db_index=True,
    )
    provider_key = models.CharField(
        max_length=32,
        db_index=True,
        help_text="Payment gateway key: stripe, bkash, or sslcommerz.",
    )
    scope = models.CharField(
        max_length=32,
        choices=Scope.choices,
        default=Scope.TENANT_INVOICE,
        db_index=True,
    )
    status = models.CharField(
        max_length=24,
        choices=Status.choices,
        default=Status.INITIATED,
        db_index=True,
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0.00"))
    currency = models.CharField(max_length=8, default="USD")
    external_transaction_id = models.CharField(max_length=160, blank=True, default="", db_index=True)
    checkout_url = models.URLField(max_length=600, blank=True, default="")
    customer_email = models.EmailField(blank=True, default="")
    description = models.CharField(max_length=255, blank=True, default="")
    related_subscription = models.ForeignKey(
        ClientSubscription,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payment_transactions",
    )
    related_project_cost = models.ForeignKey(
        "crm.ProjectCost",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payment_transactions",
    )
    related_opportunity = models.ForeignKey(
        "crm.Opportunity",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payment_transactions",
    )
    is_sandbox = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Payment Transaction"
        verbose_name_plural = "Payment Transactions"

    def __str__(self) -> str:
        return f"[{self.provider_key.upper()}] {self.amount} {self.currency} ({self.status})"


class IntegrationExecutionLog(models.Model):
    """
    Audit log of third-party plugin operations: connection health checks,
    Notion syncs, OAuth token verifications, payment checkouts, and webhooks.
    """

    class Status(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"
        WARNING = "WARNING", "Warning"
        ERROR = "ERROR", "Error"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="integration_logs",
        db_index=True,
    )
    provider_key = models.CharField(max_length=64, db_index=True)
    action = models.CharField(max_length=80, db_index=True)
    status = models.CharField(
        max_length=24,
        choices=Status.choices,
        default=Status.SUCCESS,
        db_index=True,
    )
    duration_ms = models.PositiveIntegerField(default=0)
    credential_source = models.CharField(max_length=24, blank=True, default="platform")
    summary = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Integration Execution Log"
        verbose_name_plural = "Integration Execution Logs"

    def __str__(self) -> str:
        org_slug = self.organization.slug if self.organization else "platform"
        return f"[{self.provider_key}] {self.action} ({self.status}) @ {org_slug}"

