from __future__ import annotations

from decimal import Decimal
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from common.models import BaseModel


class NotionWorkspaceConfig(BaseModel):
    """Stores provisioned Notion workspace page and database IDs/URLs."""

    hub_page_id = models.CharField(max_length=64, default="4098194e-c3e8-811a-b5b1-c1b79f62bce1")
    hub_page_url = models.URLField(
        max_length=500,
        default="https://app.notion.com/p/Kevin-s-Construction-OS-4098194ec3e8811ab5b1c1b79f62bce1",
    )
    contacts_db_id = models.CharField(max_length=64, blank=True, default="4098194e-c3e8-81aa-ac76-e9668e95261a")
    contacts_db_url = models.URLField(max_length=500, blank=True, default="https://app.notion.com/p/4098194ec3e881aaac76e9668e95261a")
    opportunities_db_id = models.CharField(max_length=64, blank=True, default="4098194e-c3e8-81a3-ae85-ec1a2f2474e7")
    opportunities_db_url = models.URLField(max_length=500, blank=True, default="https://app.notion.com/p/4098194ec3e881a3ae85ec1a2f2474e7")
    activities_db_id = models.CharField(max_length=64, blank=True, default="4098194e-c3e8-81f1-a84c-dd3d785e299a")
    activities_db_url = models.URLField(max_length=500, blank=True, default="https://app.notion.com/p/4098194ec3e881f1a84cdd3d785e299a")
    projects_db_id = models.CharField(max_length=64, blank=True, default="4098194e-c3e8-819d-8936-e84f7c594da4")
    projects_db_url = models.URLField(max_length=500, blank=True, default="https://app.notion.com/p/4098194ec3e8819d8936e84f7c594da4")
    tasks_db_id = models.CharField(max_length=64, blank=True, default="4098194e-c3e8-817d-9519-ca6a6950286e")
    tasks_db_url = models.URLField(max_length=500, blank=True, default="https://app.notion.com/p/4098194ec3e8817d9519ca6a6950286e")
    materials_db_id = models.CharField(max_length=64, blank=True, default="4098194e-c3e8-8133-8d42-e75cef33f7e4")
    materials_db_url = models.URLField(max_length=500, blank=True, default="https://app.notion.com/p/4098194ec3e881338d42e75cef33f7e4")
    costs_db_id = models.CharField(max_length=64, blank=True, default="4098194e-c3e8-8168-80a6-ee408dd1a250")
    costs_db_url = models.URLField(max_length=500, blank=True, default="https://app.notion.com/p/4098194ec3e8816880a6ee408dd1a250")
    sales_dashboard_page_id = models.CharField(max_length=64, blank=True, default="4098194e-c3e8-8111-9177-d08ccaa4c436")
    sales_dashboard_url = models.URLField(max_length=500, blank=True, default="https://app.notion.com/p/Sales-Dashboard-Executive-Pipeline-Overview-4098194ec3e881119177d08ccaa4c436")
    last_synced_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"NotionWorkspaceConfig ({self.hub_page_id})"


class Contact(BaseModel):
    """CRM Contacts & Enquiries database."""

    class ContactType(models.TextChoices):
        PROSPECTIVE_CLIENT = "Prospective Client", "Prospective Client"
        ACTIVE_CLIENT = "Active Client", "Active Client"
        PAST_CLIENT = "Past Client", "Past Client"
        REFERRAL_PARTNER = "Referral Partner / Architect", "Referral Partner / Architect"
        VENDOR_SUB = "Subcontractor / Vendor", "Subcontractor / Vendor"

    class PreferredChannel(models.TextChoices):
        PHONE = "Phone Call", "Phone Call"
        EMAIL = "Email", "Email"
        TEXT = "SMS / Text", "SMS / Text"
        RESSIO = "Ressio Client Portal", "Ressio Client Portal"

    name = models.CharField(max_length=180, db_index=True)
    contact_type = models.CharField(
        max_length=64,
        choices=ContactType.choices,
        default=ContactType.PROSPECTIVE_CLIENT,
        db_index=True,
    )
    email = models.EmailField(max_length=254, db_index=True)
    phone = models.CharField(max_length=40, blank=True, default="")
    company_or_household = models.CharField(max_length=180, blank=True, default="")
    preferred_channel = models.CharField(
        max_length=40,
        choices=PreferredChannel.choices,
        default=PreferredChannel.EMAIL,
    )
    referral_source = models.CharField(max_length=180, blank=True, default="")
    enquiry_summary = models.TextField(blank=True, default="")

    def __str__(self) -> str:
        return f"{self.name} ({self.contact_type})"


class ConstructionProject(BaseModel):
    """Reusable Construction Project Management database across 4 lifecycle phases."""

    class Phase(models.TextChoices):
        PRE_CONSTRUCTION = "Pre-Construction", "Pre-Construction"
        CONSTRUCTION = "Construction", "Construction"
        CLOSEOUT = "Closeout", "Closeout"
        WARRANTY = "Warranty", "Warranty"

    class Status(models.TextChoices):
        ON_TRACK = "On Track", "On Track"
        AT_RISK = "At Risk", "At Risk"
        DELAYED = "Delayed", "Delayed"
        COMPLETED = "Completed", "Completed"

    code = models.CharField(max_length=32, unique=True, db_index=True)
    name = models.CharField(max_length=220, db_index=True)
    phase = models.CharField(
        max_length=32,
        choices=Phase.choices,
        default=Phase.PRE_CONSTRUCTION,
        db_index=True,
    )
    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.ON_TRACK,
        db_index=True,
    )
    project_manager = models.CharField(max_length=120, default="Marcus Vance (Lead PM)")
    site_address = models.CharField(max_length=255, blank=True, default="")
    contract_budget = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("3000000.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    start_date = models.DateField(null=True, blank=True)
    target_completion_date = models.DateField(null=True, blank=True)
    progress_percent = models.PositiveSmallIntegerField(default=0)
    latest_update = models.TextField(blank=True, default="")

    def clean(self) -> None:
        if (
            self.start_date
            and self.target_completion_date
            and self.target_completion_date < self.start_date
        ):
            raise ValidationError(
                {"target_completion_date": "Target completion date cannot be earlier than start date."}
            )
        if self.progress_percent > 100:
            raise ValidationError(
                {"progress_percent": "Progress percentage must be between 0 and 100."}
            )

    def __str__(self) -> str:
        return f"{self.code} - {self.name}"


class Opportunity(BaseModel):
    """Sales CRM Pipeline (Opportunities) through Qualification -> Design -> Construction Agreement."""

    class Stage(models.TextChoices):
        NEW_ENQUIRY = "1. New Enquiry", "1. New Enquiry"
        QUALIFICATION = "2. Qualification", "2. Qualification"
        DESIGN_AGREEMENT = "3. Design Agreement", "3. Design Agreement"
        CONSTRUCTION_AGREEMENT = "4. Construction Agreement", "4. Construction Agreement"
        WON = "5. Won — Handed to Ops", "5. Won — Handed to Ops"
        LOST = "Closed Lost", "Closed Lost"

    class AgreementStatus(models.TextChoices):
        NOT_STARTED = "Not Started", "Not Started"
        SENT = "Sent to Client", "Sent to Client"
        UNDER_REVIEW = "Under Review", "Under Review"
        SIGNED = "Signed & Executed", "Signed & Executed"

    name = models.CharField(max_length=220, db_index=True)
    stage = models.CharField(
        max_length=48,
        choices=Stage.choices,
        default=Stage.NEW_ENQUIRY,
        db_index=True,
    )
    sales_owner = models.CharField(
        max_length=120,
        default="Jordan Blake (Sales Lead)",
        db_index=True,
    )
    contact = models.ForeignKey(
        Contact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="opportunities",
    )
    linked_project = models.ForeignKey(
        ConstructionProject,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="opportunities",
    )
    estimated_value = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("3000000.00"),
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    design_agreement_status = models.CharField(
        max_length=32,
        choices=AgreementStatus.choices,
        default=AgreementStatus.NOT_STARTED,
    )
    construction_agreement_status = models.CharField(
        max_length=32,
        choices=AgreementStatus.choices,
        default=AgreementStatus.NOT_STARTED,
    )
    requires_kevin_review = models.BooleanField(default=False, db_index=True)
    kevin_review_notes = models.TextField(blank=True, default="")
    next_follow_up_date = models.DateField(null=True, blank=True, db_index=True)
    qualification_notes = models.TextField(blank=True, default="")

    @property
    def requires_executive_review(self) -> bool:
        return self.requires_kevin_review

    @requires_executive_review.setter
    def requires_executive_review(self, value: bool) -> None:
        self.requires_kevin_review = value

    @property
    def executive_review_notes(self) -> str:
        return self.kevin_review_notes

    @executive_review_notes.setter
    def executive_review_notes(self, value: str) -> None:
        self.kevin_review_notes = value

    def __str__(self) -> str:
        return f"{self.name} [{self.stage}]"


class SalesActivity(BaseModel):
    """Sales Activities & Follow-Ups database."""

    class ActivityType(models.TextChoices):
        DISCOVERY_CALL = "Discovery Call", "Discovery Call"
        SITE_WALKTHROUGH = "Site Walkthrough", "Site Walkthrough"
        DESIGN_CONSULTATION = "Design Consultation", "Design Consultation"
        PROPOSAL_REVIEW = "Proposal / Contract Review", "Proposal / Contract Review"
        FOLLOW_UP = "Follow-Up Touchpoint", "Follow-Up Touchpoint"

    title = models.CharField(max_length=220, db_index=True)
    activity_type = models.CharField(
        max_length=48,
        choices=ActivityType.choices,
        default=ActivityType.DISCOVERY_CALL,
        db_index=True,
    )
    opportunity = models.ForeignKey(
        Opportunity,
        on_delete=models.CASCADE,
        related_name="activities",
    )
    contact = models.ForeignKey(
        Contact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activities",
    )
    owner = models.CharField(max_length=120, default="Jordan Blake (Sales Lead)")
    activity_date = models.DateField(db_index=True)
    completed = models.BooleanField(default=False, db_index=True)
    outcome_notes = models.TextField(blank=True, default="")

    def __str__(self) -> str:
        return f"{self.title} ({self.activity_type})"


class ProjectTask(BaseModel):
    """Project Responsibilities, Deadlines, Progress, and Updates across the 4 phases."""

    class Priority(models.TextChoices):
        HIGH = "High", "High"
        MEDIUM = "Medium", "Medium"
        LOW = "Low", "Low"

    class TaskStatus(models.TextChoices):
        NOT_STARTED = "Not Started", "Not Started"
        IN_PROGRESS = "In Progress", "In Progress"
        BLOCKED = "Blocked", "Blocked"
        DONE = "Done", "Done"

    title = models.CharField(max_length=220, db_index=True)
    project = models.ForeignKey(
        ConstructionProject,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    phase = models.CharField(
        max_length=32,
        choices=ConstructionProject.Phase.choices,
        default=ConstructionProject.Phase.PRE_CONSTRUCTION,
        db_index=True,
    )
    assigned_to = models.CharField(max_length=120, default="Marcus Vance (Lead PM)")
    priority = models.CharField(
        max_length=16,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        db_index=True,
    )
    status = models.CharField(
        max_length=24,
        choices=TaskStatus.choices,
        default=TaskStatus.NOT_STARTED,
        db_index=True,
    )
    deadline = models.DateField(null=True, blank=True, db_index=True)
    progress_updates = models.TextField(blank=True, default="")

    def __str__(self) -> str:
        return f"[{self.project.code}] {self.title}"


class MaterialOrder(BaseModel):
    """Tracking Materials, Orders, and Deliveries linked to Construction Projects."""

    class OrderStatus(models.TextChoices):
        SPECIFYING = "Specifying", "Specifying"
        ORDERED = "Ordered", "Ordered"
        IN_TRANSIT = "In Transit", "In Transit"
        DELIVERED = "Delivered to Site", "Delivered to Site"
        DELAYED = "Delayed / Backordered", "Delayed / Backordered"

    item_name = models.CharField(max_length=220, db_index=True)
    project = models.ForeignKey(
        ConstructionProject,
        on_delete=models.CASCADE,
        related_name="material_orders",
    )
    supplier = models.CharField(max_length=180, db_index=True)
    order_reference = models.CharField(max_length=80, blank=True, default="", db_index=True)
    status = models.CharField(
        max_length=32,
        choices=OrderStatus.choices,
        default=OrderStatus.ORDERED,
        db_index=True,
    )
    quantity_description = models.CharField(max_length=120, blank=True, default="1 Lot")
    unit_cost_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    order_date = models.DateField(null=True, blank=True)
    expected_delivery_date = models.DateField(null=True, blank=True, db_index=True)
    actual_delivery_date = models.DateField(null=True, blank=True)
    received_by = models.CharField(max_length=120, blank=True, default="")
    delivery_notes = models.TextField(blank=True, default="")

    def clean(self) -> None:
        if (
            self.order_date
            and self.expected_delivery_date
            and self.expected_delivery_date < self.order_date
        ):
            raise ValidationError(
                {"expected_delivery_date": "Expected delivery date cannot precede order date."}
            )

    def __str__(self) -> str:
        return f"{self.item_name} ({self.supplier})"


class ProjectCost(BaseModel):
    """
    Assessment Part 3: Construction-project costs from vendor/subcontractor/field receipts & invoices.
    Supports idempotent duplicate detection and in-place status/amount updates via (supplier, document_reference).
    """

    class PaymentStatus(models.TextChoices):
        PAID = "Paid", "Paid"
        UNPAID = "Unpaid", "Unpaid"
        PARTIALLY_PAID = "Partially Paid", "Partially Paid"

    class Currency(models.TextChoices):
        USD = "USD", "USD"
        CAD = "CAD", "CAD"
        EUR = "EUR", "EUR"
        GBP = "GBP", "GBP"

    title = models.CharField(max_length=220, db_index=True)
    supplier = models.CharField(max_length=180, db_index=True)
    document_reference = models.CharField(max_length=100, db_index=True)
    project = models.ForeignKey(
        ConstructionProject,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="costs",
    )
    invoice_date = models.DateField(null=True, blank=True, db_index=True)
    event_timestamp = models.DateTimeField(
        default=timezone.now,
        db_index=True,
        help_text="Exact timestamp with seconds when the invoice was generated, received, or triggered.",
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    currency = models.CharField(
        max_length=8,
        choices=Currency.choices,
        default=Currency.USD,
    )
    payment_status = models.CharField(
        max_length=24,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID,
        db_index=True,
    )
    payment_due_date = models.DateField(null=True, blank=True, db_index=True)
    supporting_document_url = models.URLField(max_length=500, blank=True, default="")
    source_email = models.EmailField(max_length=254, blank=True, default="")
    submission_count = models.PositiveIntegerField(default=1)
    needs_clarification = models.BooleanField(default=False, db_index=True)
    clarification_notes = models.TextField(blank=True, default="")
    notified_person = models.CharField(max_length=180, blank=True, default="kevin@kevinconstruction.com")

    class Meta(BaseModel.Meta):
        indexes = [
            models.Index(fields=["supplier", "document_reference"], name="idx_supplier_docref"),
        ]

    def clean(self) -> None:
        if (
            self.invoice_date
            and self.payment_due_date
            and self.payment_due_date < self.invoice_date
        ):
            raise ValidationError(
                {"payment_due_date": "Payment due date cannot be earlier than the invoice date."}
            )

    def __str__(self) -> str:
        return f"{self.document_reference} - {self.supplier} ({self.amount} {self.currency})"


class EmailCommunicationLog(BaseModel):
    """Audit log for inbound vendor invoice emails and outbound Django EmailBackend notifications."""

    subject = models.CharField(max_length=255, db_index=True)
    sender = models.CharField(max_length=255, db_index=True)
    recipient = models.CharField(max_length=255, db_index=True)
    direction = models.CharField(
        max_length=40,
        default="Outbound Alert",
        db_index=True,
    )
    status = models.CharField(max_length=40, default="Sent", db_index=True)
    body_preview = models.TextField(blank=True, default="")
    attachment_name = models.CharField(max_length=255, blank=True, default="")
    related_cost = models.ForeignKey(
        ProjectCost,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="email_logs",
    )

    def __str__(self) -> str:
        return f"[{self.direction}] {self.subject}"


class SMTPSettings(BaseModel):
    """Stores active SMTP configuration allowing admins to edit and manage email credentials dynamically."""

    host = models.CharField(max_length=255, default="smtp.gmail.com")
    port = models.IntegerField(default=465)
    username = models.CharField(max_length=255, blank=True, default="")
    password = models.CharField(max_length=255, blank=True, default="")
    use_ssl = models.BooleanField(default=True)
    use_tls = models.BooleanField(default=False)
    default_from_email = models.CharField(
        max_length=255, blank=True, default=""
    )
    kevin_email = models.EmailField(
        blank=True,
        default="",
        help_text="Founder's recipient email for high-value alerts and flagged cost reviews.",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "SMTP Settings"
        verbose_name_plural = "SMTP Settings"

    def __str__(self) -> str:
        return f"SMTP ({self.username or 'Default'} via {self.host}:{self.port})"

    @classmethod
    def get_active(cls, organization=None) -> "SMTPSettings":
        from django.conf import settings
        from common.middleware import get_current_tenant

        org = organization or get_current_tenant()
        qs = cls.objects.filter(is_active=True)
        if org:
            obj = qs.filter(organization=org).first()
        else:
            obj = qs.first()
        if not obj:
            obj = cls.objects.create(
                organization=org,
                host=getattr(settings, "SMTP_HOST", "smtp.gmail.com") or "smtp.gmail.com",
                port=int(getattr(settings, "SMTP_PORT", 465) or 465),
                username=getattr(settings, "SMTP_USER", "") or "",
                password=getattr(settings, "SMTP_PASSWORD", "") or "",
                use_ssl=getattr(settings, "SMTP_USE_SSL", True),
                use_tls=getattr(settings, "SMTP_USE_TLS", False),
                default_from_email=getattr(
                    settings, "DEFAULT_FROM_EMAIL", ""
                ) or "",
                kevin_email=getattr(
                    settings, "NOTIFICATION_RECIPIENT_EMAIL", ""
                ) or (org.executive_recipient_email if org else ""),
                is_active=True,
            )
        return obj

