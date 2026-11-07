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
        "sub_integration_stripe": True,
        "sub_integration_bkash": True,
        "sub_integration_sslcommerz": True,
        "sub_team_invitations": True,
    }


class PlatformSettings(models.Model):
    """
    Platform-wide global settings configured exclusively by Platform Superadmin.
    Manages platform brand, base domain, and self-registration policy.
    Third-party integrations (including Google OAuth) are managed via the `integrations` app.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    platform_name = models.CharField(max_length=100, default="Beamline")
    base_domain = models.CharField(max_length=150, default="beamline.musfiqdehan.com")
    site_title = models.CharField(
        max_length=255,
        default="BeamLine — Multi-Tenant Construction CRM & Autonomous Operations OS",
        help_text="Platform application & SEO title.",
    )
    site_description = models.TextField(
        default="White-labeled CRM, 4-phase project execution, autonomous invoice deduplication, and executive triage for high-value custom home builders.",
        help_text="Platform meta description and SEO summary.",
    )
    logo_url = models.URLField(max_length=500, blank=True, default="", help_text="Platform brand logo URL.")
    social_cover_url = models.URLField(max_length=500, blank=True, default="", help_text="Platform 1200x630 OpenGraph & Twitter social cover image URL.")
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

    # Granular Feature Entitlements
    feature_flags = models.JSONField(
        default=get_default_feature_flags,
        blank=True,
        help_text="Granular dictionary of enabled pages, features, and sub-features.",
    )

    # Branding & Custom SEO
    site_title = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Tenant custom title for workspace and SEO meta tags.",
    )
    site_description = models.TextField(
        blank=True,
        default="",
        help_text="Tenant custom description for workspace and SEO meta tags.",
    )
    logo_url = models.URLField(max_length=500, blank=True, default="", help_text="Tenant brand logo URL.")
    social_cover_url = models.URLField(
        max_length=500,
        blank=True,
        default="",
        help_text="Tenant custom 1200x630 social preview cover in Cloudflare R2.",
    )
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


class ClientSubscription(models.Model):
    """Tracks client tenant billing subscription, payment status, and renewal."""

    class PlanTier(models.TextChoices):
        STARTER = "Starter", "Starter Builder ($199/mo)"
        PRO = "Pro", "Professional Contractor ($499/mo)"
        ENTERPRISE = "Enterprise", "Enterprise Developer ($899/mo)"

    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        TRIALING = "Trialing", "Trialing"
        PAST_DUE = "Past Due", "Past Due"
        CANCELED = "Canceled", "Canceled"

    class BillingCycle(models.TextChoices):
        MONTHLY = "Monthly", "Monthly"
        ANNUAL = "Annual", "Annual (15% discount)"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.OneToOneField(
        Organization, on_delete=models.CASCADE, related_name="subscription"
    )
    plan_tier = models.CharField(
        max_length=32, choices=PlanTier.choices, default=PlanTier.ENTERPRISE, db_index=True
    )
    monthly_price = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("899.00")
    )
    billing_cycle = models.CharField(
        max_length=24, choices=BillingCycle.choices, default=BillingCycle.MONTHLY
    )
    status = models.CharField(
        max_length=24, choices=Status.choices, default=Status.ACTIVE, db_index=True
    )
    payment_method = models.CharField(
        max_length=100, default="Stripe Card •••• 4242"
    )
    next_billing_date = models.DateField(null=True, blank=True)
    last_payment_date = models.DateField(null=True, blank=True)
    total_paid_ytd = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("5394.00")
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.organization.name} - {self.plan_tier} ({self.status})"


class ClientSupportTicket(models.Model):
    """Support requests & queries submitted by client builder organizations."""

    class Category(models.TextChoices):
        DOMAIN_DNS = "Domain & DNS", "Custom Domain & DNS"
        GOOGLE_OAUTH = "Google OAuth", "Google OAuth Configuration"
        BILLING = "Billing", "Billing & Subscription"
        FEATURE = "Feature Request", "Feature Request & Modules"
        TECHNICAL = "Technical Support", "Technical Support"

    class Priority(models.TextChoices):
        LOW = "Low", "Low Priority"
        MEDIUM = "Medium", "Medium Priority"
        HIGH = "High", "High Priority"
        CRITICAL = "Critical", "Critical Priority"

    class Status(models.TextChoices):
        OPEN = "Open", "Open"
        IN_PROGRESS = "In Progress", "In Progress"
        WAITING = "Waiting on Client", "Waiting on Client"
        RESOLVED = "Resolved", "Resolved"
        CLOSED = "Closed", "Closed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="support_tickets"
    )
    submitted_by_name = models.CharField(max_length=180, blank=True, default="")
    submitted_by_email = models.EmailField()
    subject = models.CharField(max_length=255)
    category = models.CharField(
        max_length=48, choices=Category.choices, default=Category.TECHNICAL, db_index=True
    )
    priority = models.CharField(
        max_length=24, choices=Priority.choices, default=Priority.MEDIUM, db_index=True
    )
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.OPEN, db_index=True
    )
    message = models.TextField()
    admin_notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"[{self.priority}] {self.subject} ({self.organization.slug})"


class PlatformNotification(models.Model):
    """System-wide announcements & broadcast alerts sent to client organizations."""

    class Severity(models.TextChoices):
        INFO = "info", "Information"
        WARNING = "warning", "Warning"
        CRITICAL = "critical", "Critical Alert"
        SUCCESS = "success", "Operational Notice"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    message = models.TextField()
    severity = models.CharField(
        max_length=24, choices=Severity.choices, default=Severity.INFO, db_index=True
    )
    target_organization = models.ForeignKey(
        Organization,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="platform_notifications",
        help_text="If null, applies as a platform-wide announcement to all client tenants.",
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        target = self.target_organization.slug if self.target_organization else "ALL"
        return f"[{self.severity.upper()}] {self.title} -> {target}"


class UserProfile(models.Model):
    """
    Personal profile settings for users and administrators.
    Maintains avatar URL in Cloudflare R2, user bio, job title, and contact details.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    avatar_url = models.URLField(max_length=500, blank=True, default="", help_text="Profile picture in Cloudflare R2.")
    bio = models.TextField(blank=True, default="", help_text="Personal description/bio about the user or admin.")
    job_title = models.CharField(max_length=120, blank=True, default="")
    phone = models.CharField(max_length=40, blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self) -> str:
        return f"Profile for {self.user.username}"

    @classmethod
    def get_or_create_for_user(cls, user) -> "UserProfile":
        obj, _ = cls.objects.get_or_create(user=user)
        return obj


# ─────────────────────────────────────────────────────────────────────────────
# Cloudflare R2 Object Storage Deletion Lifecycle Signals
# ─────────────────────────────────────────────────────────────────────────────
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver


@receiver(post_save, sender=Organization)
def initialize_tenant_r2_folders(sender, instance, created, **kwargs):
    """Automatically provisions tenant folder hierarchy on Cloudflare R2 upon creation."""
    if created and instance.slug:
        from common.storage import R2AssetLifecycleService
        try:
            R2AssetLifecycleService.ensure_tenant_folders(instance.slug)
        except Exception:
            pass


@receiver(pre_save, sender=PlatformSettings)
def cleanup_platform_settings_old_assets(sender, instance, **kwargs):
    if not instance.pk:
        return
    old = PlatformSettings.objects.filter(pk=instance.pk).first()
    if not old:
        return
    from common.storage import R2AssetLifecycleService

    if old.logo_url and old.logo_url != instance.logo_url:
        R2AssetLifecycleService.delete_asset(old.logo_url)
    if old.social_cover_url and old.social_cover_url != instance.social_cover_url:
        R2AssetLifecycleService.delete_asset(old.social_cover_url)


@receiver(pre_save, sender=Organization)
def cleanup_organization_old_assets(sender, instance, **kwargs):
    if not instance.pk:
        return
    old = Organization.objects.filter(pk=instance.pk).first()
    if not old:
        return
    from common.storage import R2AssetLifecycleService

    if old.logo_url and old.logo_url != instance.logo_url:
        R2AssetLifecycleService.delete_asset(old.logo_url)
    if old.social_cover_url and old.social_cover_url != instance.social_cover_url:
        R2AssetLifecycleService.delete_asset(old.social_cover_url)


@receiver(pre_save, sender=UserProfile)
def cleanup_user_profile_old_assets(sender, instance, **kwargs):
    if not instance.pk:
        return
    old = UserProfile.objects.filter(pk=instance.pk).first()
    if not old:
        return
    from common.storage import R2AssetLifecycleService

    if old.avatar_url and old.avatar_url != instance.avatar_url:
        R2AssetLifecycleService.delete_asset(old.avatar_url)


@receiver(post_delete, sender=Organization)
def cleanup_organization_deleted_assets(sender, instance, **kwargs):
    from common.storage import R2AssetLifecycleService

    if instance.logo_url:
        R2AssetLifecycleService.delete_asset(instance.logo_url)
    if instance.social_cover_url:
        R2AssetLifecycleService.delete_asset(instance.social_cover_url)


@receiver(post_delete, sender=UserProfile)
def cleanup_user_profile_deleted_assets(sender, instance, **kwargs):
    from common.storage import R2AssetLifecycleService

    if instance.avatar_url:
        R2AssetLifecycleService.delete_asset(instance.avatar_url)


