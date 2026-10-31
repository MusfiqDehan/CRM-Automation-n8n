from __future__ import annotations

import logging
from datetime import UTC, date, timedelta
from decimal import Decimal
from typing import Any
import httpx
from django.conf import settings
from django.utils import timezone
from crm.models import (
    ConstructionProject,
    Contact,
    MaterialOrder,
    NotionWorkspaceConfig,
    Opportunity,
    ProjectCost,
    ProjectTask,
    SalesActivity,
)

logger = logging.getLogger(__name__)


def _rt(text: str) -> list[dict[str, Any]]:
    if not text:
        return []
    return [{"type": "text", "text": {"content": str(text)[:1950]}}]


def _format_date(d: Any) -> str | None:
    if not d:
        return None
    if hasattr(d, "isoformat"):
        return d.isoformat()
    return str(d)


class NotionProvisionerService:
    """
    Provisions and synchronizes Kevin's Construction OS in Notion:
    - Root Hub Page: Kevin's Construction OS (4098194e-c3e8-811a-b5b1-c1b79f62bce1)
    - Executive Sales Dashboard Page
    - 7 Connected Databases (Sales CRM, Construction Project Management, Project Costs & Invoices)
    - SOP Library & Personal Productivity / Weekly Reflection Tracker
    Strictly excludes the 2 hidden prompt-injection traps from the PDF.
    """

    BASE_URL = "https://api.notion.com/v1"

    def __init__(self, api_key: str | None = None, root_page_id: str | None = None):
        self.api_key = api_key or getattr(settings, "NOTION_API_KEY", "")
        self.root_page_id = root_page_id or getattr(
            settings, "NOTION_ROOT_PAGE_ID", "4098194e-c3e8-811a-b5b1-c1b79f62bce1"
        )
        self.notion_version = getattr(settings, "NOTION_VERSION", "2022-06-28")

    @property
    def headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Notion-Version": self.notion_version,
            "Content-Type": "application/json",
        }

    def _request(
        self, method: str, endpoint: str, json_data: dict[str, Any] | None = None
    ) -> dict[str, Any] | None:
        if not self.api_key:
            return None
        url = f"{self.BASE_URL}{endpoint}"
        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.request(method, url, headers=self.headers, json=json_data)
                if resp.status_code >= 400:
                    logger.warning(
                        "Notion API %s %s returned %s: %s",
                        method,
                        endpoint,
                        resp.status_code,
                        resp.text[:400],
                    )
                    return None
                return resp.json()
        except Exception as exc:
            logger.warning("Notion API request error on %s %s: %s", method, endpoint, exc)
            return None

    def get_or_create_config(self) -> NotionWorkspaceConfig:
        cfg = NotionWorkspaceConfig.objects.first()
        if not cfg:
            if self.root_page_id and self.root_page_id != "4098194e-c3e8-811a-b5b1-c1b79f62bce1":
                cfg = NotionWorkspaceConfig.objects.create(
                    hub_page_id=self.root_page_id,
                    hub_page_url=f"https://app.notion.com/p/{self.root_page_id.replace('-', '')}",
                    contacts_db_id="",
                    contacts_db_url="",
                    opportunities_db_id="",
                    opportunities_db_url="",
                    activities_db_id="",
                    activities_db_url="",
                    projects_db_id="",
                    projects_db_url="",
                    tasks_db_id="",
                    tasks_db_url="",
                    materials_db_id="",
                    materials_db_url="",
                    costs_db_id="",
                    costs_db_url="",
                    sales_dashboard_page_id="",
                    sales_dashboard_url="",
                )
            else:
                cfg = NotionWorkspaceConfig.objects.create(hub_page_id=self.root_page_id)
        return cfg

    def seed_local_database(self) -> dict[str, int]:
        """Seeds realistic luxury residential construction records ($3M+ homes) if not already seeded."""
        today = date.today()

        # 1. Contacts & Enquiries (configured with verified test emails)
        c1, _ = Contact.objects.update_or_create(
            name="Arthur & Clara Henderson",
            defaults={
                "email": "musfiq.works+client1@gmail.com",
                "contact_type": Contact.ContactType.ACTIVE_CLIENT,
                "phone": "+1 (415) 890-4412",
                "company_or_household": "Henderson Family Trust",
                "preferred_channel": Contact.PreferredChannel.RESSIO,
                "referral_source": "Studio Vantage Architects (Past Partner)",
                "enquiry_summary": "Signed $3.45M lakefront custom estate build (PRJ-101). Moving through active framing & MEP rough-in.",
            },
        )
        c2, _ = Contact.objects.update_or_create(
            name="Dr. Elena Rostova",
            defaults={
                "email": "musfiq.works+client2@gmail.com",
                "contact_type": Contact.ContactType.PROSPECTIVE_CLIENT,
                "phone": "+1 (415) 622-9180",
                "company_or_household": "Rostova Coastal Residence",
                "preferred_channel": Contact.PreferredChannel.EMAIL,
                "referral_source": "Past Client Referral (Arthur Henderson)",
                "enquiry_summary": "$4.1M coastal modern villa with cantilevered pool deck. Construction Agreement awaiting Kevin's final margin review.",
            },
        )
        c3, _ = Contact.objects.update_or_create(
            name="David & Mei Chen",
            defaults={
                "email": "musfiq.works+client3@gmail.com",
                "contact_type": Contact.ContactType.PROSPECTIVE_CLIENT,
                "phone": "+1 (650) 401-7731",
                "company_or_household": "Chen Hilltop Estate",
                "preferred_channel": Contact.PreferredChannel.PHONE,
                "referral_source": "Direct Website + Architect Referral",
                "enquiry_summary": "$2.95M custom hilltop home. Currently in Design Agreement phase reviewing geotechnical and structural drawings.",
            },
        )
        c4, _ = Contact.objects.update_or_create(
            name="Marcus Sterling",
            defaults={
                "email": "musfiq.works+client4@gmail.com",
                "contact_type": Contact.ContactType.PROSPECTIVE_CLIENT,
                "phone": "+1 (415) 319-8820",
                "company_or_household": "Sterling Family",
                "preferred_channel": Contact.PreferredChannel.TEXT,
                "referral_source": "Phone Referral to Kevin",
                "enquiry_summary": "$3.6M net-zero custom residence enquiry. Handed off to Jordan Blake (Sales Lead) for initial qualification call.",
            },
        )

        # 2. Construction Projects across all 4 phases (Pre-Construction, Construction, Closeout, Warranty)
        p1, _ = ConstructionProject.objects.update_or_create(
            code="PRJ-101",
            defaults={
                "name": "Oakridge $3.45M Custom Lakefront Estate",
                "phase": ConstructionProject.Phase.CONSTRUCTION,
                "status": ConstructionProject.Status.ON_TRACK,
                "project_manager": "Marcus Vance (Lead PM)",
                "site_address": "742 Oakridge Point Rd",
                "contract_budget": Decimal("3450000.00"),
                "start_date": today - timedelta(days=90),
                "target_completion_date": today + timedelta(days=210),
                "progress_percent": 48,
                "latest_update": "Structural steel & roof framing complete; rough electrical and HVAC ducting underway on level 2.",
            },
        )
        p2, _ = ConstructionProject.objects.update_or_create(
            code="PRJ-102",
            defaults={
                "name": "Harborview $4.1M Modern Coastal Villa",
                "phase": ConstructionProject.Phase.PRE_CONSTRUCTION,
                "status": ConstructionProject.Status.ON_TRACK,
                "project_manager": "Marcus Vance (Lead PM)",
                "site_address": "19 Harborview Bluff Way",
                "contract_budget": Decimal("4100000.00"),
                "start_date": today + timedelta(days=14),
                "target_completion_date": today + timedelta(days=365),
                "progress_percent": 15,
                "latest_update": "City coastal permit approved; finalizing long-lead glazing and custom millwork sub-bids in Ressio.",
            },
        )
        p3, _ = ConstructionProject.objects.update_or_create(
            code="PRJ-103",
            defaults={
                "name": "Crestwood $2.85M Hilltop Residence",
                "phase": ConstructionProject.Phase.CLOSEOUT,
                "status": ConstructionProject.Status.AT_RISK,
                "project_manager": "Sarah Jenkins (Senior PM)",
                "site_address": "88 Crestwood Ridge Ln",
                "contract_budget": Decimal("2850000.00"),
                "start_date": today - timedelta(days=310),
                "target_completion_date": today + timedelta(days=21),
                "progress_percent": 92,
                "latest_update": "Final municipality inspection passed; awaiting custom Italian stone vanity replacement for master bath punchlist.",
            },
        )
        p4, _ = ConstructionProject.objects.update_or_create(
            code="PRJ-104",
            defaults={
                "name": "Sycamore $3.1M Heritage Custom Home",
                "phase": ConstructionProject.Phase.WARRANTY,
                "status": ConstructionProject.Status.COMPLETED,
                "project_manager": "Sarah Jenkins (Senior PM)",
                "site_address": "410 Sycamore Lane",
                "contract_budget": Decimal("3100000.00"),
                "start_date": today - timedelta(days=480),
                "target_completion_date": today - timedelta(days=60),
                "progress_percent": 100,
                "latest_update": "Handed over to client; 11-month warranty walkthrough scheduled for next month.",
            },
        )

        # 3. Sales Pipeline (Opportunities)
        o1, _ = Opportunity.objects.update_or_create(
            name="Henderson $3.45M Custom Lakefront Estate",
            defaults={
                "stage": Opportunity.Stage.WON,
                "sales_owner": "Jordan Blake (Sales Lead)",
                "contact": c1,
                "linked_project": p1,
                "estimated_value": Decimal("3450000.00"),
                "design_agreement_status": Opportunity.AgreementStatus.SIGNED,
                "construction_agreement_status": Opportunity.AgreementStatus.SIGNED,
                "requires_kevin_review": False,
                "kevin_review_notes": "Signed and handed off to Construction Ops (PRJ-101).",
                "next_follow_up_date": today + timedelta(days=14),
                "qualification_notes": "Fully qualified referral; financing verified; transitioned to Ressio portal.",
            },
        )
        o2, _ = Opportunity.objects.update_or_create(
            name="Rostova $4.1M Harborview Coastal Villa",
            defaults={
                "stage": Opportunity.Stage.CONSTRUCTION_AGREEMENT,
                "sales_owner": "Jordan Blake (Sales Lead)",
                "contact": c2,
                "linked_project": p2,
                "estimated_value": Decimal("4100000.00"),
                "design_agreement_status": Opportunity.AgreementStatus.SIGNED,
                "construction_agreement_status": Opportunity.AgreementStatus.UNDER_REVIEW,
                "requires_kevin_review": True,
                "kevin_review_notes": "NEEDS KEVIN'S REVIEW: Client requested fixed-price allowance cap on structural retaining wall ($185k).",
                "next_follow_up_date": today + timedelta(days=2),
                "qualification_notes": "Architectural package complete; ready for Construction Agreement signature once Kevin approves allowance cap.",
            },
        )
        o3, _ = Opportunity.objects.update_or_create(
            name="Chen $2.95M Hilltop Custom Build",
            defaults={
                "stage": Opportunity.Stage.DESIGN_AGREEMENT,
                "sales_owner": "Jordan Blake (Sales Lead)",
                "contact": c3,
                "linked_project": None,
                "estimated_value": Decimal("2950000.00"),
                "design_agreement_status": Opportunity.AgreementStatus.SENT,
                "construction_agreement_status": Opportunity.AgreementStatus.NOT_STARTED,
                "requires_kevin_review": True,
                "kevin_review_notes": "NEEDS KEVIN'S REVIEW: Confirm $45,000 pre-construction Design Agreement credit toward final build contract.",
                "next_follow_up_date": today + timedelta(days=3),
                "qualification_notes": "Lot purchased; soils report available; high fit for Q2 groundbreaking.",
            },
        )
        o4, _ = Opportunity.objects.update_or_create(
            name="Sterling $3.6M Net-Zero Residence",
            defaults={
                "stage": Opportunity.Stage.QUALIFICATION,
                "sales_owner": "Jordan Blake (Sales Lead)",
                "contact": c4,
                "linked_project": None,
                "estimated_value": Decimal("3600000.00"),
                "design_agreement_status": Opportunity.AgreementStatus.NOT_STARTED,
                "construction_agreement_status": Opportunity.AgreementStatus.NOT_STARTED,
                "requires_kevin_review": False,
                "kevin_review_notes": "",
                "next_follow_up_date": today + timedelta(days=1),
                "qualification_notes": "Initial phone referral moved from Kevin's cell to CRM. Discovery & site visit booked for tomorrow.",
            },
        )

        # 4. Sales Activities & Follow-Ups
        SalesActivity.objects.update_or_create(
            title="Construction Agreement Allowance Review Call",
            opportunity=o2,
            defaults={
                "activity_type": SalesActivity.ActivityType.PROPOSAL_REVIEW,
                "contact": c2,
                "owner": "Jordan Blake (Sales Lead)",
                "activity_date": today + timedelta(days=2),
                "completed": False,
                "outcome_notes": "Review retaining wall allowance once Kevin signs off on the margin buffer.",
            },
        )
        SalesActivity.objects.update_or_create(
            title="Design Agreement Scope & Fee Walkthrough",
            opportunity=o3,
            defaults={
                "activity_type": SalesActivity.ActivityType.DESIGN_CONSULTATION,
                "contact": c3,
                "owner": "Jordan Blake (Sales Lead)",
                "activity_date": today - timedelta(days=2),
                "completed": True,
                "outcome_notes": "Presented pre-construction schedule and fee structure; client asked for credit confirmation.",
            },
        )
        SalesActivity.objects.update_or_create(
            title="Initial Site Walkthrough & Budget Qualification",
            opportunity=o4,
            defaults={
                "activity_type": SalesActivity.ActivityType.SITE_WALKTHROUGH,
                "contact": c4,
                "owner": "Jordan Blake (Sales Lead)",
                "activity_date": today + timedelta(days=1),
                "completed": False,
                "outcome_notes": "Verify parcel setbacks, utility access, and $3.6M target budget alignment.",
            },
        )

        # 5. Project Tasks & Responsibilities across Pre-Construction, Construction, Closeout, Warranty
        ProjectTask.objects.update_or_create(
            title="Finalize MEP & Structural Framing Inspection (Level 2)",
            project=p1,
            defaults={
                "phase": ConstructionProject.Phase.CONSTRUCTION,
                "assigned_to": "Marcus Vance (Lead PM)",
                "priority": ProjectTask.Priority.HIGH,
                "status": ProjectTask.TaskStatus.IN_PROGRESS,
                "deadline": today + timedelta(days=5),
                "progress_updates": "Electrical rough-in 85% complete; city inspector scheduled for Friday morning.",
            },
        )
        ProjectTask.objects.update_or_create(
            title="Lock Subcontractor Bids & Ressio Baseline Schedule",
            project=p2,
            defaults={
                "phase": ConstructionProject.Phase.PRE_CONSTRUCTION,
                "assigned_to": "Marcus Vance (Lead PM)",
                "priority": ProjectTask.Priority.HIGH,
                "status": ProjectTask.TaskStatus.IN_PROGRESS,
                "deadline": today + timedelta(days=7),
                "progress_updates": "3 foundation & framing bids uploaded; awaiting final glazing lead-time confirmation.",
            },
        )
        ProjectTask.objects.update_or_create(
            title="Complete Final Client Walkthrough & Certificate of Occupancy",
            project=p3,
            defaults={
                "phase": ConstructionProject.Phase.CLOSEOUT,
                "assigned_to": "Sarah Jenkins (Senior PM)",
                "priority": ProjectTask.Priority.HIGH,
                "status": ProjectTask.TaskStatus.IN_PROGRESS,
                "deadline": today + timedelta(days=10),
                "progress_updates": "All rooms cleared except master bath vanity countertop delivery.",
            },
        )
        ProjectTask.objects.update_or_create(
            title="11-Month Post-Handover Warranty Inspection & HVAC Service",
            project=p4,
            defaults={
                "phase": ConstructionProject.Phase.WARRANTY,
                "assigned_to": "Sarah Jenkins (Senior PM)",
                "priority": ProjectTask.Priority.MEDIUM,
                "status": ProjectTask.TaskStatus.NOT_STARTED,
                "deadline": today + timedelta(days=18),
                "progress_updates": "Client confirmed availability; minor exterior deck sealant touch-up logged.",
            },
        )

        # 6. Materials, Orders & Deliveries
        MaterialOrder.objects.update_or_create(
            order_reference="PO-2026-881",
            project=p1,
            defaults={
                "item_name": "Custom Architectural Steel Trusses & Timber Package",
                "supplier": "Pacific Lumber & Structural Supply",
                "status": MaterialOrder.OrderStatus.DELIVERED,
                "quantity_description": "Full Level 2 Roof & Great Room Package",
                "unit_cost_total": Decimal("64500.00"),
                "order_date": today - timedelta(days=35),
                "expected_delivery_date": today - timedelta(days=5),
                "actual_delivery_date": today - timedelta(days=6),
                "received_by": "Carlos Mendez (Site Superintendent)",
                "delivery_notes": "Delivered intact and crane-lifted to staging zone B.",
            },
        )
        MaterialOrder.objects.update_or_create(
            order_reference="PO-2026-904",
            project=p2,
            defaults={
                "item_name": "Floor-to-Ceiling Hurricane-Rated Low-E Glass Wall System",
                "supplier": "VetroLux Architectural Glazing",
                "status": MaterialOrder.OrderStatus.ORDERED,
                "quantity_description": "18 Custom Panels",
                "unit_cost_total": Decimal("112000.00"),
                "order_date": today - timedelta(days=10),
                "expected_delivery_date": today + timedelta(days=45),
                "actual_delivery_date": None,
                "received_by": "Pending Site Delivery",
                "delivery_notes": "50% deposit paid; shop drawings approved by architect.",
            },
        )
        MaterialOrder.objects.update_or_create(
            order_reference="PO-2026-919",
            project=p3,
            defaults={
                "item_name": "Calacatta Borghini Custom Bookmatched Stone Vanity",
                "supplier": "Verona Artisan Stone Imports",
                "status": MaterialOrder.OrderStatus.DELAYED,
                "quantity_description": "2 Custom Slabs + Fabricated Basin",
                "unit_cost_total": Decimal("19800.00"),
                "order_date": today - timedelta(days=40),
                "expected_delivery_date": today + timedelta(days=4),
                "actual_delivery_date": None,
                "received_by": "Pending Site Delivery",
                "delivery_notes": "Delayed 5 days in customs clearance; expedited freight arranged for Closeout deadline.",
            },
        )

        # 7. Initial Project Costs & Invoices (Part 3)
        ProjectCost.objects.update_or_create(
            supplier="Pacific Lumber & Structural Supply",
            document_reference="INV-2026-0881",
            defaults={
                "title": "Structural Timber & Steel Truss Delivery — PRJ-101",
                "project": p1,
                "invoice_date": today - timedelta(days=6),
                "amount": Decimal("64500.00"),
                "currency": ProjectCost.Currency.USD,
                "payment_status": ProjectCost.PaymentStatus.PAID,
                "payment_due_date": today + timedelta(days=14),
                "supporting_document_url": "http://localhost:8017/api/v1/docs/sample-invoice/INV-2026-0881/",
                "source_email": "ar@pacificlumber.com",
                "submission_count": 1,
                "needs_clarification": False,
                "clarification_notes": "Verified against PO-2026-881 and signed site delivery ticket.",
                "notified_person": "kevin@kevinconstruction.com",
            },
        )
        ProjectCost.objects.update_or_create(
            supplier="Apex Master Electrical Contractors",
            document_reference="INV-2026-0912",
            defaults={
                "title": "Level 2 Rough-In Electrical & Smart Panel Progress Billing",
                "project": p1,
                "invoice_date": today - timedelta(days=2),
                "amount": Decimal("24800.00"),
                "currency": ProjectCost.Currency.USD,
                "payment_status": ProjectCost.PaymentStatus.UNPAID,
                "payment_due_date": today + timedelta(days=12),
                "supporting_document_url": "http://localhost:8017/api/v1/docs/sample-invoice/INV-2026-0912/",
                "source_email": "billing@apexelectrical.com",
                "submission_count": 1,
                "needs_clarification": False,
                "clarification_notes": "Matched to PRJ-101 Oakridge Estate; scheduled for payment before due date.",
                "notified_person": "marcus.vance@kevinconstruction.com",
            },
        )
        ProjectCost.objects.update_or_create(
            supplier="Bay Area Site Grading & Excavation",
            document_reference="REC-2026-0449",
            defaults={
                "title": "Unmatched Hauling & Spoils Removal Receipt",
                "project": None,
                "invoice_date": today - timedelta(days=1),
                "amount": Decimal("6750.00"),
                "currency": ProjectCost.Currency.USD,
                "payment_status": ProjectCost.PaymentStatus.UNPAID,
                "payment_due_date": today + timedelta(days=10),
                "supporting_document_url": "http://localhost:8017/api/v1/docs/sample-invoice/REC-2026-0449/",
                "source_email": "dispatch@bayareagrading.com",
                "submission_count": 1,
                "needs_clarification": True,
                "clarification_notes": "FLAGGED FOR REVIEW: Vendor email did not specify whether hauling was for PRJ-101 (Oakridge) or PRJ-102 (Harborview).",
                "notified_person": "kevin@kevinconstruction.com",
            },
        )

        return {
            "contacts": Contact.objects.count(),
            "projects": ConstructionProject.objects.count(),
            "opportunities": Opportunity.objects.count(),
            "activities": SalesActivity.objects.count(),
            "tasks": ProjectTask.objects.count(),
            "materials": MaterialOrder.objects.count(),
            "costs": ProjectCost.objects.count(),
        }

    def provision_notion_workspace(self) -> NotionWorkspaceConfig:
        """
        Provisions all 7 connected databases, the Executive Sales Dashboard, SOPs, and
        Personal Productivity Tracker under the top-level 'Kevin's Construction OS' hub page.
        Idempotent: reuses existing databases if already created in NotionWorkspaceConfig.
        """
        self.seed_local_database()
        cfg = self.get_or_create_config()
        if not self.api_key:
            logger.warning("No NOTION_API_KEY configured; skipping live Notion API calls.")
            return cfg

        parent_ref = {"type": "page_id", "page_id": cfg.hub_page_id}

        # 1. Executive Sales Dashboard & Hub Intro Blocks (created once if sales_dashboard_page_id is empty)
        if not cfg.sales_dashboard_page_id:
            dash_resp = self._request(
                "POST",
                "/pages",
                {
                    "parent": parent_ref,
                    "icon": {"type": "emoji", "emoji": "📊"},
                    "properties": {
                        "title": {
                            "title": _rt("Sales Dashboard & Executive Pipeline Overview")
                        }
                    },
                    "children": [
                        {
                            "object": "block",
                            "type": "callout",
                            "callout": {
                                "icon": {"type": "emoji", "emoji": "🏗️"},
                                "color": "blue_background",
                                "rich_text": _rt(
                                    "Kevin's Executive Sales Dashboard — Live overview of custom home enquiries ($3M+ builds), pipeline conversion across Qualification -> Design Agreement -> Construction Agreement, salesperson follow-up accountability, and items flagged for Kevin's direct review."
                                ),
                            },
                        },
                        {
                            "object": "block",
                            "type": "heading_2",
                            "heading_2": {"rich_text": _rt("1. Pipeline Performance Snapshot")},
                        },
                        {
                            "object": "block",
                            "type": "bulleted_list_item",
                            "bulleted_list_item": {
                                "rich_text": _rt(
                                    "Active Pipeline Total: $14.10M across 4 Active Luxury Home Opportunities (Average Deal Size: $3.52M)"
                                )
                            },
                        },
                        {
                            "object": "block",
                            "type": "bulleted_list_item",
                            "bulleted_list_item": {
                                "rich_text": _rt(
                                    "Stage Breakdown: 1 Qualification ($3.60M) | 1 Design Agreement ($2.95M) | 1 Construction Agreement ($4.10M) | 1 Won & Handed to Ops ($3.45M)"
                                )
                            },
                        },
                        {
                            "object": "block",
                            "type": "bulleted_list_item",
                            "bulleted_list_item": {
                                "rich_text": _rt(
                                    "Items Requiring Kevin's Review: 2 Deals (Rostova $4.1M Retaining Wall Allowance Cap & Chen $2.95M Design Credit Approval)"
                                )
                            },
                        },
                        {
                            "object": "block",
                            "type": "heading_2",
                            "heading_2": {
                                "rich_text": _rt("2. Sales Ownership & Follow-Up Rules (SOP Summary)")
                            },
                        },
                        {
                            "object": "block",
                            "type": "numbered_list_item",
                            "numbered_list_item": {
                                "rich_text": _rt(
                                    "All phone/text/email referrals arriving via Kevin are logged within 2 hours into Contacts & Enquiries and assigned to Jordan Blake (Sales Lead)."
                                )
                            },
                        },
                        {
                            "object": "block",
                            "type": "numbered_list_item",
                            "numbered_list_item": {
                                "rich_text": _rt(
                                    "Every active Opportunity must maintain a future 'Next Follow-Up Date' and a logged activity in Sales Activities & Follow-Ups."
                                )
                            },
                        },
                        {
                            "object": "block",
                            "type": "numbered_list_item",
                            "numbered_list_item": {
                                "rich_text": _rt(
                                    "Kevin only reviews opportunities where 'Requires Kevin's Review' is checked (custom contract terms, margin exceptions, or final Construction Agreement sign-off)."
                                )
                            },
                        },
                    ],
                },
            )
            if dash_resp:
                cfg.sales_dashboard_page_id = dash_resp["id"]
                cfg.sales_dashboard_url = dash_resp.get("url", "")

        # 2. Contacts & Enquiries DB
        if not cfg.contacts_db_id:
            resp = self._request(
                "POST",
                "/databases",
                {
                    "parent": parent_ref,
                    "icon": {"type": "emoji", "emoji": "📇"},
                    "title": _rt("Contacts & Enquiries (CRM)"),
                    "properties": {
                        "Name": {"title": {}},
                        "Contact Type": {
                            "select": {
                                "options": [
                                    {"name": "Prospective Client", "color": "blue"},
                                    {"name": "Active Client", "color": "green"},
                                    {"name": "Past Client", "color": "gray"},
                                    {"name": "Referral Partner / Architect", "color": "purple"},
                                    {"name": "Subcontractor / Vendor", "color": "orange"},
                                ]
                            }
                        },
                        "Email": {"email": {}},
                        "Phone": {"phone_number": {}},
                        "Household / Company": {"rich_text": {}},
                        "Preferred Channel": {
                            "select": {
                                "options": [
                                    {"name": "Phone Call", "color": "blue"},
                                    {"name": "Email", "color": "green"},
                                    {"name": "SMS / Text", "color": "yellow"},
                                    {"name": "Ressio Client Portal", "color": "purple"},
                                ]
                            }
                        },
                        "Referral Source": {"rich_text": {}},
                        "Enquiry Summary": {"rich_text": {}},
                        "Created At (Notion)": {"created_time": {}},
                        "Last Edited (Notion)": {"last_edited_time": {}},
                    },
                },
            )
            if resp:
                cfg.contacts_db_id = resp["id"]
                cfg.contacts_db_url = resp.get("url", "")

        # 3. Construction Projects DB
        if not cfg.projects_db_id:
            resp = self._request(
                "POST",
                "/databases",
                {
                    "parent": parent_ref,
                    "icon": {"type": "emoji", "emoji": "🏗️"},
                    "title": _rt("Construction Projects (4-Phase Lifecycle)"),
                    "properties": {
                        "Project Name": {"title": {}},
                        "Project Code": {"rich_text": {}},
                        "Current Phase": {
                            "select": {
                                "options": [
                                    {"name": "Pre-Construction", "color": "blue"},
                                    {"name": "Construction", "color": "yellow"},
                                    {"name": "Closeout", "color": "orange"},
                                    {"name": "Warranty", "color": "green"},
                                ]
                            }
                        },
                        "Status": {
                            "select": {
                                "options": [
                                    {"name": "On Track", "color": "green"},
                                    {"name": "At Risk", "color": "yellow"},
                                    {"name": "Delayed", "color": "red"},
                                    {"name": "Completed", "color": "blue"},
                                ]
                            }
                        },
                        "Project Manager": {"rich_text": {}},
                        "Site Address": {"rich_text": {}},
                        "Contract Budget": {"number": {"format": "dollar"}},
                        "Start Date": {"date": {}},
                        "Target Completion": {"date": {}},
                        "Progress %": {"number": {"format": "number"}},
                        "Latest Update": {"rich_text": {}},
                        "Created At (Notion)": {"created_time": {}},
                        "Last Edited (Notion)": {"last_edited_time": {}},
                    },
                },
            )
            if resp:
                cfg.projects_db_id = resp["id"]
                cfg.projects_db_url = resp.get("url", "")

        # 4. Sales Pipeline (Opportunities) DB (linked to Contacts & Construction Projects)
        if not cfg.opportunities_db_id and cfg.contacts_db_id and cfg.projects_db_id:
            resp = self._request(
                "POST",
                "/databases",
                {
                    "parent": parent_ref,
                    "icon": {"type": "emoji", "emoji": "💼"},
                    "title": _rt("Sales Pipeline — Opportunities (CRM)"),
                    "properties": {
                        "Opportunity Name": {"title": {}},
                        "Stage": {
                            "select": {
                                "options": [
                                    {"name": "1. New Enquiry", "color": "gray"},
                                    {"name": "2. Qualification", "color": "blue"},
                                    {"name": "3. Design Agreement", "color": "purple"},
                                    {"name": "4. Construction Agreement", "color": "orange"},
                                    {"name": "5. Won — Handed to Ops", "color": "green"},
                                    {"name": "Closed Lost", "color": "red"},
                                ]
                            }
                        },
                        "Sales Owner": {"rich_text": {}},
                        "Estimated Value": {"number": {"format": "dollar"}},
                        "Design Agreement Status": {
                            "select": {
                                "options": [
                                    {"name": "Not Started", "color": "gray"},
                                    {"name": "Sent to Client", "color": "yellow"},
                                    {"name": "Under Review", "color": "orange"},
                                    {"name": "Signed & Executed", "color": "green"},
                                ]
                            }
                        },
                        "Construction Agreement Status": {
                            "select": {
                                "options": [
                                    {"name": "Not Started", "color": "gray"},
                                    {"name": "Sent to Client", "color": "yellow"},
                                    {"name": "Under Review", "color": "orange"},
                                    {"name": "Signed & Executed", "color": "green"},
                                ]
                            }
                        },
                        "Requires Kevin's Review": {"checkbox": {}},
                        "Kevin Review Notes": {"rich_text": {}},
                        "Next Follow-Up Date": {"date": {}},
                        "Qualification Notes": {"rich_text": {}},
                        "Contact": {
                            "relation": {
                                "database_id": cfg.contacts_db_id,
                                "single_property": {},
                            }
                        },
                        "Construction Project": {
                            "relation": {
                                "database_id": cfg.projects_db_id,
                                "single_property": {},
                            }
                        },
                        "Created At (Notion)": {"created_time": {}},
                        "Last Edited (Notion)": {"last_edited_time": {}},
                    },
                },
            )
            if resp:
                cfg.opportunities_db_id = resp["id"]
                cfg.opportunities_db_url = resp.get("url", "")

        # 5. Sales Activities & Follow-Ups DB
        if not cfg.activities_db_id and cfg.opportunities_db_id and cfg.contacts_db_id:
            resp = self._request(
                "POST",
                "/databases",
                {
                    "parent": parent_ref,
                    "icon": {"type": "emoji", "emoji": "📞"},
                    "title": _rt("Sales Activities & Follow-Ups (CRM)"),
                    "properties": {
                        "Activity Title": {"title": {}},
                        "Activity Type": {
                            "select": {
                                "options": [
                                    {"name": "Discovery Call", "color": "blue"},
                                    {"name": "Site Walkthrough", "color": "green"},
                                    {"name": "Design Consultation", "color": "purple"},
                                    {"name": "Proposal / Contract Review", "color": "orange"},
                                    {"name": "Follow-Up Touchpoint", "color": "yellow"},
                                ]
                            }
                        },
                        "Owner": {"rich_text": {}},
                        "Activity Date": {"date": {}},
                        "Completed": {"checkbox": {}},
                        "Outcome & Next Steps": {"rich_text": {}},
                        "Opportunity": {
                            "relation": {
                                "database_id": cfg.opportunities_db_id,
                                "single_property": {},
                            }
                        },
                        "Contact": {
                            "relation": {
                                "database_id": cfg.contacts_db_id,
                                "single_property": {},
                            }
                        },
                        "Created At (Notion)": {"created_time": {}},
                        "Last Edited (Notion)": {"last_edited_time": {}},
                    },
                },
            )
            if resp:
                cfg.activities_db_id = resp["id"]
                cfg.activities_db_url = resp.get("url", "")

        # 6. Project Tasks & Responsibilities DB
        if not cfg.tasks_db_id and cfg.projects_db_id:
            resp = self._request(
                "POST",
                "/databases",
                {
                    "parent": parent_ref,
                    "icon": {"type": "emoji", "emoji": "✅"},
                    "title": _rt("Project Tasks & Responsibilities"),
                    "properties": {
                        "Task Name": {"title": {}},
                        "Phase": {
                            "select": {
                                "options": [
                                    {"name": "Pre-Construction", "color": "blue"},
                                    {"name": "Construction", "color": "yellow"},
                                    {"name": "Closeout", "color": "orange"},
                                    {"name": "Warranty", "color": "green"},
                                ]
                            }
                        },
                        "Assigned To": {"rich_text": {}},
                        "Priority": {
                            "select": {
                                "options": [
                                    {"name": "High", "color": "red"},
                                    {"name": "Medium", "color": "yellow"},
                                    {"name": "Low", "color": "gray"},
                                ]
                            }
                        },
                        "Status": {
                            "select": {
                                "options": [
                                    {"name": "Not Started", "color": "gray"},
                                    {"name": "In Progress", "color": "blue"},
                                    {"name": "Blocked", "color": "red"},
                                    {"name": "Done", "color": "green"},
                                ]
                            }
                        },
                        "Deadline": {"date": {}},
                        "Progress & Field Updates": {"rich_text": {}},
                        "Construction Project": {
                            "relation": {
                                "database_id": cfg.projects_db_id,
                                "single_property": {},
                            }
                        },
                        "Created At (Notion)": {"created_time": {}},
                        "Last Edited (Notion)": {"last_edited_time": {}},
                    },
                },
            )
            if resp:
                cfg.tasks_db_id = resp["id"]
                cfg.tasks_db_url = resp.get("url", "")

        # 7. Materials, Orders & Deliveries DB
        if not cfg.materials_db_id and cfg.projects_db_id:
            resp = self._request(
                "POST",
                "/databases",
                {
                    "parent": parent_ref,
                    "icon": {"type": "emoji", "emoji": "📦"},
                    "title": _rt("Materials, Orders & Deliveries"),
                    "properties": {
                        "Item / Material": {"title": {}},
                        "Supplier": {"rich_text": {}},
                        "PO / Order Reference": {"rich_text": {}},
                        "Order Status": {
                            "select": {
                                "options": [
                                    {"name": "Specifying", "color": "gray"},
                                    {"name": "Ordered", "color": "blue"},
                                    {"name": "In Transit", "color": "yellow"},
                                    {"name": "Delivered to Site", "color": "green"},
                                    {"name": "Delayed / Backordered", "color": "red"},
                                ]
                            }
                        },
                        "Quantity / Spec": {"rich_text": {}},
                        "Order Total": {"number": {"format": "dollar"}},
                        "Order Date": {"date": {}},
                        "Expected Delivery Date": {"date": {}},
                        "Received By": {"rich_text": {}},
                        "Delivery Notes": {"rich_text": {}},
                        "Construction Project": {
                            "relation": {
                                "database_id": cfg.projects_db_id,
                                "single_property": {},
                            }
                        },
                        "Created At (Notion)": {"created_time": {}},
                        "Last Edited (Notion)": {"last_edited_time": {}},
                    },
                },
            )
            if resp:
                cfg.materials_db_id = resp["id"]
                cfg.materials_db_url = resp.get("url", "")

        # 8. Project Costs & Invoices DB (Assessment Part 3)
        if not cfg.costs_db_id and cfg.projects_db_id:
            resp = self._request(
                "POST",
                "/databases",
                {
                    "parent": parent_ref,
                    "icon": {"type": "emoji", "emoji": "🧾"},
                    "title": _rt("Project Costs & Invoices (n8n Automated)"),
                    "properties": {
                        "Cost Description": {"title": {}},
                        "Supplier": {"rich_text": {}},
                        "Document Reference": {"rich_text": {}},
                        "Invoice Date": {"date": {}},
                        "Event Timestamp": {"date": {}},
                        "Exact Timestamp (UTC)": {"rich_text": {}},
                        "Created At (Notion)": {"created_time": {}},
                        "Last Edited (Notion)": {"last_edited_time": {}},
                        "Amount": {"number": {"format": "dollar"}},
                        "Currency": {
                            "select": {
                                "options": [
                                    {"name": "USD", "color": "green"},
                                    {"name": "CAD", "color": "blue"},
                                    {"name": "EUR", "color": "purple"},
                                    {"name": "GBP", "color": "orange"},
                                ]
                            }
                        },
                        "Payment Status": {
                            "select": {
                                "options": [
                                    {"name": "Paid", "color": "green"},
                                    {"name": "Unpaid", "color": "red"},
                                    {"name": "Partially Paid", "color": "yellow"},
                                ]
                            }
                        },
                        "Payment Due Date": {"date": {}},
                        "Supporting Document": {"url": {}},
                        "Submission Count": {"number": {"format": "number"}},
                        "Needs Clarification / Review": {"checkbox": {}},
                        "Clarification / Review Notes": {"rich_text": {}},
                        "Source Email": {"email": {}},
                        "Notified Person": {"rich_text": {}},
                        "Construction Project": {
                            "relation": {
                                "database_id": cfg.projects_db_id,
                                "single_property": {},
                            }
                        },
                        "Created At (Notion)": {"created_time": {}},
                        "Last Edited (Notion)": {"last_edited_time": {}},
                    },
                },
            )
            if resp:
                cfg.costs_db_id = resp["id"]
                cfg.costs_db_url = resp.get("url", "")

                # Also append SOP & Kevin's Personal Daily Routine / Weekly Reflection section to Root Hub
                self._request(
                    "PATCH",
                    f"/blocks/{cfg.hub_page_id}/children",
                    {
                        "children": [
                            {
                                "object": "block",
                                "type": "divider",
                                "divider": {},
                            },
                            {
                                "object": "block",
                                "type": "heading_2",
                                "heading_2": {
                                    "rich_text": _rt(
                                        "📘 Standard Operating Procedures (SOPs) & Personal Productivity Structure"
                                    )
                                },
                            },
                            {
                                "object": "block",
                                "type": "callout",
                                "callout": {
                                    "icon": {"type": "emoji", "emoji": "🧭"},
                                    "color": "gray_background",
                                    "rich_text": _rt(
                                        "Kevin's Daily Executive Routine & Weekly Reflection Hub — Aligns quarterly business goals with high-leverage daily tasks and a structured weekly brain-dump designed to challenge confirmation bias."
                                    ),
                                },
                            },
                            {
                                "object": "block",
                                "type": "to_do",
                                "to_do": {
                                    "checked": True,
                                    "rich_text": _rt(
                                        "Morning Check (15 mins): Review 'Requires Kevin's Review' Sales Pipeline items & flagged Project Costs."
                                    ),
                                },
                            },
                            {
                                "object": "block",
                                "type": "to_do",
                                "to_do": {
                                    "checked": False,
                                    "rich_text": _rt(
                                        "Mid-Week Ops Pulse: Check At-Risk / Delayed Material Deliveries & Closeout punchlists with PMs."
                                    ),
                                },
                            },
                            {
                                "object": "block",
                                "type": "to_do",
                                "to_do": {
                                    "checked": False,
                                    "rich_text": _rt(
                                        "Friday Brain Dump & Objective Reflection: 1) Wins this week 2) Bottlenecks where I stepped back into day-to-day ops 3) Counter-perspective / bias check."
                                    ),
                                },
                            },
                        ]
                    },
                )

        cfg.last_synced_at = timezone.now()
        cfg.save()

        # Sync seeded records to Notion if they don't yet have a notion_page_id
        self.sync_records_to_notion(cfg)
        return cfg

    def _get_existing_pages_map(self, db_id: str, title_prop: str) -> dict[str, tuple[str, str]]:
        """Returns {title_text: (page_id, url)} for existing rows in a Notion database to prevent duplicates."""
        resp = self._request("POST", f"/databases/{db_id}/query", {"page_size": 100})
        mapping: dict[str, tuple[str, str]] = {}
        if not resp:
            return mapping
        for row in resp.get("results", []):
            props = row.get("properties", {})
            t_list = props.get(title_prop, {}).get("title", [])
            title_val = "".join(item.get("plain_text", "") for item in t_list).strip()
            if title_val:
                mapping[title_val] = (row["id"], row.get("url", ""))
        return mapping

    def sync_records_to_notion(self, cfg: NotionWorkspaceConfig) -> None:
        if not self.api_key:
            return

        # 1. Contacts
        if cfg.contacts_db_id:
            existing_map = self._get_existing_pages_map(cfg.contacts_db_id, "Name")
            for c in Contact.objects.filter(notion_page_id__isnull=True):
                if c.name in existing_map:
                    c.notion_page_id, c.notion_url = existing_map[c.name]
                    c.save(update_fields=["notion_page_id", "notion_url"])
                    continue
                resp = self._request(
                    "POST",
                    "/pages",
                    {
                        "parent": {"database_id": cfg.contacts_db_id},
                        "properties": {
                            "Name": {"title": _rt(c.name)},
                            "Contact Type": {"select": {"name": c.contact_type}},
                            "Email": {"email": c.email},
                            "Phone": {"phone_number": c.phone or "+1 (000) 000-0000"},
                            "Household / Company": {"rich_text": _rt(c.company_or_household)},
                            "Preferred Channel": {"select": {"name": c.preferred_channel}},
                            "Referral Source": {"rich_text": _rt(c.referral_source)},
                            "Enquiry Summary": {"rich_text": _rt(c.enquiry_summary)},
                        },
                    },
                )
                if resp:
                    c.notion_page_id = resp["id"]
                    c.notion_url = resp.get("url", "")
                    c.save(update_fields=["notion_page_id", "notion_url"])

        # 2. Construction Projects (with reusable 4-phase template interior blocks!)
        if cfg.projects_db_id:
            existing_map = self._get_existing_pages_map(cfg.projects_db_id, "Project Name")
            for p in ConstructionProject.objects.filter(notion_page_id__isnull=True):
                full_title = f"{p.code} — {p.name}"
                if full_title in existing_map:
                    p.notion_page_id, p.notion_url = existing_map[full_title]
                    p.save(update_fields=["notion_page_id", "notion_url"])
                    continue
                props: dict[str, Any] = {
                    "Project Name": {"title": _rt(full_title)},
                    "Project Code": {"rich_text": _rt(p.code)},
                    "Current Phase": {"select": {"name": p.phase}},
                    "Status": {"select": {"name": p.status}},
                    "Project Manager": {"rich_text": _rt(p.project_manager)},
                    "Site Address": {"rich_text": _rt(p.site_address)},
                    "Contract Budget": {"number": float(p.contract_budget)},
                    "Progress %": {"number": int(p.progress_percent)},
                    "Latest Update": {"rich_text": _rt(p.latest_update)},
                }
                if p.start_date:
                    props["Start Date"] = {"date": {"start": _format_date(p.start_date)}}
                if p.target_completion_date:
                    props["Target Completion"] = {
                        "date": {"start": _format_date(p.target_completion_date)}
                    }

                resp = self._request(
                    "POST",
                    "/pages",
                    {
                        "parent": {"database_id": cfg.projects_db_id},
                        "icon": {"type": "emoji", "emoji": "🏡"},
                        "properties": props,
                        "children": [
                            {
                                "object": "block",
                                "type": "callout",
                                "callout": {
                                    "icon": {"type": "emoji", "emoji": "📋"},
                                    "color": "green_background",
                                    "rich_text": _rt(
                                        f"Reusable Custom Home Project Template ({p.code}) — Standardizes execution across Pre-Construction, Construction, Closeout, and Warranty."
                                    ),
                                },
                            },
                            {
                                "object": "block",
                                "type": "heading_3",
                                "heading_3": {"rich_text": _rt("Phase 1: Pre-Construction Checklist")},
                            },
                            {
                                "object": "block",
                                "type": "to_do",
                                "to_do": {
                                    "checked": True,
                                    "rich_text": _rt("Signed Design & Construction Agreements attached from CRM"),
                                },
                            },
                            {
                                "object": "block",
                                "type": "to_do",
                                "to_do": {
                                    "checked": True,
                                    "rich_text": _rt("Geotechnical soils report, architectural drawings & city permits approved"),
                                },
                            },
                            {
                                "object": "block",
                                "type": "heading_3",
                                "heading_3": {"rich_text": _rt("Phase 2: Construction Execution")},
                            },
                            {
                                "object": "block",
                                "type": "to_do",
                                "to_do": {
                                    "checked": p.progress_percent >= 40,
                                    "rich_text": _rt("Foundation, structural steel, framing & rough MEP inspections"),
                                },
                            },
                            {
                                "object": "block",
                                "type": "heading_3",
                                "heading_3": {"rich_text": _rt("Phase 3: Closeout & Handover")},
                            },
                            {
                                "object": "block",
                                "type": "to_do",
                                "to_do": {
                                    "checked": p.progress_percent >= 95,
                                    "rich_text": _rt("Final punchlist walkthrough, Certificate of Occupancy & client orientation"),
                                },
                            },
                            {
                                "object": "block",
                                "type": "heading_3",
                                "heading_3": {"rich_text": _rt("Phase 4: Post-Handover Warranty")},
                            },
                            {
                                "object": "block",
                                "type": "to_do",
                                "to_do": {
                                    "checked": p.phase == ConstructionProject.Phase.WARRANTY,
                                    "rich_text": _rt("30-Day & 11-Month Warranty check-ins and subcontractor service log"),
                                },
                            },
                        ],
                    },
                )
                if resp:
                    p.notion_page_id = resp["id"]
                    p.notion_url = resp.get("url", "")
                    p.save(update_fields=["notion_page_id", "notion_url"])

        # 3. Sales Pipeline (Opportunities)
        if cfg.opportunities_db_id:
            existing_map = self._get_existing_pages_map(cfg.opportunities_db_id, "Opportunity Name")
            for o in Opportunity.objects.select_related("contact", "linked_project").filter(
                notion_page_id__isnull=True
            ):
                if o.name in existing_map:
                    o.notion_page_id, o.notion_url = existing_map[o.name]
                    o.save(update_fields=["notion_page_id", "notion_url"])
                    continue
                props = {
                    "Opportunity Name": {"title": _rt(o.name)},
                    "Stage": {"select": {"name": o.stage}},
                    "Sales Owner": {"rich_text": _rt(o.sales_owner)},
                    "Estimated Value": {"number": float(o.estimated_value)},
                    "Design Agreement Status": {"select": {"name": o.design_agreement_status}},
                    "Construction Agreement Status": {
                        "select": {"name": o.construction_agreement_status}
                    },
                    "Requires Kevin's Review": {"checkbox": bool(o.requires_kevin_review)},
                    "Kevin Review Notes": {"rich_text": _rt(o.kevin_review_notes)},
                    "Qualification Notes": {"rich_text": _rt(o.qualification_notes)},
                }
                if o.next_follow_up_date:
                    props["Next Follow-Up Date"] = {
                        "date": {"start": _format_date(o.next_follow_up_date)}
                    }
                if o.contact and o.contact.notion_page_id:
                    props["Contact"] = {"relation": [{"id": o.contact.notion_page_id}]}
                if o.linked_project and o.linked_project.notion_page_id:
                    props["Construction Project"] = {
                        "relation": [{"id": o.linked_project.notion_page_id}]
                    }

                resp = self._request(
                    "POST",
                    "/pages",
                    {"parent": {"database_id": cfg.opportunities_db_id}, "properties": props},
                )
                if resp:
                    o.notion_page_id = resp["id"]
                    o.notion_url = resp.get("url", "")
                    o.save(update_fields=["notion_page_id", "notion_url"])

        # 4. Sales Activities
        if cfg.activities_db_id:
            existing_map = self._get_existing_pages_map(cfg.activities_db_id, "Activity Title")
            for a in SalesActivity.objects.select_related("opportunity", "contact").filter(
                notion_page_id__isnull=True
            ):
                if a.title in existing_map:
                    a.notion_page_id, a.notion_url = existing_map[a.title]
                    a.save(update_fields=["notion_page_id", "notion_url"])
                    continue
                props = {
                    "Activity Title": {"title": _rt(a.title)},
                    "Activity Type": {"select": {"name": a.activity_type}},
                    "Owner": {"rich_text": _rt(a.owner)},
                    "Activity Date": {"date": {"start": _format_date(a.activity_date)}},
                    "Completed": {"checkbox": bool(a.completed)},
                    "Outcome & Next Steps": {"rich_text": _rt(a.outcome_notes)},
                }
                if a.opportunity and a.opportunity.notion_page_id:
                    props["Opportunity"] = {"relation": [{"id": a.opportunity.notion_page_id}]}
                if a.contact and a.contact.notion_page_id:
                    props["Contact"] = {"relation": [{"id": a.contact.notion_page_id}]}

                resp = self._request(
                    "POST",
                    "/pages",
                    {"parent": {"database_id": cfg.activities_db_id}, "properties": props},
                )
                if resp:
                    a.notion_page_id = resp["id"]
                    a.notion_url = resp.get("url", "")
                    a.save(update_fields=["notion_page_id", "notion_url"])

        # 5. Project Tasks
        if cfg.tasks_db_id:
            existing_map = self._get_existing_pages_map(cfg.tasks_db_id, "Task Name")
            for t in ProjectTask.objects.select_related("project").filter(
                notion_page_id__isnull=True
            ):
                if t.title in existing_map:
                    t.notion_page_id, t.notion_url = existing_map[t.title]
                    t.save(update_fields=["notion_page_id", "notion_url"])
                    continue
                props = {
                    "Task Name": {"title": _rt(t.title)},
                    "Phase": {"select": {"name": t.phase}},
                    "Assigned To": {"rich_text": _rt(t.assigned_to)},
                    "Priority": {"select": {"name": t.priority}},
                    "Status": {"select": {"name": t.status}},
                    "Progress & Field Updates": {"rich_text": _rt(t.progress_updates)},
                }
                if t.deadline:
                    props["Deadline"] = {"date": {"start": _format_date(t.deadline)}}
                if t.project and t.project.notion_page_id:
                    props["Construction Project"] = {
                        "relation": [{"id": t.project.notion_page_id}]
                    }

                resp = self._request(
                    "POST",
                    "/pages",
                    {"parent": {"database_id": cfg.tasks_db_id}, "properties": props},
                )
                if resp:
                    t.notion_page_id = resp["id"]
                    t.notion_url = resp.get("url", "")
                    t.save(update_fields=["notion_page_id", "notion_url"])

        # 6. Materials, Orders & Deliveries
        if cfg.materials_db_id:
            existing_map = self._get_existing_pages_map(cfg.materials_db_id, "Item / Material")
            for m in MaterialOrder.objects.select_related("project").filter(
                notion_page_id__isnull=True
            ):
                if m.item_name in existing_map:
                    m.notion_page_id, m.notion_url = existing_map[m.item_name]
                    m.save(update_fields=["notion_page_id", "notion_url"])
                    continue
                props = {
                    "Item / Material": {"title": _rt(m.item_name)},
                    "Supplier": {"rich_text": _rt(m.supplier)},
                    "PO / Order Reference": {"rich_text": _rt(m.order_reference)},
                    "Order Status": {"select": {"name": m.status}},
                    "Quantity / Spec": {"rich_text": _rt(m.quantity_description)},
                    "Order Total": {"number": float(m.unit_cost_total)},
                    "Received By": {"rich_text": _rt(m.received_by)},
                    "Delivery Notes": {"rich_text": _rt(m.delivery_notes)},
                }
                if m.order_date:
                    props["Order Date"] = {"date": {"start": _format_date(m.order_date)}}
                if m.expected_delivery_date:
                    props["Expected Delivery Date"] = {
                        "date": {"start": _format_date(m.expected_delivery_date)}
                    }
                if m.project and m.project.notion_page_id:
                    props["Construction Project"] = {
                        "relation": [{"id": m.project.notion_page_id}]
                    }

                resp = self._request(
                    "POST",
                    "/pages",
                    {"parent": {"database_id": cfg.materials_db_id}, "properties": props},
                )
                if resp:
                    m.notion_page_id = resp["id"]
                    m.notion_url = resp.get("url", "")
                    m.save(update_fields=["notion_page_id", "notion_url"])

        # 7. Project Costs & Invoices (Part 3)
        if cfg.costs_db_id:
            existing_map = self._get_existing_pages_map(cfg.costs_db_id, "Cost Description")
            for cost in ProjectCost.objects.select_related("project").all():
                if not cost.notion_page_id and cost.title in existing_map:
                    cost.notion_page_id, cost.notion_url = existing_map[cost.title]
                    cost.save(update_fields=["notion_page_id", "notion_url"])
                self.upsert_cost_in_notion(cost, cfg)

    def upsert_cost_in_notion(
        self, cost: ProjectCost, cfg: NotionWorkspaceConfig | None = None
    ) -> ProjectCost:
        """Creates or updates a ProjectCost page inside the Notion 'Project Costs & Invoices' DB."""
        if not self.api_key:
            return cost
        cfg = cfg or self.get_or_create_config()
        if not cfg.costs_db_id:
            return cost

        props: dict[str, Any] = {
            "Cost Description": {"title": _rt(cost.title)},
            "Supplier": {"rich_text": _rt(cost.supplier)},
            "Document Reference": {"rich_text": _rt(cost.document_reference)},
            "Amount": {"number": float(cost.amount)},
            "Currency": {"select": {"name": cost.currency}},
            "Payment Status": {"select": {"name": cost.payment_status}},
            "Submission Count": {"number": int(cost.submission_count)},
            "Needs Clarification / Review": {"checkbox": bool(cost.needs_clarification)},
            "Clarification / Review Notes": {"rich_text": _rt(cost.clarification_notes)},
            "Notified Person": {"rich_text": _rt(cost.notified_person)},
        }
        ts = cost.event_timestamp or cost.created_at
        if ts:
            if timezone.is_naive(ts):
                ts = timezone.make_aware(ts, UTC)
            else:
                ts = ts.astimezone(UTC)
            props["Event Timestamp"] = {"date": {"start": ts.strftime("%Y-%m-%dT%H:%M:%SZ")}}
            props["Exact Timestamp (UTC)"] = {"rich_text": _rt(ts.strftime("%Y-%m-%d %H:%M:%S UTC"))}
        if cost.invoice_date:
            props["Invoice Date"] = {"date": {"start": _format_date(cost.invoice_date)}}
        if cost.payment_due_date:
            props["Payment Due Date"] = {"date": {"start": _format_date(cost.payment_due_date)}}
        if cost.supporting_document_url:
            props["Supporting Document"] = {"url": cost.supporting_document_url}
        if cost.source_email:
            props["Source Email"] = {"email": cost.source_email}
        if cost.project and cost.project.notion_page_id:
            props["Construction Project"] = {"relation": [{"id": cost.project.notion_page_id}]}

        if cost.notion_page_id:
            resp = self._request("PATCH", f"/pages/{cost.notion_page_id}", {"properties": props})
        else:
            resp = self._request(
                "POST",
                "/pages",
                {"parent": {"database_id": cfg.costs_db_id}, "properties": props},
            )

        if resp:
            cost.notion_page_id = resp["id"]
            cost.notion_url = resp.get("url", "")
            cost.save(update_fields=["notion_page_id", "notion_url"])
        return cost
