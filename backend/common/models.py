from __future__ import annotations

import uuid
from django.db import models


class BaseModel(models.Model):
    """
    Reusable abstract base model providing UUID primary key, Notion sync fields,
    soft-active state, arbitrary JSON metadata, and indexed timestamps.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notion_page_id = models.CharField(
        max_length=64, blank=True, null=True, db_index=True
    )
    notion_url = models.URLField(max_length=500, blank=True, default="")
    is_active = models.BooleanField(default=True, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        abstract = True
        ordering = ["-created_at", "-id"]

