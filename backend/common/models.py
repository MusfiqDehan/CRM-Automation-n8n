from __future__ import annotations

import uuid
from django.db import models
from common.tenancy import (
    Invitation,
    Organization,
    OrganizationMember,
    PlatformSettings,
    TenantManager,
)

__all__ = [
    "BaseModel",
    "PlatformSettings",
    "Organization",
    "OrganizationMember",
    "Invitation",
    "TenantManager",
]


class BaseModel(models.Model):
    """
    Reusable abstract base model providing UUID primary key, organization FK for multi-tenancy,
    Notion sync fields, soft-active state, arbitrary JSON metadata, and indexed timestamps.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="%(app_label)s_%(class)s_records",
        null=True,
        blank=True,
        db_index=True,
    )
    notion_page_id = models.CharField(
        max_length=64, blank=True, null=True, db_index=True
    )
    notion_url = models.URLField(max_length=500, blank=True, default="")
    is_active = models.BooleanField(default=True, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    objects = TenantManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True
        ordering = ["-created_at", "-id"]

    def save(self, *args, **kwargs):
        if not self.organization_id:
            from common.middleware import get_current_tenant

            tenant = get_current_tenant()
            if not tenant:
                from common.tenancy import Organization

                tenant = Organization.objects.filter(slug="kevin").first()
            if tenant:
                self.organization = tenant
        super().save(*args, **kwargs)
