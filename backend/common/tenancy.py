from __future__ import annotations

from decimal import Decimal
import secrets
from typing import Any
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


def get_default_feature_flags() -> dict[str, bool]:
    """Returns the full default catalog of feature flags for new organizations."""
    return {
        # Top-level Pages / Navigation Tabs
        "page_landing": False,
        "page_overview": True,
        "page_crm": True,
        "page_projects": True,
        "page_automation": True,
        # CRM Sub-Features
        "sub_crm_deals": True,
        "sub_crm_contacts": True,
        "sub_crm_activities": True,
        # Project Management Sub-Features
        "sub_projects_board": True,
        "sub_projects_tasks": True,
        "sub_projects_materials": True,
        # Automation & Finance Sub-Features
        "sub_automation_invoices": True,
        "sub_automation_emails": True,
        "sub_automation_simulator": True,
        # Governance, White-Label & Integrations
        "sub_executive_triage": True,
        "sub_custom_domain": True,
        "sub_custom_google_oauth": True,
        "sub_integration_notion": True,
        "sub_integration_smtp": True,
        "sub_team_invitations": True,
    }


class PlatformSettings(models.Model):
    """
    Platform-wide global settings configured exclusively by Platform Superadmin.
    Manages platform brand, base domain, and default Google OAuth credentials.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    platform_name = models.CharField(max_length=100, default="Beamline")
    base_domain = models.CharField(max_length=150, default="beamline.musfiqdehan.com")
    google_oauth_client_id = models.CharField(max_length=255, blank=True, default="")
    google_oauth_client_secret = models.CharField(max_length=255, blank=True, default="")
    google_oauth_enabled = models.BooleanField(default=False)
    allow_self_registration = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Platform Settings"
        verbose_name_plural = "Platform Settings"

    def __str__(self) -> str:
        return f"{self.platform_name} Platform Settings"

    @classmethod
    def get_settings(cls) -> "PlatformSettings":
        obj, _ = cls.objects.get_or_create(
            id="00000000-0000-0000-0000-000000000001",
            defaults={
                "platform_name": "Beamline",
                "base_domain": "beamline.musfiqdehan.com",
                "google_oauth_client_id": getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "") or "",
                "google_oauth_client_secret": getattr(settings, "GOOGLE_OAUTH_CLIENT_SECRET", "") or "",
                "google_oauth_enabled": bool(getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "")),
            },
        )
        return obj


class Organization(models.Model):
    """
    Tenant entity representing a subscriber client (e.g., Kevin's Custom Homes).
    Carries custom subdomain, custom domain, dynamic thresholds, and feature entitlements.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(max_length=100, unique=True, db_index=True)
    custom_domain = models.CharField(
        max_length=255, blank=True, null=True, unique=True, db_index=True
    )
    custom_domain_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Platform Superadmin can enable or disable this entire client organization.",
    )

    # Dynamic Governance & Thresholds
    currency = models.CharField(max_length=8, default="USD")
    deal_review_threshold = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("1000000.00"),
        help_text="Opportunities with estimated value equal or above this require executive sign-off.",
    )
    invoice_review_threshold = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("5000.00"),
        help_text="Vendor invoices equal or above this require executive sign-off.",
    )
    executive_recipient_email = models.EmailField(
        blank=True,
        default="",
        help_text="Founder/Executive recipient email for high-value alerts and flagged cost reviews.",
    )

    # Client-Level Google OAuth
    use_custom_google_oauth = models.BooleanField(
        default=False,
        help_text="If enabled, login for this tenant uses the client's own Google OAuth credentials.",
    )
    google_oauth_client_id = models.CharField(max_length=255, blank=True, default="")
    google_oauth_client_secret = models.CharField(max_length=255, blank=True, default="")

    # Granular Feature Entitlements
    feature_flags = models.JSONField(
        default=get_default_feature_flags,
        blank=True,
        help_text="Granular dictionary of enabled pages, features, and sub-features.",
    )

    # Branding
    logo_url = models.URLField(max_length=500, blank=True, default="")
    primary_color = models.CharField(max_length=16, default="#4f46e5")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.slug})"

    def get_feature_flags(self) -> dict[str, bool]:
        defaults = get_default_feature_flags()
        if isinstance(self.feature_flags, dict):
            defaults.update(self.feature_flags)
        return defaults

    def is_feature_enabled(self, flag: str) -> bool:
        flags = self.get_feature_flags()
        return bool(flags.get(flag, False))

    @property
    def subdomain_host(self) -> str:
        platform = PlatformSettings.get_settings()
        return f"{self.slug}.{platform.base_domain}"


class OrganizationMember(models.Model):
    """Associates users with organizations and assigns RBAC roles."""

    class Role(models.TextChoices):
        OWNER = "Owner", "Owner / Executive"
        ADMIN = "Admin", "Administrator"
        PM = "PM", "Project Manager"
        SALES = "Sales", "Sales Representative"
        FIELD = "Field", "Site Superintendent"
        ACCOUNTANT = "Accountant", "Bookkeeper / Accountant"
        CLIENT = "Client", "Client (Read-Only / Approvals)"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="members"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organization_memberships",
    )
    role = models.CharField(
        max_length=32, choices=Role.choices, default=Role.PM, db_index=True
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("organization", "user")
        ordering = ["organization", "role", "user__username"]

    def __str__(self) -> str:
        return f"{self.user} ({self.role}) @ {self.organization.slug}"


class Invitation(models.Model):
    """
    Two-tier invitation records:
    1. CLIENT_ONBOARDING: Superadmin invites a new Client Owner to onboard their organization.
    2. TEAM_MEMBER: Client Owner/Admin invites team members with specific roles.
    """

    class InvitationType(models.TextChoices):
        CLIENT_ONBOARDING = "CLIENT_ONBOARDING", "Client Organization Onboarding"
        TEAM_MEMBER = "TEAM_MEMBER", "Team Member Invitation"

    class Status(models.TextChoices):
        PENDING = "Pending", "Pending"
        ACCEPTED = "Accepted", "Accepted"
        EXPIRED = "Expired", "Expired"
        REVOKED = "Revoked", "Revoked"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invitation_type = models.CharField(
        max_length=32,
        choices=InvitationType.choices,
        default=InvitationType.TEAM_MEMBER,
        db_index=True,
    )
    email = models.EmailField(max_length=254, db_index=True)
    invited_name = models.CharField(max_length=180, blank=True, default="")
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="invitations",
        null=True,
        blank=True,
    )
    role = models.CharField(
        max_length=32, choices=OrganizationMember.Role.choices, default=OrganizationMember.Role.PM
    )
    token = models.CharField(max_length=128, unique=True, db_index=True)
    status = models.CharField(
        max_length=24, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_invitations",
    )
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"[{self.invitation_type}] {self.email} -> {self.organization.slug if self.organization else 'New Client'}"

    @classmethod
    def generate_token(cls) -> str:
        return secrets.token_urlsafe(32)

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at


class TenantManager(models.Manager):
    """
    Manager that automatically scopes querysets to the current tenant resolved from
    the request, while preserving an unscoped `all_objects` manager for system tasks.
    """

    def get_queryset(self):
        from common.middleware import get_current_tenant

        qs = super().get_queryset()
        tenant = get_current_tenant()
        if tenant:
            return qs.filter(organization=tenant)
        return qs
