from __future__ import annotations

import re
from decimal import Decimal
from rest_framework import serializers
from crm.models import (
    ConstructionProject,
    Contact,
    EmailCommunicationLog,
    MaterialOrder,
    NotionWorkspaceConfig,
    Opportunity,
    ProjectCost,
    ProjectTask,
    SalesActivity,
    SMTPSettings,
)

PHONE_REGEX = re.compile(r"^[0-9+\-() .ext]{7,30}$", re.IGNORECASE)


class NotionWorkspaceConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotionWorkspaceConfig
        fields = "__all__"


class ContactSerializer(serializers.ModelSerializer):
    opportunities_count = serializers.IntegerField(
        source="opportunities.count", read_only=True
    )

    class Meta:
        model = Contact
        fields = [
            "id",
            "name",
            "contact_type",
            "email",
            "phone",
            "company_or_household",
            "preferred_channel",
            "referral_source",
            "enquiry_summary",
            "opportunities_count",
            "notion_page_id",
            "notion_url",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "opportunities_count", "created_at", "updated_at"]

    def validate_name(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise serializers.ValidationError("Contact name must be at least 2 characters long.")
        return cleaned

    def validate_phone(self, value: str) -> str:
        cleaned = value.strip()
        if cleaned and not PHONE_REGEX.match(cleaned):
            raise serializers.ValidationError("Please enter a valid phone number format.")
        return cleaned


class ConstructionProjectSerializer(serializers.ModelSerializer):
    tasks_count = serializers.IntegerField(source="tasks.count", read_only=True)
    materials_count = serializers.IntegerField(source="material_orders.count", read_only=True)
    costs_count = serializers.IntegerField(source="costs.count", read_only=True)

    class Meta:
        model = ConstructionProject
        fields = [
            "id",
            "code",
            "name",
            "phase",
            "status",
            "project_manager",
            "site_address",
            "contract_budget",
            "start_date",
            "target_completion_date",
            "progress_percent",
            "latest_update",
            "tasks_count",
            "materials_count",
            "costs_count",
            "notion_page_id",
            "notion_url",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "tasks_count",
            "materials_count",
            "costs_count",
            "created_at",
            "updated_at",
        ]

    def validate_code(self, value: str) -> str:
        cleaned = value.strip().upper()
        if len(cleaned) < 3:
            raise serializers.ValidationError("Project code must be at least 3 characters (e.g., PRJ-101).")
        return cleaned

    def validate_contract_budget(self, value: Decimal) -> Decimal:
        if value <= Decimal("0"):
            raise serializers.ValidationError("Contract budget must be greater than zero.")
        return value

    def validate_progress_percent(self, value: int) -> int:
        if not (0 <= value <= 100):
            raise serializers.ValidationError("Progress percentage must be between 0 and 100.")
        return value

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        target_date = attrs.get(
            "target_completion_date",
            getattr(self.instance, "target_completion_date", None),
        )
        if start_date and target_date and target_date < start_date:
            raise serializers.ValidationError(
                {"target_completion_date": "Target completion date cannot be earlier than start date."}
            )
        return attrs


class OpportunitySerializer(serializers.ModelSerializer):
    contact = serializers.PrimaryKeyRelatedField(
        queryset=Contact.objects.all(), required=False, allow_null=True
    )
    linked_project = serializers.PrimaryKeyRelatedField(
        queryset=ConstructionProject.objects.all(), required=False, allow_null=True
    )
    contact_name = serializers.CharField(source="contact.name", read_only=True, default="")
    project_name = serializers.CharField(
        source="linked_project.name", read_only=True, default=""
    )
    project_code = serializers.CharField(
        source="linked_project.code", read_only=True, default=""
    )

    class Meta:
        model = Opportunity
        fields = [
            "id",
            "name",
            "stage",
            "sales_owner",
            "contact",
            "contact_name",
            "linked_project",
            "project_name",
            "project_code",
            "estimated_value",
            "design_agreement_status",
            "construction_agreement_status",
            "requires_kevin_review",
            "kevin_review_notes",
            "next_follow_up_date",
            "qualification_notes",
            "notion_page_id",
            "notion_url",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "contact_name",
            "project_name",
            "project_code",
            "created_at",
            "updated_at",
        ]

    def to_internal_value(self, data):
        if isinstance(data, dict) and data.get("next_follow_up_date") == "":
            data = data.copy()
            data["next_follow_up_date"] = None
        return super().to_internal_value(data)

    def validate_name(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise serializers.ValidationError("Opportunity name must be at least 3 characters.")
        return cleaned

    def validate_estimated_value(self, value: Decimal) -> Decimal:
        if value <= Decimal("0"):
            raise serializers.ValidationError("Estimated deal value must be greater than zero.")
        return value


class SalesActivitySerializer(serializers.ModelSerializer):
    opportunity = serializers.PrimaryKeyRelatedField(
        queryset=Opportunity.objects.all()
    )
    contact = serializers.PrimaryKeyRelatedField(
        queryset=Contact.objects.all(), required=False, allow_null=True
    )
    opportunity_name = serializers.CharField(
        source="opportunity.name", read_only=True, default=""
    )
    contact_name = serializers.CharField(source="contact.name", read_only=True, default="")

    class Meta:
        model = SalesActivity
        fields = [
            "id",
            "title",
            "activity_type",
            "opportunity",
            "opportunity_name",
            "contact",
            "contact_name",
            "owner",
            "activity_date",
            "completed",
            "outcome_notes",
            "notion_page_id",
            "notion_url",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "opportunity_name",
            "contact_name",
            "created_at",
            "updated_at",
        ]

    def validate_title(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise serializers.ValidationError("Activity title must be at least 3 characters.")
        return cleaned


class ProjectTaskSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(
        queryset=ConstructionProject.objects.all()
    )
    project_name = serializers.CharField(source="project.name", read_only=True, default="")
    project_code = serializers.CharField(source="project.code", read_only=True, default="")

    class Meta:
        model = ProjectTask
        fields = [
            "id",
            "title",
            "project",
            "project_name",
            "project_code",
            "phase",
            "assigned_to",
            "priority",
            "status",
            "deadline",
            "progress_updates",
            "notion_page_id",
            "notion_url",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "project_name", "project_code", "created_at", "updated_at"]

    def validate_title(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise serializers.ValidationError("Task title must be at least 3 characters.")
        return cleaned


class MaterialOrderSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(
        queryset=ConstructionProject.objects.all()
    )
    project_name = serializers.CharField(source="project.name", read_only=True, default="")
    project_code = serializers.CharField(source="project.code", read_only=True, default="")

    class Meta:
        model = MaterialOrder
        fields = [
            "id",
            "item_name",
            "project",
            "project_name",
            "project_code",
            "supplier",
            "order_reference",
            "status",
            "quantity_description",
            "unit_cost_total",
            "order_date",
            "expected_delivery_date",
            "actual_delivery_date",
            "received_by",
            "delivery_notes",
            "notion_page_id",
            "notion_url",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "project_name", "project_code", "created_at", "updated_at"]

    def validate_item_name(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise serializers.ValidationError("Material item name must be at least 2 characters.")
        return cleaned

    def validate(self, attrs):
        order_date = attrs.get("order_date", getattr(self.instance, "order_date", None))
        expected_date = attrs.get(
            "expected_delivery_date",
            getattr(self.instance, "expected_delivery_date", None),
        )
        if order_date and expected_date and expected_date < order_date:
            raise serializers.ValidationError(
                {"expected_delivery_date": "Expected delivery date cannot precede order date."}
            )
        return attrs


class ProjectCostSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(
        queryset=ConstructionProject.objects.all(), required=False, allow_null=True
    )
    project_name = serializers.CharField(source="project.name", read_only=True, default="")
    project_code = serializers.CharField(source="project.code", read_only=True, default="")

    class Meta:
        model = ProjectCost
        fields = [
            "id",
            "title",
            "supplier",
            "document_reference",
            "project",
            "project_name",
            "project_code",
            "invoice_date",
            "event_timestamp",
            "amount",
            "currency",
            "payment_status",
            "payment_due_date",
            "supporting_document_url",
            "source_email",
            "submission_count",
            "needs_clarification",
            "clarification_notes",
            "notified_person",
            "notion_page_id",
            "notion_url",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "project_name",
            "project_code",
            "created_at",
            "updated_at",
        ]

    def validate_amount(self, value: Decimal) -> Decimal:
        if value <= Decimal("0"):
            raise serializers.ValidationError("Cost amount must be strictly greater than zero.")
        return value

    def validate_document_reference(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise serializers.ValidationError("Document reference is required.")
        return cleaned

    def validate(self, attrs):
        invoice_date = attrs.get("invoice_date", getattr(self.instance, "invoice_date", None))
        due_date = attrs.get("payment_due_date", getattr(self.instance, "payment_due_date", None))
        if invoice_date and due_date and due_date < invoice_date:
            raise serializers.ValidationError(
                {"payment_due_date": "Payment due date cannot be earlier than the invoice date."}
            )
        return attrs


class EmailCommunicationLogSerializer(serializers.ModelSerializer):
    related_cost = serializers.PrimaryKeyRelatedField(
        queryset=ProjectCost.objects.all(), required=False, allow_null=True
    )
    related_cost_ref = serializers.CharField(
        source="related_cost.document_reference", read_only=True, default=""
    )

    class Meta:
        model = EmailCommunicationLog
        fields = [
            "id",
            "subject",
            "sender",
            "recipient",
            "direction",
            "status",
            "body_preview",
            "attachment_name",
            "related_cost",
            "related_cost_ref",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "related_cost_ref", "created_at", "updated_at"]


class InvoiceExtractRequestSerializer(serializers.Serializer):
    """Validates incoming email/PDF extraction requests from n8n or simulator."""

    email_subject = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    email_sender = serializers.EmailField(required=False, allow_blank=True, default="billing@vendor.com")
    email_body = serializers.CharField(required=False, allow_blank=True, default="")
    attachment_base64 = serializers.CharField(required=False, allow_blank=True, default="")
    attachment_filename = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    llm_provider = serializers.ChoiceField(
        choices=["auto", "deterministic", "openai", "gemini", "deepseek"],
        default="auto",
        required=False,
    )


class InvoiceProcessRequestSerializer(serializers.Serializer):
    """Validates extracted cost payload for idempotent deduplication, Notion sync, and notification."""

    title = serializers.CharField(max_length=220, required=False, allow_blank=True, default="")
    supplier = serializers.CharField(max_length=180, required=False, allow_blank=True, default="")
    document_reference = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    project_reference = serializers.CharField(max_length=220, required=False, allow_blank=True, default="")
    invoice_date = serializers.DateField(required=False, allow_null=True, default=None)
    event_timestamp = serializers.DateTimeField(required=False, allow_null=True, default=None)
    amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, allow_null=True, default=None
    )
    currency = serializers.ChoiceField(
        choices=["USD", "CAD", "EUR", "GBP"], default="USD", required=False
    )
    payment_status = serializers.ChoiceField(
        choices=["Paid", "Unpaid", "Partially Paid"], default="Unpaid", required=False
    )
    payment_due_date = serializers.DateField(required=False, allow_null=True, default=None)
    supporting_document_url = serializers.URLField(required=False, allow_blank=True, default="")
    source_email = serializers.EmailField(required=False, allow_blank=True, default="vendor@supplier.com")
    sync_to_notion = serializers.BooleanField(default=True, required=False)


class SMTPSettingsSerializer(serializers.ModelSerializer):
    """Serializer for admin to view and edit SMTP configuration."""

    has_password = serializers.SerializerMethodField()

    class Meta:
        model = SMTPSettings
        fields = [
            "id",
            "host",
            "port",
            "username",
            "password",
            "has_password",
            "use_ssl",
            "use_tls",
            "default_from_email",
            "kevin_email",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "password": {"required": False, "allow_blank": True},
            "username": {"required": False, "allow_blank": True},
            "host": {"required": False, "allow_blank": True},
            "default_from_email": {"required": False, "allow_blank": True},
            "kevin_email": {"required": False, "allow_blank": True},
        }

    def get_has_password(self, obj: SMTPSettings) -> bool:
        from django.conf import settings

        return bool(obj.password or getattr(settings, "SMTP_PASSWORD", ""))

    def to_representation(self, instance: SMTPSettings) -> dict:
        from django.conf import settings

        data = super().to_representation(instance)
        # Render default credentials dynamically from env variables if blank
        if not data.get("host"):
            data["host"] = getattr(settings, "SMTP_HOST", "smtp.gmail.com") or "smtp.gmail.com"
        if not data.get("port"):
            data["port"] = int(getattr(settings, "SMTP_PORT", 465) or 465)
        if not data.get("username"):
            data["username"] = getattr(settings, "SMTP_USER", "") or ""
        if not data.get("default_from_email"):
            data["default_from_email"] = (
                getattr(settings, "DEFAULT_FROM_EMAIL", "")
                or f"Kevin's Construction OS <{data['username']}>" if data.get("username") else ""
            )
        if not data.get("kevin_email"):
            data["kevin_email"] = getattr(settings, "NOTIFICATION_RECIPIENT_EMAIL", "") or data.get("username", "")

        # Never reveal the app password to frontend after render
        data["password"] = ""
        return data

    def validate_password(self, value: str) -> str:
        return (value or "").strip().replace(" ", "")

    def update(self, instance: SMTPSettings, validated_data: dict) -> SMTPSettings:
        # If password is empty or not passed, keep the existing password
        if "password" in validated_data:
            pw = validated_data["password"]
            if not pw:
                validated_data.pop("password", None)
            else:
                validated_data["password"] = pw.strip().replace(" ", "")
        return super().update(instance, validated_data)


class SMTPTestConnectionSerializer(serializers.Serializer):
    """Allows testing outbound SMTP transmission to any recipient."""

    recipient = serializers.EmailField(required=False, allow_blank=True, default="")
    subject = serializers.CharField(
        max_length=255,
        required=False,
        default="Kevin Construction OS — Live SMTP Verification",
    )
    body = serializers.CharField(
        required=False,
        default="Live verification email sent from Kevin's Construction OS via Gmail SMTP SSL.",
    )


class ClientEmailTriggerSerializer(serializers.Serializer):
    """Allows triggering realistic client emails per Part 3 assessment."""

    client_email = serializers.EmailField(default="musfiq.works+client1@gmail.com")
    client_name = serializers.CharField(max_length=255, default="Arthur & Clara Henderson")
    project_code = serializers.CharField(max_length=50, default="PRJ-101")
    email_type = serializers.ChoiceField(
        choices=[
            "milestone_update",
            "design_agreement",
            "invoice_notice",
            "review_alert",
            "custom",
        ],
        default="milestone_update",
    )
    subject = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    message = serializers.CharField(required=False, allow_blank=True, default="")

