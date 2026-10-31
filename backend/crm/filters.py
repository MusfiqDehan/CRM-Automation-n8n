from __future__ import annotations

import django_filters
from crm.models import (
    ConstructionProject,
    Contact,
    EmailCommunicationLog,
    MaterialOrder,
    Opportunity,
    ProjectCost,
    ProjectTask,
    SalesActivity,
)


class ContactFilterSet(django_filters.FilterSet):
    contact_type = django_filters.CharFilter(field_name="contact_type", lookup_expr="exact")
    preferred_channel = django_filters.CharFilter(field_name="preferred_channel", lookup_expr="exact")

    class Meta:
        model = Contact
        fields = ["contact_type", "preferred_channel", "is_active"]


class OpportunityFilterSet(django_filters.FilterSet):
    stage = django_filters.CharFilter(field_name="stage", lookup_expr="exact")
    sales_owner = django_filters.CharFilter(field_name="sales_owner", lookup_expr="icontains")
    requires_kevin_review = django_filters.BooleanFilter(field_name="requires_kevin_review")
    min_value = django_filters.NumberFilter(field_name="estimated_value", lookup_expr="gte")
    max_value = django_filters.NumberFilter(field_name="estimated_value", lookup_expr="lte")

    class Meta:
        model = Opportunity
        fields = [
            "stage",
            "sales_owner",
            "requires_kevin_review",
            "design_agreement_status",
            "construction_agreement_status",
            "contact",
            "linked_project",
        ]


class SalesActivityFilterSet(django_filters.FilterSet):
    activity_type = django_filters.CharFilter(field_name="activity_type", lookup_expr="exact")
    completed = django_filters.BooleanFilter(field_name="completed")
    owner = django_filters.CharFilter(field_name="owner", lookup_expr="icontains")

    class Meta:
        model = SalesActivity
        fields = ["activity_type", "completed", "owner", "opportunity", "contact"]


class ConstructionProjectFilterSet(django_filters.FilterSet):
    phase = django_filters.CharFilter(field_name="phase", lookup_expr="exact")
    status = django_filters.CharFilter(field_name="status", lookup_expr="exact")
    project_manager = django_filters.CharFilter(field_name="project_manager", lookup_expr="icontains")

    class Meta:
        model = ConstructionProject
        fields = ["phase", "status", "project_manager", "code"]


class ProjectTaskFilterSet(django_filters.FilterSet):
    phase = django_filters.CharFilter(field_name="phase", lookup_expr="exact")
    status = django_filters.CharFilter(field_name="status", lookup_expr="exact")
    priority = django_filters.CharFilter(field_name="priority", lookup_expr="exact")
    assigned_to = django_filters.CharFilter(field_name="assigned_to", lookup_expr="icontains")

    class Meta:
        model = ProjectTask
        fields = ["project", "phase", "status", "priority", "assigned_to"]


class MaterialOrderFilterSet(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name="status", lookup_expr="exact")
    supplier = django_filters.CharFilter(field_name="supplier", lookup_expr="icontains")

    class Meta:
        model = MaterialOrder
        fields = ["project", "status", "supplier"]


class ProjectCostFilterSet(django_filters.FilterSet):
    payment_status = django_filters.CharFilter(field_name="payment_status", lookup_expr="exact")
    currency = django_filters.CharFilter(field_name="currency", lookup_expr="exact")
    needs_clarification = django_filters.BooleanFilter(field_name="needs_clarification")
    supplier = django_filters.CharFilter(field_name="supplier", lookup_expr="icontains")
    min_amount = django_filters.NumberFilter(field_name="amount", lookup_expr="gte")
    max_amount = django_filters.NumberFilter(field_name="amount", lookup_expr="lte")

    class Meta:
        model = ProjectCost
        fields = [
            "project",
            "payment_status",
            "currency",
            "needs_clarification",
            "supplier",
            "document_reference",
        ]


class EmailCommunicationLogFilterSet(django_filters.FilterSet):
    direction = django_filters.CharFilter(field_name="direction", lookup_expr="icontains")
    status = django_filters.CharFilter(field_name="status", lookup_expr="icontains")
    subject = django_filters.CharFilter(field_name="subject", lookup_expr="icontains")
    sender = django_filters.CharFilter(field_name="sender", lookup_expr="icontains")
    recipient = django_filters.CharFilter(field_name="recipient", lookup_expr="icontains")

    class Meta:
        model = EmailCommunicationLog
        fields = ["direction", "status", "related_cost", "subject", "sender", "recipient"]

