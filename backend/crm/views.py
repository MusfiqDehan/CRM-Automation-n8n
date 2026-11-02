from __future__ import annotations

import base64
from datetime import date, timedelta
from decimal import Decimal
import logging
from pathlib import Path
import httpx
from django.conf import settings
from django.db.models import Count, Sum
from django.http import FileResponse, HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from common.responses import api_response
from common.views import BaseDetailAPIView, BaseListCreateAPIView
from crm.filters import (
    ConstructionProjectFilterSet,
    ContactFilterSet,
    EmailCommunicationLogFilterSet,
    MaterialOrderFilterSet,
    OpportunityFilterSet,
    ProjectCostFilterSet,
    ProjectTaskFilterSet,
    SalesActivityFilterSet,
)
from crm.models import (
    ConstructionProject,
    Contact,
    EmailCommunicationLog,
    MaterialOrder,
    Opportunity,
    ProjectCost,
    ProjectTask,
    SalesActivity,
    SMTPSettings,
)
from crm.serializers import (
    ClientEmailTriggerSerializer,
    ConstructionProjectSerializer,
    ContactSerializer,
    EmailCommunicationLogSerializer,
    InvoiceExtractRequestSerializer,
    InvoiceProcessRequestSerializer,
    MaterialOrderSerializer,
    NotionWorkspaceConfigSerializer,
    OpportunitySerializer,
    ProjectCostSerializer,
    ProjectTaskSerializer,
    SalesActivitySerializer,
    SMTPSettingsSerializer,
    SMTPTestConnectionSerializer,
)
from crm.services.cost_processor import CostAutomationProcessor
from crm.services.llm_extractor import InvoiceExtractorService, generate_sample_invoice_pdf
from crm.services.notion_provisioner import NotionProvisionerService

logger = logging.getLogger(__name__)


# ==============================================================================
# 1. Contacts & Client Enquiries (APIViews)
# ==============================================================================
class ContactListCreateAPIView(BaseListCreateAPIView):
    """
    GET:  Returns paginated list of client contacts and enquiries with search/filter.
    POST: Creates a new contact with Zod-compatible validation.
    """

    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    filterset_class = ContactFilterSet
    search_fields = [
        "name",
        "email",
        "phone",
        "company_or_household",
        "referral_source",
        "enquiry_summary",
    ]
    ordering_fields = ["created_at", "updated_at", "name", "contact_type"]
    entity_name = "Contact"


class ContactDetailAPIView(BaseDetailAPIView):
    """
    GET:    Retrieve a single contact by ID.
    PUT:    Full update of contact details.
    PATCH:  Partial update of contact details.
    DELETE: Remove contact record.
    """

    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    entity_name = "Contact"


# ==============================================================================
# 2. Opportunities / Deals (APIViews)
# ==============================================================================
class OpportunityListCreateAPIView(BaseListCreateAPIView):
    """
    GET:  Returns paginated list of high-value custom residential deals ($3M+).
    POST: Creates a new deal, with optional 'Requires Kevin's Review' flag.
    """

    queryset = Opportunity.objects.select_related("contact", "linked_project").all()
    serializer_class = OpportunitySerializer
    filterset_class = OpportunityFilterSet
    search_fields = [
        "name",
        "sales_owner",
        "kevin_review_notes",
        "qualification_notes",
        "contact__name",
    ]
    ordering_fields = [
        "created_at",
        "updated_at",
        "estimated_value",
        "next_follow_up_date",
        "stage",
    ]
    entity_name = "Opportunity"

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 201 and response.data and response.data.get("success"):
            new_id = response.data.get("data", {}).get("id")
            if new_id:
                try:
                    opp = Opportunity.objects.select_related("contact", "linked_project").filter(pk=new_id).first()
                    if opp:
                        NotionProvisionerService().upsert_opportunity_in_notion(opp)
                except Exception as e:
                    logger.warning(f"Failed to sync newly created opportunity {new_id} to Notion: {e}")
        return response


class OpportunityDetailAPIView(BaseDetailAPIView):
    """
    GET:    Retrieve deal details and Kevin review status.
    PUT:    Full update of opportunity.
    PATCH:  Partial update (e.g. stage change, agreements signed).
    DELETE: Remove opportunity.
    """

    queryset = Opportunity.objects.select_related("contact", "linked_project").all()
    serializer_class = OpportunitySerializer
    entity_name = "Opportunity"

    def patch(self, request, pk: str, *args, **kwargs):
        response = super().patch(request, pk, *args, **kwargs)
        if response.status_code == 200:
            try:
                opp = Opportunity.objects.select_related("contact", "linked_project").filter(pk=pk).first()
                if opp:
                    NotionProvisionerService().upsert_opportunity_in_notion(opp)
            except Exception as e:
                logger.warning(f"Failed to sync updated opportunity {pk} to Notion: {e}")
        return response

    def put(self, request, pk: str, *args, **kwargs):
        response = super().put(request, pk, *args, **kwargs)
        if response.status_code == 200:
            try:
                opp = Opportunity.objects.select_related("contact", "linked_project").filter(pk=pk).first()
                if opp:
                    NotionProvisionerService().upsert_opportunity_in_notion(opp)
            except Exception as e:
                logger.warning(f"Failed to sync updated opportunity {pk} to Notion: {e}")
        return response


# ==============================================================================
# 3. Sales Activities & Client Touchpoints (APIViews)
# ==============================================================================
class SalesActivityListCreateAPIView(BaseListCreateAPIView):
    """
    GET:  Returns logged client consultations, calls, and design meetings.
    POST: Records a new activity linked to an opportunity and contact.
    """

    queryset = SalesActivity.objects.select_related("opportunity", "contact").all()
    serializer_class = SalesActivitySerializer
    filterset_class = SalesActivityFilterSet
    search_fields = [
        "title",
        "owner",
        "outcome_notes",
        "opportunity__name",
        "contact__name",
    ]
    ordering_fields = ["created_at", "updated_at", "activity_date", "completed"]
    entity_name = "Sales Activity"


class SalesActivityDetailAPIView(BaseDetailAPIView):
    """
    GET:    Retrieve activity details.
    PUT:    Full update of activity.
    PATCH:  Partial update (e.g. mark completed, append outcome notes).
    DELETE: Remove activity record.
    """

    queryset = SalesActivity.objects.select_related("opportunity", "contact").all()
    serializer_class = SalesActivitySerializer
    entity_name = "Sales Activity"


# ==============================================================================
# 4. Construction Projects (APIViews)
# ==============================================================================
class ConstructionProjectListCreateAPIView(BaseListCreateAPIView):
    """
    GET:  Returns 4-phase custom builds with progress % and budgets.
    POST: Creates a new project provisioned with reusable Notion phase checklists.
    """

    queryset = ConstructionProject.objects.all()
    serializer_class = ConstructionProjectSerializer
    filterset_class = ConstructionProjectFilterSet
    search_fields = [
        "code",
        "name",
        "project_manager",
        "site_address",
        "latest_update",
    ]
    ordering_fields = [
        "created_at",
        "updated_at",
        "code",
        "contract_budget",
        "progress_percent",
    ]
    entity_name = "Construction Project"


class ConstructionProjectDetailAPIView(BaseDetailAPIView):
    """
    GET:    Retrieve project details, PM assignment, and budget metrics.
    PUT:    Full update of project.
    PATCH:  Partial update (e.g. advance phase, update progress %, log site status).
    DELETE: Remove construction project.
    """

    queryset = ConstructionProject.objects.all()
    serializer_class = ConstructionProjectSerializer
    entity_name = "Construction Project"


# ==============================================================================
# 5. Project Tasks & Milestones (APIViews)
# ==============================================================================
class ProjectTaskListCreateAPIView(BaseListCreateAPIView):
    """
    GET:  Returns reusable 4-phase site checklist tasks and milestones.
    POST: Creates a task assigned to a project phase and manager.
    """

    queryset = ProjectTask.objects.select_related("project").all()
    serializer_class = ProjectTaskSerializer
    filterset_class = ProjectTaskFilterSet
    search_fields = [
        "title",
        "assigned_to",
        "progress_updates",
        "project__code",
        "project__name",
    ]
    ordering_fields = ["created_at", "updated_at", "deadline", "priority", "status"]
    entity_name = "Project Task"


class ProjectTaskDetailAPIView(BaseDetailAPIView):
    """
    GET:    Retrieve task status, deadline, and updates.
    PUT:    Full update of task.
    PATCH:  Partial update (e.g. mark Done, change priority).
    DELETE: Remove task.
    """

    queryset = ProjectTask.objects.select_related("project").all()
    serializer_class = ProjectTaskSerializer
    entity_name = "Project Task"


# ==============================================================================
# 6. Material Orders & Site Procurement (APIViews)
# ==============================================================================
class MaterialOrderListCreateAPIView(BaseListCreateAPIView):
    """
    GET:  Returns material orders and lead-time tracking.
    POST: Records a new procurement order linked to a project.
    """

    queryset = MaterialOrder.objects.select_related("project").all()
    serializer_class = MaterialOrderSerializer
    filterset_class = MaterialOrderFilterSet
    search_fields = [
        "item_name",
        "supplier",
        "order_reference",
        "received_by",
        "project__code",
    ]
    ordering_fields = [
        "created_at",
        "updated_at",
        "expected_delivery_date",
        "unit_cost_total",
    ]
    entity_name = "Material Order"


class MaterialOrderDetailAPIView(BaseDetailAPIView):
    """
    GET:    Retrieve material order details.
    PUT:    Full update of order.
    PATCH:  Partial update (e.g. mark Delivered, update actual delivery date).
    DELETE: Remove material order.
    """

    queryset = MaterialOrder.objects.select_related("project").all()
    serializer_class = MaterialOrderSerializer
    entity_name = "Material Order"


# ==============================================================================
# 7. Project Costs & Invoices (APIViews)
# ==============================================================================
class ProjectCostListCreateAPIView(BaseListCreateAPIView):
    """
    GET:  Returns project invoices, payment statuses, and clarification flags.
    POST: Ingests or creates an invoice record with duplicate protection.
    """

    queryset = ProjectCost.objects.select_related("project").all()
    serializer_class = ProjectCostSerializer
    filterset_class = ProjectCostFilterSet
    search_fields = [
        "title",
        "supplier",
        "document_reference",
        "clarification_notes",
        "source_email",
        "project__code",
        "project__name",
    ]
    ordering_fields = [
        "created_at",
        "updated_at",
        "amount",
        "invoice_date",
        "payment_due_date",
    ]
    entity_name = "Project Cost"


class ProjectCostDetailAPIView(BaseDetailAPIView):
    """
    GET:    Retrieve cost record and Notion sync link.
    PUT:    Full update of invoice cost.
    PATCH:  Partial update (e.g. mark Paid, resolve clarification notes).
    DELETE: Remove cost record.
    """

    queryset = ProjectCost.objects.select_related("project").all()
    serializer_class = ProjectCostSerializer
    entity_name = "Project Cost"


# ==============================================================================
# 8. Email Communication Logs (APIViews)
# ==============================================================================
class EmailCommunicationLogListCreateAPIView(BaseListCreateAPIView):
    """
    GET:  Returns audited inbound and outbound automation email logs.
    POST: Logs an email event or webhook dispatch.
    """

    queryset = EmailCommunicationLog.objects.select_related("related_cost").all()
    serializer_class = EmailCommunicationLogSerializer
    filterset_class = EmailCommunicationLogFilterSet
    search_fields = [
        "subject",
        "sender",
        "recipient",
        "body_preview",
        "attachment_name",
    ]
    ordering_fields = ["created_at", "updated_at", "direction", "status", "subject", "sender"]
    entity_name = "Email Log"


class EmailCommunicationLogDetailAPIView(BaseDetailAPIView):
    """
    GET:    Retrieve email log details and related cost reference.
    PUT:    Full update of log.
    PATCH:  Partial update of log status.
    DELETE: Remove email log.
    """

    queryset = EmailCommunicationLog.objects.select_related("related_cost").all()
    serializer_class = EmailCommunicationLogSerializer
    entity_name = "Email Log"


# ==============================================================================
# Backwards Compatibility Aliases (if referenced elsewhere)
# ==============================================================================
ContactViewSet = ContactListCreateAPIView
OpportunityViewSet = OpportunityListCreateAPIView
SalesActivityViewSet = SalesActivityListCreateAPIView
ConstructionProjectViewSet = ConstructionProjectListCreateAPIView
ProjectTaskViewSet = ProjectTaskListCreateAPIView
MaterialOrderViewSet = MaterialOrderListCreateAPIView
ProjectCostViewSet = ProjectCostListCreateAPIView
EmailCommunicationLogViewSet = EmailCommunicationLogListCreateAPIView


# ==============================================================================
# 9. Dashboard, Notion & Automation Services (Existing APIViews)
# ==============================================================================
class DashboardSummaryAPIView(APIView):
    """Returns real-time Executive Sales CRM, Project Management, Cost Automation, and Notion link metrics."""

    STAGE_PROBABILITIES = {
        Opportunity.Stage.NEW_ENQUIRY: (10, Decimal("0.10")),
        Opportunity.Stage.QUALIFICATION: (20, Decimal("0.20")),
        Opportunity.Stage.DESIGN_AGREEMENT: (50, Decimal("0.50")),
        Opportunity.Stage.CONSTRUCTION_AGREEMENT: (80, Decimal("0.80")),
        Opportunity.Stage.WON: (100, Decimal("1.00")),
        Opportunity.Stage.LOST: (0, Decimal("0.00")),
    }

    def get(self, request):
        provisioner = NotionProvisionerService()
        if Contact.objects.count() == 0:
            provisioner.seed_local_database()
        cfg = provisioner.get_or_create_config()

        active_opps = Opportunity.objects.exclude(stage=Opportunity.Stage.LOST)
        active_opps_count = active_opps.count()
        total_pipeline = (
            active_opps.aggregate(total=Sum("estimated_value"))["total"]
            or Decimal("0.00")
        )

        weighted_pipeline = Decimal("0.00")
        for opp in active_opps:
            _, prob_dec = self.STAGE_PROBABILITIES.get(opp.stage, (0, Decimal("0.00")))
            weighted_pipeline += (opp.estimated_value or Decimal("0.00")) * prob_dec

        avg_deal_size = (
            (total_pipeline / active_opps_count)
            if active_opps_count > 0
            else Decimal("0.00")
        )

        kevin_review_deals = Opportunity.objects.filter(requires_kevin_review=True).count()
        review_deals_list = [
            {
                "id": str(o.id),
                "name": o.name,
                "client_name": o.contact.name if o.contact else "Private Client",
                "client_phone": o.contact.phone if o.contact else "",
                "estimated_value": str(o.estimated_value),
                "stage": o.stage,
                "kevin_review_notes": o.kevin_review_notes or "Review required before agreement dispatch.",
                "next_follow_up_date": str(o.next_follow_up_date) if o.next_follow_up_date else None,
                "sales_owner": o.sales_owner,
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in Opportunity.objects.filter(requires_kevin_review=True).select_related("contact")
        ]

        stages_summary = list(
            Opportunity.objects.values("stage")
            .annotate(count=Count("id"), total_value=Sum("estimated_value"))
            .order_by("stage")
        )

        stages_breakdown = []
        for s in stages_summary:
            st_name = s["stage"]
            prob_int, prob_dec = self.STAGE_PROBABILITIES.get(st_name, (0, Decimal("0.00")))
            val = s["total_value"] or Decimal("0.00")
            weighted_val = val * prob_dec
            stages_breakdown.append({
                "stage": st_name,
                "count": s["count"],
                "total_value": str(val),
                "probability_percent": prob_int,
                "weighted_value": str(weighted_val),
            })

        projects_by_phase = list(
            ConstructionProject.objects.values("phase")
            .annotate(count=Count("id"), total_budget=Sum("contract_budget"))
            .order_by("phase")
        )

        paid_costs = (
            ProjectCost.objects.filter(payment_status=ProjectCost.PaymentStatus.PAID).aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )
        unpaid_costs = (
            ProjectCost.objects.filter(payment_status=ProjectCost.PaymentStatus.UNPAID).aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )
        flagged_costs_count = ProjectCost.objects.filter(needs_clarification=True).count()

        return api_response(
            data={
                "kpis": {
                    "total_pipeline_value": str(total_pipeline),
                    "weighted_pipeline_value": str(weighted_pipeline),
                    "average_deal_size": str(avg_deal_size),
                    "active_opportunities_count": active_opps_count,
                    "kevin_review_opportunities_count": kevin_review_deals,
                    "active_projects_count": ConstructionProject.objects.count(),
                    "open_tasks_count": ProjectTask.objects.exclude(
                        status=ProjectTask.TaskStatus.DONE
                    ).count(),
                    "delayed_materials_count": MaterialOrder.objects.filter(
                        status=MaterialOrder.OrderStatus.DELAYED
                    ).count(),
                    "paid_costs_total": str(paid_costs),
                    "unpaid_costs_total": str(unpaid_costs),
                    "flagged_costs_count": flagged_costs_count,
                    "total_costs_records": ProjectCost.objects.count(),
                    "email_notifications_count": EmailCommunicationLog.objects.count(),
                },
                "stages_breakdown": stages_breakdown,
                "projects_by_phase": [
                    {
                        "phase": p["phase"],
                        "count": p["count"],
                        "total_budget": str(p["total_budget"] or Decimal("0.00")),
                    }
                    for p in projects_by_phase
                ],
                "kevin_review_deals": review_deals_list,
                "notion_workspace": NotionWorkspaceConfigSerializer(cfg).data,
            },
            message="Executive dashboard summary retrieved successfully.",
            success=True,
        )


class NotionProvisionAPIView(APIView):
    """Triggers idempotent Notion workspace creation & bidirectional sync."""

    def post(self, request):
        service = NotionProvisionerService()
        cfg = service.provision_notion_workspace()
        return api_response(
            data=NotionWorkspaceConfigSerializer(cfg).data,
            message="Notion workspace provisioned and synchronized under Kevin's Construction OS.",
            success=True,
        )


class InvoiceExtractAPIView(APIView):
    """
    Assessment Extraction Endpoint (called by n8n workflow or direct upload):
    Extracts supplier, document_reference, invoice_date, amount, currency,
    payment_status, payment_due_date, and project_reference from email + PDF attachment.
    """

    def post(self, request):
        serializer = InvoiceExtractRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        extractor = InvoiceExtractorService()
        extracted = extractor.extract(
            email_subject=validated.get("email_subject", ""),
            email_sender=validated.get("email_sender", "billing@vendor.com"),
            email_body=validated.get("email_body", ""),
            attachment_base64=validated.get("attachment_base64", ""),
            llm_provider=validated.get("llm_provider", "auto"),
        )
        now_ts = timezone.now()
        extracted["extracted_at"] = now_ts.isoformat()
        return api_response(
            data=extracted,
            message=f"Invoice and receipt cost fields extracted successfully at {now_ts.strftime('%Y-%m-%d %H:%M:%S UTC')}.",
            success=True,
        )


class InvoiceProcessAPIView(APIView):
    """
    Idempotent Upsert & Notification Endpoint (called by n8n workflow):
    Links cost to Notion Construction Project, checks for duplicates or updates,
    flags unclear items, syncs to Notion, and sends built-in Django email alert.
    """

    def post(self, request):
        serializer = InvoiceProcessRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        processor = CostAutomationProcessor()
        result = processor.process_cost_submission(serializer.validated_data)
        cost_obj = result["cost"]
        now_ts = timezone.now()
        return api_response(
            data={
                "action": result["action"],
                "duplicate_prevented": result["duplicate_prevented"],
                "needs_clarification": result["needs_clarification"],
                "processed_at": now_ts.isoformat(),
                "cost": ProjectCostSerializer(cost_obj).data,
            },
            message=f"Invoice processed with action: {result['action']} at {now_ts.strftime('%Y-%m-%d %H:%M:%S UTC')}.",
            success=True,
            status_code=(
                status.HTTP_201_CREATED
                if result["action"] == "created_new"
                else status.HTTP_200_OK
            ),
        )


class AutomationSimulatorAPIView(APIView):
    """
    Live Demonstration & Test Bench Endpoint:
    Dispatches realistic vendor invoice emails + binary PDF attachments through n8n & Django,
    returning a complete execution trace.
    """

    SCENARIOS = {
        "1_unpaid_invoice": {
            "label": "Scenario 1: New Unpaid Subcontractor Invoice (With Due Date)",
            "email_sender": "billing@sierrahvac.com",
            "email_subject": "Invoice INV-2026-501 - Rough HVAC Ducting for PRJ-101 Oakridge Estate",
            "supplier": "Sierra HVAC & Mechanical",
            "document_reference": "INV-2026-501",
            "project_reference": "PRJ-101 Oakridge Estate",
            "amount": "18500.00",
            "currency": "USD",
            "payment_status": "Unpaid",
            "days_until_due": 14,
            "description": "Rough HVAC Ductwork & Zone Dampers Installation - Level 2",
        },
        "2_paid_receipt": {
            "label": "Scenario 2: New Paid Material Supplier Receipt",
            "email_sender": "receipts@cascademillwork.com",
            "email_subject": "PAID Receipt REC-2026-602 - Custom White Oak Cabinetry Deposit (PRJ-102)",
            "supplier": "Cascade Custom Millwork",
            "document_reference": "REC-2026-602",
            "project_reference": "PRJ-102 Harborview Villa",
            "amount": "14200.00",
            "currency": "USD",
            "payment_status": "Paid",
            "days_until_due": 0,
            "description": "Custom White Oak Kitchen & Butler Pantry Millwork Shop Deposit (PAID IN FULL)",
        },
        "3_duplicate_submission": {
            "label": "Scenario 3: Exact Duplicate Invoice Submission (Idempotency Check)",
            "email_sender": "billing@sierrahvac.com",
            "email_subject": "FWD: Invoice INV-2026-501 - Rough HVAC Ducting for PRJ-101 Oakridge Estate",
            "supplier": "Sierra HVAC & Mechanical",
            "document_reference": "INV-2026-501",
            "project_reference": "PRJ-101 Oakridge Estate",
            "amount": "18500.00",
            "currency": "USD",
            "payment_status": "Unpaid",
            "days_until_due": 14,
            "description": "Rough HVAC Ductwork & Zone Dampers Installation - Level 2 (Duplicate Email Resend)",
        },
        "4_status_update_paid": {
            "label": "Scenario 4: Subsequent Update (Unpaid -> Paid Receipt for INV-2026-501)",
            "email_sender": "billing@sierrahvac.com",
            "email_subject": "PAYMENT CONFIRMATION: Invoice INV-2026-501 Marked PAID (PRJ-101)",
            "supplier": "Sierra HVAC & Mechanical",
            "document_reference": "INV-2026-501",
            "project_reference": "PRJ-101 Oakridge Estate",
            "amount": "18500.00",
            "currency": "USD",
            "payment_status": "Paid",
            "days_until_due": 14,
            "description": "Payment Received in Full via ACH for Invoice INV-2026-501",
        },
        "5_flagged_clarification": {
            "label": "Scenario 5: Ambiguous / Unmatched Project Receipt (Flagged for Review)",
            "email_sender": "field@westcoastpumping.com",
            "email_subject": "Receipt INV-2026-999 - Emergency Concrete Line Pump Rental",
            "supplier": "WestCoast Concrete Pumping",
            "document_reference": "INV-2026-999",
            "project_reference": "Unknown Hillside Site",
            "amount": "8900.00",
            "currency": "USD",
            "payment_status": "Unpaid",
            "days_until_due": 7,
            "description": "Emergency saturday concrete boom pump service (No valid PRJ code on ticket)",
        },
        "6_field_employee_asif": {
            "label": "Scenario 6: Field Employee Asif Subcontractor Invoice (Potential Client)",
            "email_sender": "musfiq.works+asif@gmail.com",
            "email_subject": "Invoice INV-2026-ASIF-001 — Framing Rough-In for PRJ-101 (Client: musfiq.works+pc1@gmail.com)",
            "supplier": "Pacific Crest Framing & Steel",
            "document_reference": "INV-2026-ASIF-001",
            "project_reference": "PRJ-101 Oakridge Estate (Client: musfiq.works+pc1@gmail.com)",
            "amount": "27500.00",
            "currency": "USD",
            "payment_status": "Unpaid",
            "days_until_due": 14,
            "description": "Framing rough-in labor and materials submitted by field employee Asif",
            "notified_person": "musfiq.works+kevin@gmail.com",
        },
    }

    def post(self, request):
        scenario_key = request.data.get("scenario", "1_unpaid_invoice")
        custom_payload = request.data.get("custom")

        if scenario_key == "custom" and isinstance(custom_payload, dict):
            spec = {
                "label": custom_payload.get("label", "Custom Vendor Invoice Submission"),
                "email_sender": custom_payload.get("email_sender", "vendor@subcontractor.com"),
                "email_subject": custom_payload.get(
                    "email_subject",
                    f"Invoice {custom_payload.get('document_reference', 'INV-2026-777')}",
                ),
                "supplier": custom_payload.get("supplier", "Custom Subcontractor LLC"),
                "document_reference": custom_payload.get("document_reference", "INV-2026-777"),
                "project_reference": custom_payload.get("project_reference", "PRJ-101"),
                "amount": str(custom_payload.get("amount", "12500.00")),
                "currency": custom_payload.get("currency", "USD"),
                "payment_status": custom_payload.get("payment_status", "Unpaid"),
                "days_until_due": int(custom_payload.get("days_until_due", 14)),
                "description": custom_payload.get("description", "Custom construction cost submission"),
                "notified_person": custom_payload.get("notified_person", "musfiq.works+kevin@gmail.com"),
            }
        else:
            if scenario_key not in self.SCENARIOS:
                return api_response(
                    data={"available_scenarios": list(self.SCENARIOS.keys())},
                    message=f"Unknown scenario '{scenario_key}'.",
                    success=False,
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            spec = self.SCENARIOS[scenario_key]

        inv_date = date.today().isoformat()
        due_date = (
            (date.today() + timedelta(days=spec["days_until_due"])).isoformat()
            if spec["days_until_due"] > 0
            else inv_date
        )

        # 1. Generate genuine PDF invoice binary
        pdf_bytes = generate_sample_invoice_pdf(
            supplier=spec["supplier"],
            document_reference=spec["document_reference"],
            project_reference=spec["project_reference"],
            amount=spec["amount"],
            currency=spec["currency"],
            payment_status=spec["payment_status"],
            invoice_date=inv_date,
            payment_due_date=due_date,
            description=spec["description"],
        )
        pdf_b64 = base64.b64encode(pdf_bytes).decode("ascii")
        filename = f"{spec['document_reference']}.pdf"

        # 2. Record Inbound Email in EmailCommunicationLog
        inbound_log = EmailCommunicationLog.objects.create(
            subject=spec["email_subject"],
            sender=spec["email_sender"],
            recipient="invoices@kevinconstruction.com",
            direction="Inbound Invoice",
            status="Received",
            body_preview=(
                f"Attached PDF invoice {filename} from {spec['supplier']} for "
                f"{spec['project_reference']} (${spec['amount']} {spec['currency']}, {spec['payment_status']})."
            ),
            attachment_name=filename,
        )

        # 3. Trigger live n8n Webhook if running; otherwise fall back to direct processor
        n8n_triggered = False
        n8n_result_data = None
        n8n_webhook_url = getattr(settings, "N8N_WEBHOOK_URL", "")
        webhook_payload = {
            "email_subject": spec["email_subject"],
            "email_sender": spec["email_sender"],
            "email_body": inbound_log.body_preview,
            "attachment_base64": pdf_b64,
            "attachment_filename": filename,
        }
        if n8n_webhook_url:
            try:
                with httpx.Client(timeout=20.0) as client:
                    r = client.post(n8n_webhook_url, json=webhook_payload)
                    if r.status_code < 400:
                        body_json = r.json()
                        if isinstance(body_json, list) and body_json:
                            body_json = body_json[0]
                        if isinstance(body_json, dict) and "cost" in body_json and body_json["cost"]:
                            n8n_triggered = True
                            n8n_result_data = body_json
            except Exception:
                n8n_triggered = False

        extractor = InvoiceExtractorService()
        extracted = extractor.extract(
            email_subject=spec["email_subject"],
            email_sender=spec["email_sender"],
            email_body=inbound_log.body_preview,
            attachment_base64=pdf_b64,
        )
        if spec.get("notified_person"):
            extracted["notified_person"] = spec["notified_person"]

        if n8n_triggered and n8n_result_data:
            cost_dict = n8n_result_data["cost"]
            cost_obj = ProjectCost.objects.filter(id=cost_dict["id"]).first()
            action_taken = n8n_result_data.get("action_taken", "created_new")
            duplicate_prevented = bool(n8n_result_data.get("duplicate_prevented", action_taken != "created_new"))
            needs_clarification = bool(cost_dict.get("needs_clarification", False))
        else:
            processor = CostAutomationProcessor()
            result = processor.process_cost_submission(extracted)
            cost_obj = result["cost"]
            action_taken = result["action"]
            duplicate_prevented = result["duplicate_prevented"]
            needs_clarification = result["needs_clarification"]

        if cost_obj:
            inbound_log.related_cost = cost_obj
            inbound_log.save(update_fields=["related_cost"])

        now_ts = timezone.now()
        return api_response(
            data={
                "scenario": scenario_key,
                "scenario_label": spec["label"],
                "n8n_webhook_triggered": n8n_triggered,
                "extracted_fields": extracted,
                "action_taken": action_taken,
                "duplicate_prevented": duplicate_prevented,
                "needs_clarification": needs_clarification,
                "event_timestamp": now_ts.isoformat(),
                "triggered_at": now_ts.isoformat(),
                "cost_record": ProjectCostSerializer(cost_obj).data if cost_obj else cost_dict,
            },
            message=f"{spec['label']} -> {action_taken} ({now_ts.strftime('%Y-%m-%d %H:%M:%S UTC')})",
            success=True,
        )


class SampleInvoicePDFAPIView(APIView):
    """Serves a dynamically generated PDF invoice/receipt for any document reference."""

    def get(self, request, doc_ref: str):
        cost = ProjectCost.objects.select_related("project").filter(
            document_reference__iexact=doc_ref
        ).first()
        if cost:
            gen_dt = None
            if getattr(cost, "event_timestamp", None):
                gen_dt = cost.event_timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
            elif getattr(cost, "created_at", None):
                gen_dt = cost.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")

            pdf_bytes = generate_sample_invoice_pdf(
                supplier=cost.supplier,
                document_reference=cost.document_reference,
                project_reference=(
                    f"{cost.project.code} - {cost.project.name}"
                    if cost.project
                    else "Unmatched Project"
                ),
                amount=cost.amount,
                currency=cost.currency,
                payment_status=cost.payment_status,
                invoice_date=(
                    cost.invoice_date.isoformat()
                    if hasattr(cost.invoice_date, "isoformat")
                    else str(cost.invoice_date) if cost.invoice_date else None
                ),
                payment_due_date=(
                    cost.payment_due_date.isoformat()
                    if hasattr(cost.payment_due_date, "isoformat")
                    else str(cost.payment_due_date) if cost.payment_due_date else None
                ),
                description=cost.title,
                generated_datetime=gen_dt,
            )
        else:
            pdf_bytes = generate_sample_invoice_pdf(
                supplier="Sample Construction Vendor",
                document_reference=doc_ref,
                project_reference="PRJ-101 Oakridge Estate",
                amount="15000.00",
                currency="USD",
                payment_status="Unpaid",
            )
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="{doc_ref}.pdf"'
        return response


class BlueprintDownloadAPIView(APIView):
    """Generates and serves executive solution blueprints (.docx, .pdf, .png)."""

    def get(self, request, filetype: str):
        paths: dict[str, str] = {}
        candidate_dirs = [
            Path("/docs"),
            Path(settings.BASE_DIR).parent / "docs",
            Path(settings.BASE_DIR) / "docs",
        ]
        found_dir = None
        for d in candidate_dirs:
            if d.exists() and (
                (d / "Part1_Pain_Points_and_Proposed_Solutions.pdf").exists()
                or (d / "Executive_Architecture_and_Solutions.pdf").exists()
            ):
                found_dir = d
                break

        if found_dir:
            pdf_path = (
                found_dir / "Part1_Pain_Points_and_Proposed_Solutions.pdf"
                if (found_dir / "Part1_Pain_Points_and_Proposed_Solutions.pdf").exists()
                else found_dir / "Executive_Architecture_and_Solutions.pdf"
            )
            docx_path = (
                found_dir / "Part1_Pain_Points_and_Proposed_Solutions.docx"
                if (found_dir / "Part1_Pain_Points_and_Proposed_Solutions.docx").exists()
                else found_dir / "Executive_Architecture_and_Solutions.docx"
            )
            diagram_path = (
                found_dir / "Workflow_Architecture_Diagram.png"
                if (found_dir / "Workflow_Architecture_Diagram.png").exists()
                else found_dir / "workflow_diagram.png"
            )
            paths = {
                "docx": str(docx_path),
                "pdf": str(pdf_path),
                "diagram": str(diagram_path),
            }
        else:
            try:
                from scripts.generate_submission_docs import main as generate_docs
                paths = generate_docs()
            except Exception as e:
                logger.error("Failed to generate submission docs: %s", e)

        mapping = {
            "docx": (
                paths.get("docx", ""),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Executive_Architecture_and_Solutions.docx",
            ),
            "pdf": (
                paths.get("pdf", ""),
                "application/pdf",
                "Executive_Architecture_and_Solutions.pdf",
            ),
            "diagram": (
                paths.get("diagram", ""),
                "image/png",
                "Workflow_Architecture_Diagram.png",
            ),
        }
        if filetype not in mapping or not paths.get(filetype) or not Path(paths[filetype]).exists():
            return api_response(
                data={"allowed": list(mapping.keys())},
                message=f"Document file for '{filetype}' is not available.",
                success=False,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        file_path, content_type, download_name = mapping[filetype]
        return FileResponse(
            open(file_path, "rb"),
            content_type=content_type,
            as_attachment=(filetype != "diagram"),
            filename=download_name,
        )


class SMTPSettingsAPIView(APIView):
    """Retrieves and updates active SMTP email credentials."""

    def get(self, request):
        cfg = SMTPSettings.get_active()
        return api_response(
            data=SMTPSettingsSerializer(cfg).data,
            message="Active SMTP email settings retrieved successfully.",
            success=True,
        )

    def post(self, request):
        cfg = SMTPSettings.get_active()
        serializer = SMTPSettingsSerializer(cfg, data=request.data, partial=True)
        if serializer.is_valid():
            saved = serializer.save()
            return api_response(
                data=SMTPSettingsSerializer(saved).data,
                message="SMTP email configuration updated successfully.",
                success=True,
            )
        return api_response(
            data={"errors": serializer.errors},
            message="Invalid SMTP configuration provided.",
            success=False,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class SMTPTestConnectionAPIView(APIView):
    """Sends a live test verification email over SMTP."""

    def post(self, request):
        serializer = SMTPTestConnectionSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                data={"errors": serializer.errors},
                message="Invalid test email parameters.",
                success=False,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        cfg = SMTPSettings.get_active()
        recipient = (
            serializer.validated_data.get("recipient")
            or getattr(settings, "NOTIFICATION_RECIPIENT_EMAIL", "")
            or cfg.kevin_email
            or cfg.username
            or "ops-automation@crm.musfiqdehan.com"
        )
        subject = serializer.validated_data.get(
            "subject", "Kevin Construction OS — Live SMTP Verification"
        )
        body = serializer.validated_data.get("body", "")

        from_email = cfg.default_from_email or cfg.username

        from common.email_backend import AuditedEmailBackend
        from django.core.mail import EmailMessage

        msg = EmailMessage(
            subject=subject,
            body=(
                f"{body}\n\n"
                f"--- Connection Details ---\n"
                f"SMTP Host: {cfg.host}:{cfg.port}\n"
                f"Auth User: {cfg.username}\n"
                f"SSL: {cfg.use_ssl} | TLS: {cfg.use_tls}\n"
                f"Timestamp: {timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')}\n"
            ),
            from_email=from_email,
            to=[recipient],
            headers={
                "X-Direction": "SMTP Test",
            },
        )

        sent_count = AuditedEmailBackend().send_messages([msg])
        last_log = EmailCommunicationLog.objects.filter(recipient=recipient).order_by("-created_at").first()

        if last_log and "Sent" in last_log.status:
            return api_response(
                data={
                    "recipient": recipient,
                    "status": last_log.status,
                    "smtp_host": f"{cfg.host}:{cfg.port}",
                    "log_id": str(last_log.id),
                    "created_at": last_log.created_at.isoformat(),
                },
                message=f"Live test email successfully delivered to {recipient} via {cfg.host}:{cfg.port}.",
                success=True,
            )
        else:
            return api_response(
                data={
                    "recipient": recipient,
                    "status": last_log.status if last_log else "Failed",
                    "smtp_host": f"{cfg.host}:{cfg.port}",
                },
                message=f"SMTP transmission completed with status: {last_log.status if last_log else 'Error'}.",
                success=False,
                status_code=status.HTTP_502_BAD_GATEWAY,
            )


class ClientEmailTriggerAPIView(APIView):
    """Triggers realistic customer & client email automations per Part 3 assessment."""

    TEMPLATES = {
        "milestone_update": {
            "subject": "Build Milestone Completed: {project_code} Structural Framing Approved",
            "body": (
                "Dear {client_name},\n\n"
                "We are thrilled to share that the Phase 2 framing inspection for {project_code} "
                "has officially passed city engineering inspection today.\n\n"
                "Next milestone scheduled: Rough-in MEP (Mechanical, Electrical, Plumbing) & HVAC installation.\n\n"
                "You can view live site photo updates and cost approvals in your Kevin Construction client hub.\n\n"
                "Best regards,\nKevin & The Project Management Team\nKevin's Construction OS"
            ),
        },
        "design_agreement": {
            "subject": "Design & Pre-Construction Agreement Ready: {project_code}",
            "body": (
                "Dear {client_name},\n\n"
                "Your pre-construction geotechnical and architectural package for {project_code} "
                "is now ready for final sign-off.\n\n"
                "Founder Kevin has reviewed the structural retaining scope and confirmed margin allocations.\n\n"
                "Please review the attached scope summary or access your client portal.\n\n"
                "Warm regards,\nJordan Blake (Sales Lead) & Kevin\nKevin's Construction OS"
            ),
        },
        "invoice_notice": {
            "subject": "Progress Billing Notice: Subcontractor Milestone for {project_code}",
            "body": (
                "Dear {client_name},\n\n"
                "This is an automated notification that progress billing for {project_code} "
                "has been verified against site milestone completion and recorded into your construction ledger.\n\n"
                "Vendor: Sierra HVAC & Mechanical\n"
                "Status: Unpaid (Due within 14 days)\n"
                "Deduplication & Margin Check: Cleared (Zero Double-Count Guarantee)\n\n"
                "Thank you for your partnership,\nKevin's Construction OS Accounting"
            ),
        },
        "review_alert": {
            "subject": "[ACTION REQUIRED] Founder Scope Review Required: {project_code}",
            "body": (
                "Attention Kevin,\n\n"
                "A client scope request or invoice for {project_code} ({client_name}) requires founder review "
                "before agreement execution or payment dispatch.\n\n"
                "Please review in your Founder Cockpit review queue.\n\n"
                "Automated System Alert — Kevin's Construction OS"
            ),
        },
    }

    def post(self, request):
        serializer = ClientEmailTriggerSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                data={"errors": serializer.errors},
                message="Invalid client email trigger parameters.",
                success=False,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        client_email = serializer.validated_data["client_email"]
        client_name = serializer.validated_data["client_name"]
        project_code = serializer.validated_data["project_code"]
        email_type = serializer.validated_data["email_type"]
        custom_subj = serializer.validated_data.get("subject")
        custom_msg = serializer.validated_data.get("message")

        tpl = self.TEMPLATES.get(email_type, self.TEMPLATES["milestone_update"])
        subject = custom_subj or tpl["subject"].format(
            client_name=client_name, project_code=project_code
        )
        body = custom_msg or tpl["body"].format(
            client_name=client_name, project_code=project_code
        )

        cfg = SMTPSettings.get_active()
        from_email = cfg.default_from_email or cfg.username

        from common.email_backend import AuditedEmailBackend
        from django.core.mail import EmailMessage

        msg = EmailMessage(
            subject=subject,
            body=body,
            from_email=from_email,
            to=[client_email],
            headers={
                "X-Direction": "Client Outbound" if email_type != "review_alert" else "Founder Review Alert",
            },
        )
        AuditedEmailBackend().send_messages([msg])
        last_log = EmailCommunicationLog.objects.filter(recipient=client_email).order_by("-created_at").first()

        now_ts = timezone.now()
        return api_response(
            data={
                "email_type": email_type,
                "client_email": client_email,
                "client_name": client_name,
                "project_code": project_code,
                "status": last_log.status if last_log else "Sent",
                "triggered_at": now_ts.isoformat(),
                "log_id": str(last_log.id) if last_log else None,
            },
            message=f"Client automation email ({email_type}) sent to {client_email} via {cfg.host}:{cfg.port}.",
            success=True,
        )


# ==============================================================================
# 16. Authentication & Dynamic OAuth Configuration Endpoints
# ==============================================================================
from django.contrib.auth import authenticate, get_user_model
from common.tenancy import Organization, OrganizationMember, PlatformSettings, Invitation
from common.permissions import IsPlatformSuperAdmin, IsOrganizationOwnerOrAdmin, FeatureFlagPermission
from crm.services.auth_service import JWTService, GoogleOAuthService
from crm.services.traefik_sync import sync_traefik_custom_domains
from crm.serializers import (
    PlatformSettingsSerializer,
    OrganizationSerializer,
    OrganizationMemberSerializer,
    InvitationSerializer,
    GoogleAuthRequestSerializer,
    LoginRequestSerializer,
    RegisterRequestSerializer,
)

User = get_user_model()


class OAuthPublicConfigAPIView(APIView):
    """
    Returns public branding and dynamically resolved Google OAuth Client ID for the active tenant.
    If the active tenant has enabled its own custom Google OAuth, returns the client's OAuth Client ID.
    Otherwise, returns the platform superadmin's global Google OAuth Client ID.
    """

    def get(self, request, *args, **kwargs):
        tenant = getattr(request, "tenant", None)
        creds = GoogleOAuthService.resolve_credentials(tenant)
        platform = PlatformSettings.get_settings()

        tenant_data = None
        if tenant:
            tenant_data = {
                "id": str(tenant.id),
                "name": tenant.name,
                "slug": tenant.slug,
                "subdomain_host": tenant.subdomain_host,
                "custom_domain": tenant.custom_domain,
                "custom_domain_verified": tenant.custom_domain_verified,
                "is_active": tenant.is_active,
                "currency": tenant.currency,
                "feature_flags": tenant.get_feature_flags(),
                "logo_url": tenant.logo_url,
                "primary_color": tenant.primary_color,
            }

        return api_response(
            data={
                "platform_name": platform.platform_name,
                "base_domain": platform.base_domain,
                "tenant": tenant_data,
                "google_oauth": {
                    "enabled": bool(creds.get("client_id")),
                    "client_id": creds.get("client_id", ""),
                    "source": creds.get("source", "platform"),
                    "brand_name": creds.get("organization_name") or platform.platform_name,
                },
            },
            message="Dynamic OAuth configuration retrieved successfully.",
            success=True,
        )


class LoginAPIView(APIView):
    """
    Authenticates user via email/username and password.
    Returns HS256 JWT access and refresh tokens embedding user and tenant role.
    """

    def post(self, request, *args, **kwargs):
        serializer = LoginRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        login_id = serializer.validated_data["username_or_email"].strip()
        password = serializer.validated_data["password"]

        user = User.objects.filter(email__iexact=login_id).first() or User.objects.filter(username__iexact=login_id).first()
        if not user or not user.check_password(password):
            return api_response(
                message="Invalid email/username or password.",
                success=False,
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return api_response(
                message="User account is deactivated.",
                success=False,
                status_code=status.HTTP_403_FORBIDDEN,
            )

        tenant = getattr(request, "tenant", None)
        role = "Client"
        if user.is_superuser:
            role = "Superadmin"
        elif tenant:
            membership = OrganizationMember.objects.filter(organization=tenant, user=user, is_active=True).first()
            if membership:
                role = membership.role

        tokens = JWTService.generate_token_pair(user, tenant, role=role)
        return api_response(
            data={
                "tokens": tokens,
                "user": {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_superuser": bool(user.is_superuser),
                },
                "organization": {
                    "id": str(tenant.id) if tenant else None,
                    "name": tenant.name if tenant else None,
                    "slug": tenant.slug if tenant else None,
                } if tenant else None,
                "role": role,
            },
            message="Login successful.",
            success=True,
        )


class RegisterAPIView(APIView):
    """
    Public registration endpoint.
    Creates a new user account and provisions a new tenant organization workspace (Owner)
    or links to the active tenant as a member.
    Returns HS256 JWT tokens and user profile.
    """

    def post(self, request, *args, **kwargs):
        from django.utils.text import slugify

        serializer = RegisterRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower().strip()
        password = serializer.validated_data["password"]
        full_name = serializer.validated_data.get("full_name", "").strip()
        username = serializer.validated_data.get("username", "").strip()
        org_name = serializer.validated_data.get("organization_name", "").strip()
        org_slug = serializer.validated_data.get("organization_slug", "").strip()

        # Check existing user
        user = User.objects.filter(email__iexact=email).first()
        if user:
            if not user.check_password(password):
                return api_response(
                    message="An account with this email already exists. Please sign in with your password.",
                    success=False,
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
        else:
            uname = username or email.split("@")[0]
            if User.objects.filter(username__iexact=uname).exists():
                uname = f"{uname}_{secrets.token_hex(2)}"
            parts = full_name.split(" ", 1)
            first_name = parts[0] if parts else ""
            last_name = parts[1] if len(parts) > 1 else ""
            user = User.objects.create_user(
                username=uname,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
            )

        plat_settings = PlatformSettings.get_settings()
        base_domain = plat_settings.base_domain or "beamline.musfiqdehan.com"

        tenant = getattr(request, "tenant", None)
        target_org = None
        role = OrganizationMember.Role.OWNER

        if org_name:
            slug = org_slug.lower() if org_slug else slugify(org_name)
            if not slug:
                slug = f"org-{secrets.token_hex(3)}"
            base_slug = slug
            counter = 1
            while Organization.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            target_org = Organization.objects.create(
                name=org_name,
                slug=slug,
                executive_recipient_email=email,
                is_active=True,
            )
            OrganizationMember.objects.create(
                organization=target_org,
                user=user,
                role=OrganizationMember.Role.OWNER,
                is_active=True,
            )
        elif tenant and tenant.slug != "kevin":
            target_org = tenant
            role = OrganizationMember.Role.CLIENT
            OrganizationMember.objects.get_or_create(
                organization=target_org,
                user=user,
                defaults={"role": role, "is_active": True},
            )
        else:
            default_name = f"{user.first_name or user.username.capitalize()}'s Builds"
            slug = slugify(user.username) or f"ws-{secrets.token_hex(3)}"
            base_slug = slug
            counter = 1
            while Organization.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            target_org = Organization.objects.create(
                name=default_name,
                slug=slug,
                executive_recipient_email=email,
                is_active=True,
            )
            OrganizationMember.objects.create(
                organization=target_org,
                user=user,
                role=OrganizationMember.Role.OWNER,
                is_active=True,
            )

        tokens = JWTService.generate_token_pair(user, target_org, role=role)
        return api_response(
            data={
                "tokens": tokens,
                "user": {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_superuser": bool(user.is_superuser),
                },
                "organization": {
                    "id": str(target_org.id) if target_org else None,
                    "name": target_org.name if target_org else None,
                    "slug": target_org.slug if target_org else None,
                    "subdomain_host": target_org.subdomain_host if target_org else None,
                } if target_org else None,
                "role": role,
            },
            message="Registration and workspace creation successful.",
            success=True,
            status_code=status.HTTP_201_CREATED,
        )


class GoogleOAuthAPIView(APIView):
    """
    Verifies Google ID token against active tenant's or platform's credentials.
    Supports invitation acceptance linking and automatic user provisioning.
    """

    def post(self, request, *args, **kwargs):
        serializer = GoogleAuthRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        id_token = serializer.validated_data["id_token"]
        invitation_token = serializer.validated_data.get("invitation_token", "").strip()

        tenant = getattr(request, "tenant", None)
        try:
            google_profile = GoogleOAuthService.verify_token(id_token, organization=tenant)
        except Exception as exc:
            return api_response(
                message=str(exc),
                success=False,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        email = google_profile["email"].lower()
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            base_username = email.split("@")[0].replace("+", "_")
            candidate = base_username
            idx = 1
            while User.objects.filter(username=candidate).exists():
                candidate = f"{base_username}_{idx}"
                idx += 1
            name_parts = google_profile.get("name", "").split(" ", 1)
            first_name = name_parts[0] if name_parts else ""
            last_name = name_parts[1] if len(name_parts) > 1 else ""
            user = User.objects.create_user(
                username=candidate,
                email=email,
                first_name=first_name,
                last_name=last_name,
            )

        role = "Client"
        if user.is_superuser:
            role = "Superadmin"

        # Handle invitation token if provided
        if invitation_token:
            invitation = Invitation.objects.filter(token=invitation_token, status=Invitation.Status.PENDING).first()
            if invitation and not invitation.is_expired:
                invitation.status = Invitation.Status.ACCEPTED
                invitation.save()
                if invitation.organization:
                    tenant = invitation.organization
                    role = invitation.role
                    OrganizationMember.objects.update_or_create(
                        organization=tenant,
                        user=user,
                        defaults={"role": role, "is_active": True},
                    )

        if not user.is_superuser and tenant:
            membership = OrganizationMember.objects.filter(organization=tenant, user=user, is_active=True).first()
            if membership:
                role = membership.role
            else:
                # If tenant has no members yet, make first user Owner
                if not OrganizationMember.objects.filter(organization=tenant).exists():
                    role = OrganizationMember.Role.OWNER
                    OrganizationMember.objects.create(organization=tenant, user=user, role=role, is_active=True)

        tokens = JWTService.generate_token_pair(user, tenant, role=role)
        return api_response(
            data={
                "tokens": tokens,
                "user": {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_superuser": bool(user.is_superuser),
                },
                "organization": {
                    "id": str(tenant.id) if tenant else None,
                    "name": tenant.name if tenant else None,
                    "slug": tenant.slug if tenant else None,
                } if tenant else None,
                "role": role,
            },
            message=f"Google authentication successful as {email}.",
            success=True,
        )


class MeAPIView(APIView):
    """Returns profile of currently authenticated user, active tenant memberships, and feature flags."""

    def get(self, request, *args, **kwargs):
        user = request.user
        if not user or not user.is_authenticated:
            return api_response(
                data={"is_authenticated": False},
                message="Unauthenticated.",
                success=True,
            )

        tenant = getattr(request, "tenant", None)
        memberships = OrganizationMember.objects.filter(user=user, is_active=True).select_related("organization")
        active_role = "Client"
        if user.is_superuser:
            active_role = "Superadmin"
        elif tenant:
            m = memberships.filter(organization=tenant).first()
            if m:
                active_role = m.role

        org_list = [
            {
                "id": str(m.organization.id),
                "name": m.organization.name,
                "slug": m.organization.slug,
                "subdomain_host": m.organization.subdomain_host,
                "custom_domain": m.organization.custom_domain,
                "role": m.role,
                "is_active": m.organization.is_active,
            }
            for m in memberships
        ]

        return api_response(
            data={
                "is_authenticated": True,
                "user": {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_superuser": bool(user.is_superuser),
                },
                "active_organization": {
                    "id": str(tenant.id) if tenant else None,
                    "name": tenant.name if tenant else None,
                    "slug": tenant.slug if tenant else None,
                    "subdomain_host": tenant.subdomain_host if tenant else None,
                    "custom_domain": tenant.custom_domain if tenant else None,
                    "currency": tenant.currency if tenant else "USD",
                    "feature_flags": tenant.get_feature_flags() if tenant else {},
                    "is_active": tenant.is_active if tenant else True,
                } if tenant else None,
                "active_role": active_role,
                "organizations": org_list,
            },
            message="Current user profile retrieved successfully.",
            success=True,
        )


# ==============================================================================
# 17. Platform Superadmin Control Plane (APIViews)
# ==============================================================================
class PlatformSettingsAPIView(APIView):
    """
    Platform Superadmin endpoint to view and update platform Google OAuth and global settings.
    """

    permission_classes = [IsPlatformSuperAdmin]

    def get(self, request, *args, **kwargs):
        platform = PlatformSettings.get_settings()
        serializer = PlatformSettingsSerializer(platform)
        return api_response(
            data=serializer.data,
            message="Platform settings retrieved successfully.",
            success=True,
        )

    def patch(self, request, *args, **kwargs):
        platform = PlatformSettings.get_settings()
        serializer = PlatformSettingsSerializer(platform, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_response(
            data=serializer.data,
            message="Platform settings updated successfully.",
            success=True,
        )


class SuperadminOrganizationListCreateAPIView(APIView):
    """
    Platform Superadmin directory of all client organizations.
    Allows listing all tenants and provisioning new client tenants.
    """

    permission_classes = [IsPlatformSuperAdmin]

    def get(self, request, *args, **kwargs):
        orgs = Organization.objects.all().order_by("-created_at")
        serializer = OrganizationSerializer(orgs, many=True)
        return api_response(
            data={"results": serializer.data, "count": orgs.count()},
            message="All client organizations retrieved successfully.",
            success=True,
        )

    def post(self, request, *args, **kwargs):
        serializer = OrganizationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        org = serializer.save()
        sync_traefik_custom_domains()
        return api_response(
            data=OrganizationSerializer(org).data,
            message=f"Client organization '{org.name}' provisioned successfully.",
            success=True,
            status_code=status.HTTP_201_CREATED,
        )


class SuperadminOrganizationDetailAPIView(APIView):
    """
    Platform Superadmin control to:
    - Enable / Disable any client (is_active)
    - Enable / Disable any page, feature, or sub-feature (feature_flags)
    - Update domain or dynamic review thresholds
    """

    permission_classes = [IsPlatformSuperAdmin]

    def get(self, request, pk: str, *args, **kwargs):
        org = Organization.objects.filter(id=pk).first()
        if not org:
            return api_response(message="Organization not found.", success=False, status_code=status.HTTP_404_NOT_FOUND)
        return api_response(data=OrganizationSerializer(org).data, success=True)

    def patch(self, request, pk: str, *args, **kwargs):
        org = Organization.objects.filter(id=pk).first()
        if not org:
            return api_response(message="Organization not found.", success=False, status_code=status.HTTP_404_NOT_FOUND)

        # Handle nested feature_flags partial patch merge
        data = request.data.copy()
        if "feature_flags" in data and isinstance(data["feature_flags"], dict):
            current_flags = org.get_feature_flags()
            current_flags.update(data["feature_flags"])
            data["feature_flags"] = current_flags

        serializer = OrganizationSerializer(org, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_org = serializer.save()
        return api_response(
            data=OrganizationSerializer(updated_org).data,
            message=f"Organization '{updated_org.name}' updated successfully.",
            success=True,
        )

    def delete(self, request, pk: str, *args, **kwargs):
        org = Organization.objects.filter(id=pk).first()
        if not org:
            return api_response(message="Organization not found.", success=False, status_code=status.HTTP_404_NOT_FOUND)
        name = org.name
        org.delete()
        sync_traefik_custom_domains()
        return api_response(message=f"Organization '{name}' deleted successfully.", success=True)


class SuperadminInvitationAPIView(APIView):
    """
    Superadmin invites a new Client Owner to onboard their organization.
    """

    permission_classes = [IsPlatformSuperAdmin]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email", "").strip().lower()
        invited_name = request.data.get("invited_name", "").strip()
        org_name = request.data.get("organization_name", "").strip()
        org_slug = request.data.get("organization_slug", "").strip().lower()

        if not email:
            return api_response(message="Email is required.", success=False, status_code=status.HTTP_400_BAD_REQUEST)
        if not org_slug:
            org_slug = email.split("@")[0].replace(".", "-")

        # Provision organization if not already exists
        org = Organization.objects.filter(slug=org_slug).first()
        if not org:
            org = Organization.objects.create(
                name=org_name or f"{invited_name or org_slug.title()}'s Organization",
                slug=org_slug,
                is_active=True,
            )

        token = Invitation.generate_token()
        invitation = Invitation.objects.create(
            invitation_type=Invitation.InvitationType.CLIENT_ONBOARDING,
            email=email,
            invited_name=invited_name,
            organization=org,
            role=OrganizationMember.Role.OWNER,
            token=token,
            invited_by=request.user,
            expires_at=timezone.now() + timedelta(days=14),
        )

        invite_url = f"https://{org.subdomain_host}/invite?token={token}"
        return api_response(
            data={
                "invitation": InvitationSerializer(invitation).data,
                "invite_url": invite_url,
            },
            message=f"Client onboarding invitation generated for {email}.",
            success=True,
            status_code=status.HTTP_201_CREATED,
        )


# ==============================================================================
# 18. Client Tenant Settings & Team Member Management (APIViews)
# ==============================================================================
class TenantSettingsAPIView(APIView):
    """
    Client Owner/Admin updates their organization's custom domain, review thresholds,
    and client Google OAuth Client ID & Secret.
    """

    permission_classes = [IsOrganizationOwnerOrAdmin]

    def get(self, request, *args, **kwargs):
        tenant = request.tenant
        if not tenant:
            return api_response(message="No active organization tenant.", success=False, status_code=status.HTTP_400_BAD_REQUEST)
        serializer = OrganizationSerializer(tenant)
        return api_response(data=serializer.data, success=True)

    def patch(self, request, *args, **kwargs):
        tenant = request.tenant
        if not tenant:
            return api_response(message="No active organization tenant.", success=False, status_code=status.HTTP_400_BAD_REQUEST)

        # Allow updating custom domain, thresholds, client google oauth, currency, logo
        allowed_fields = [
            "name",
            "custom_domain",
            "deal_review_threshold",
            "invoice_review_threshold",
            "executive_recipient_email",
            "use_custom_google_oauth",
            "google_oauth_client_id",
            "google_oauth_client_secret",
            "currency",
            "logo_url",
            "primary_color",
        ]
        patch_data = {k: v for k, v in request.data.items() if k in allowed_fields}
        serializer = OrganizationSerializer(tenant, data=patch_data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return api_response(
            data=OrganizationSerializer(updated).data,
            message="Client organization settings updated successfully.",
            success=True,
        )


class TenantMemberListCreateAPIView(APIView):
    """
    Lists active members of the tenant or invites a new member.
    """

    permission_classes = [IsOrganizationOwnerOrAdmin]

    def get(self, request, *args, **kwargs):
        tenant = request.tenant
        members = OrganizationMember.objects.filter(organization=tenant).select_related("user")
        serializer = OrganizationMemberSerializer(members, many=True)
        return api_response(data={"results": serializer.data, "count": members.count()}, success=True)

    def post(self, request, *args, **kwargs):
        tenant = request.tenant
        email = request.data.get("email", "").strip().lower()
        role = request.data.get("role", OrganizationMember.Role.PM)
        invited_name = request.data.get("invited_name", "").strip()

        if not email:
            return api_response(message="Email is required.", success=False, status_code=status.HTTP_400_BAD_REQUEST)

        token = Invitation.generate_token()
        invitation = Invitation.objects.create(
            invitation_type=Invitation.InvitationType.TEAM_MEMBER,
            email=email,
            invited_name=invited_name,
            organization=tenant,
            role=role,
            token=token,
            invited_by=request.user,
            expires_at=timezone.now() + timedelta(days=7),
        )
        return api_response(
            data=InvitationSerializer(invitation).data,
            message=f"Team member invitation sent to {email}.",
            success=True,
            status_code=status.HTTP_201_CREATED,
        )


class AcceptInvitationAPIView(APIView):
    """
    Public endpoint to view invitation details and accept an invitation.
    """

    def get(self, request, *args, **kwargs):
        token = request.GET.get("token", "").strip()
        if not token:
            return api_response(message="Token is required.", success=False, status_code=status.HTTP_400_BAD_REQUEST)

        invitation = Invitation.objects.filter(token=token).first()
        if not invitation:
            return api_response(message="Invitation not found.", success=False, status_code=status.HTTP_404_NOT_FOUND)

        if invitation.status != Invitation.Status.PENDING:
            return api_response(message=f"Invitation has already been {invitation.status.lower()}.", success=False, status_code=status.HTTP_400_BAD_REQUEST)

        if invitation.is_expired:
            invitation.status = Invitation.Status.EXPIRED
            invitation.save()
            return api_response(message="Invitation has expired.", success=False, status_code=status.HTTP_400_BAD_REQUEST)

        return api_response(
            data=InvitationSerializer(invitation).data,
            message="Invitation is valid.",
            success=True,
        )

    def post(self, request, *args, **kwargs):
        token = request.data.get("token", "").strip()
        password = request.data.get("password", "")
        username = request.data.get("username", "")

        invitation = Invitation.objects.filter(token=token, status=Invitation.Status.PENDING).first()
        if not invitation or invitation.is_expired:
            return api_response(message="Invalid or expired invitation token.", success=False, status_code=status.HTTP_400_BAD_REQUEST)

        email = invitation.email.lower()
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            uname = username or email.split("@")[0]
            if User.objects.filter(username=uname).exists():
                uname = f"{uname}_{secrets.token_hex(2)}"
            user = User.objects.create_user(username=uname, email=email, password=password or secrets.token_urlsafe(16))
        elif password:
            user.set_password(password)
            user.save()

        # Link user to organization
        if invitation.organization:
            OrganizationMember.objects.update_or_create(
                organization=invitation.organization,
                user=user,
                defaults={"role": invitation.role, "is_active": True},
            )

        invitation.status = Invitation.Status.ACCEPTED
        invitation.save()

        tokens = JWTService.generate_token_pair(user, invitation.organization, role=invitation.role)
        return api_response(
            data={
                "tokens": tokens,
                "user": {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                },
                "organization": {
                    "id": str(invitation.organization.id) if invitation.organization else None,
                    "slug": invitation.organization.slug if invitation.organization else None,
                    "name": invitation.organization.name if invitation.organization else None,
                } if invitation.organization else None,
                "role": invitation.role,
            },
            message="Invitation accepted successfully.",
            success=True,
        )

