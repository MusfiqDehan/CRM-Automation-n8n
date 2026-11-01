from __future__ import annotations

import base64
from datetime import date, timedelta
from decimal import Decimal
import pytest
from rest_framework.test import APIClient
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
from crm.services.cost_processor import CostAutomationProcessor
from crm.services.llm_extractor import InvoiceExtractorService, generate_sample_invoice_pdf
from crm.services.notion_provisioner import NotionProvisionerService


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def seeded_db(db):
    service = NotionProvisionerService(api_key="")
    service.seed_local_database()
    return service


@pytest.mark.django_db
def test_base_model_uuid_and_timestamps(seeded_db):
    contact = Contact.objects.first()
    assert contact is not None
    assert contact.id is not None
    assert contact.created_at is not None
    assert contact.updated_at is not None
    assert contact.is_active is True
    assert isinstance(contact.metadata, dict)


@pytest.mark.django_db
def test_standard_response_envelope_and_cursor_pagination(api_client: APIClient, seeded_db):
    # Create extra contacts to test cursor pagination with page_size=2
    for idx in range(5):
        Contact.objects.create(
            name=f"Pagination Test Client {idx}",
            email=f"client{idx}@example.com",
            phone="+1 (415) 555-0199",
        )

    resp = api_client.get("/api/v1/contacts/?page_size=2")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert "message" in body
    data = body["data"]
    assert data["page_size"] == 2
    assert len(data["results"]) == 2
    assert data["has_next"] is True
    assert data["next_cursor"] is not None

    # Navigate to next page using cursor token
    next_cursor = data["next_cursor"]
    resp_page2 = api_client.get(f"/api/v1/contacts/?page_size=2&cursor={next_cursor}")
    assert resp_page2.status_code == 200
    body2 = resp_page2.json()
    assert body2["success"] is True
    assert body2["data"]["has_previous"] is True
    assert body2["data"]["previous_cursor"] is not None
    page1_ids = {r["id"] for r in data["results"]}
    page2_ids = {r["id"] for r in body2["data"]["results"]}
    assert page1_ids.isdisjoint(page2_ids)


@pytest.mark.django_db
def test_filtering_and_search_across_all_8_tables(api_client: APIClient, seeded_db):
    endpoints_and_queries = [
        ("/api/v1/contacts/?search=Henderson", 1),
        ("/api/v1/opportunities/?requires_kevin_review=true", 2),
        ("/api/v1/activities/?completed=false", 2),
        ("/api/v1/projects/?phase=Construction", 1),
        ("/api/v1/tasks/?priority=High", 3),
        ("/api/v1/materials/?status=Delayed+%2F+Backordered", 1),
        ("/api/v1/costs/?payment_status=Paid", 1),
        ("/api/v1/costs/?needs_clarification=true", 1),
    ]
    for url, expected_min in endpoints_and_queries:
        res = api_client.get(url)
        assert res.status_code == 200, f"Failed on {url}"
        payload = res.json()
        assert payload["success"] is True
        assert len(payload["data"]["results"]) >= expected_min, f"Expected >= {expected_min} on {url}"


@pytest.mark.django_db
def test_validation_errors_return_standardized_envelope(api_client: APIClient, seeded_db):
    # 1. Invalid negative amount on Opportunity
    bad_opp = api_client.post(
        "/api/v1/opportunities/",
        {"name": "Bad Deal", "estimated_value": "-500.00"},
        format="json",
    )
    assert bad_opp.status_code == 400
    body = bad_opp.json()
    assert body["success"] is False
    assert "errors" in body["data"]

    # 2. Invalid date ordering on ProjectCost (payment_due_date < invoice_date)
    today = date.today()
    bad_cost = api_client.post(
        "/api/v1/costs/",
        {
            "title": "Invalid Due Date Cost",
            "supplier": "Test Supplier",
            "document_reference": "INV-BAD-01",
            "amount": "1200.00",
            "invoice_date": today.isoformat(),
            "payment_due_date": (today - timedelta(days=5)).isoformat(),
        },
        format="json",
    )
    assert bad_cost.status_code == 400
    assert bad_cost.json()["success"] is False


@pytest.mark.django_db
def test_pdf_invoice_generation_and_deterministic_extraction():
    pdf_bytes = generate_sample_invoice_pdf(
        supplier="Redwood Structural Framing",
        document_reference="INV-2026-303",
        project_reference="PRJ-101 Oakridge Estate",
        amount="32450.00",
        currency="USD",
        payment_status="Unpaid",
        invoice_date="2026-10-30",
        payment_due_date="2026-11-15",
    )
    assert pdf_bytes.startswith(b"%PDF-")
    b64 = base64.b64encode(pdf_bytes).decode("ascii")

    extractor = InvoiceExtractorService()
    extracted = extractor.extract(
        email_subject="Invoice INV-2026-303 from Redwood Structural Framing",
        email_sender="billing@redwoodframing.com",
        attachment_base64=b64,
    )
    assert extracted["supplier"] == "Redwood Structural Framing"
    assert extracted["document_reference"] == "INV-2026-303"
    assert "PRJ-101" in extracted["project_reference"]
    assert extracted["amount"] == "32450.00"
    assert extracted["payment_status"] == "Unpaid"
    assert extracted["payment_due_date"] == "2026-11-15"


@pytest.mark.django_db
def test_part3_deduplication_inplace_update_and_clarification_flagging(seeded_db, monkeypatch):
    from django.core.mail.backends.smtp import EmailBackend as DjangoSMTPEmailBackend
    monkeypatch.setattr(DjangoSMTPEmailBackend, "send_messages", lambda self, msgs: len(msgs))

    processor = CostAutomationProcessor(notion_service=NotionProvisionerService(api_key=""))
    initial_count = ProjectCost.objects.count()
    initial_emails = EmailCommunicationLog.objects.count()

    # Step 1: New Unpaid Invoice
    res1 = processor.process_cost_submission(
        {
            "title": "Custom Skylight Glazing",
            "supplier": "Horizon Glass Co",
            "document_reference": "INV-2026-700",
            "project_reference": "PRJ-101",
            "amount": "15400.00",
            "currency": "USD",
            "payment_status": "Unpaid",
            "invoice_date": date.today(),
            "payment_due_date": date.today() + timedelta(days=14),
            "sync_to_notion": False,
        }
    )
    assert res1["action"] == "created_new"
    assert res1["needs_clarification"] is False
    assert ProjectCost.objects.count() == initial_count + 1
    assert EmailCommunicationLog.objects.count() == initial_emails + 1

    # Step 2: Exact Duplicate Submission -> Skipped (No new record created!)
    res2 = processor.process_cost_submission(
        {
            "title": "Custom Skylight Glazing",
            "supplier": "Horizon Glass Co",
            "document_reference": "INV-2026-700",
            "project_reference": "PRJ-101",
            "amount": "15400.00",
            "currency": "USD",
            "payment_status": "Unpaid",
            "invoice_date": date.today(),
            "payment_due_date": date.today() + timedelta(days=14),
            "sync_to_notion": False,
        }
    )
    assert res2["action"] == "duplicate_skipped"
    assert res2["duplicate_prevented"] is True
    assert ProjectCost.objects.count() == initial_count + 1
    assert res2["cost"].submission_count == 2

    # Step 3: Subsequent Update (Unpaid -> Paid) -> Updates existing record in-place!
    res3 = processor.process_cost_submission(
        {
            "title": "Custom Skylight Glazing",
            "supplier": "Horizon Glass Co",
            "document_reference": "INV-2026-700",
            "project_reference": "PRJ-101",
            "amount": "15400.00",
            "currency": "USD",
            "payment_status": "Paid",
            "invoice_date": date.today(),
            "payment_due_date": date.today() + timedelta(days=14),
            "sync_to_notion": False,
        }
    )
    assert res3["action"] == "updated_existing"
    assert ProjectCost.objects.count() == initial_count + 1
    assert res3["cost"].payment_status == "Paid"
    assert res3["cost"].submission_count == 3

    # Step 4: Ambiguous / Unmatched Project Submission -> Flagged for Clarification
    res4 = processor.process_cost_submission(
        {
            "title": "Unlabeled Site Delivery",
            "supplier": "Mystery Hauling LLC",
            "document_reference": "INV-2026-991",
            "project_reference": "Unknown Lot",
            "amount": "4200.00",
            "currency": "USD",
            "payment_status": "Unpaid",
            "invoice_date": date.today(),
            "payment_due_date": None,
            "sync_to_notion": False,
        }
    )
    assert res4["action"] == "created_new"
    assert res4["needs_clarification"] is True
    assert "Could not match project reference" in res4["cost"].clarification_notes
    assert ProjectCost.objects.count() == initial_count + 2


@pytest.mark.django_db
def test_simulator_all_5_scenarios(api_client: APIClient, seeded_db, monkeypatch):
    # Avoid external Notion and n8n network calls during unit test
    monkeypatch.setattr(NotionProvisionerService, "upsert_cost_in_notion", lambda self, cost, cfg=None: cost)
    from django.core.mail.backends.smtp import EmailBackend as DjangoSMTPEmailBackend
    monkeypatch.setattr(DjangoSMTPEmailBackend, "send_messages", lambda self, msgs: len(msgs))
    from django.conf import settings
    monkeypatch.setattr(settings, "N8N_WEBHOOK_URL", "")

    expected_actions = [
        ("1_unpaid_invoice", "created_new"),
        ("2_paid_receipt", "created_new"),
        ("3_duplicate_submission", "duplicate_skipped"),
        ("4_status_update_paid", "updated_existing"),
        ("5_flagged_clarification", "created_new"),
        ("6_field_employee_asif", "created_new"),
    ]
    for scenario_key, expected_action in expected_actions:
        resp = api_client.post(
            "/api/v1/simulator/trigger/",
            {"scenario": scenario_key},
            format="json",
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["action_taken"] == expected_action
        if scenario_key == "5_flagged_clarification":
            assert data["needs_clarification"] is True


@pytest.mark.django_db
def test_apiview_explicit_crud_and_urls(api_client: APIClient, seeded_db):
    # 1. Contact CRUD via APIView
    create_res = api_client.post(
        "/api/v1/contacts/",
        {
            "name": "APIView Test Client",
            "email": "apiview@client.com",
            "phone": "+1 (415) 555-0888",
            "contact_type": "Prospective Client",
        },
        format="json",
    )
    assert create_res.status_code == 201
    contact_id = create_res.json()["data"]["id"]

    get_res = api_client.get(f"/api/v1/contacts/{contact_id}/")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["name"] == "APIView Test Client"

    patch_res = api_client.patch(
        f"/api/v1/contacts/{contact_id}/",
        {"name": "APIView Updated Client"},
        format="json",
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["name"] == "APIView Updated Client"

    del_res = api_client.delete(f"/api/v1/contacts/{contact_id}/")
    assert del_res.status_code == 200
    assert del_res.json()["data"]["id"] == contact_id

    # Verify 404 after deletion
    not_found_res = api_client.get(f"/api/v1/contacts/{contact_id}/")
    assert not_found_res.status_code == 404

    # 2. Material Orders dual URLs (materials/ and material-orders/)
    mat_res1 = api_client.get("/api/v1/materials/")
    assert mat_res1.status_code == 200
    mat_res2 = api_client.get("/api/v1/material-orders/")
    assert mat_res2.status_code == 200

    # 3. Email Logs dual URLs (notifications/ and email-logs/)
    email_res1 = api_client.get("/api/v1/notifications/")
    assert email_res1.status_code == 200
    email_res2 = api_client.get("/api/v1/email-logs/")
    assert email_res2.status_code == 200


@pytest.mark.django_db
def test_smtp_settings_and_client_email_triggers(api_client: APIClient, seeded_db, monkeypatch):
    from django.core.mail.backends.smtp import EmailBackend as DjangoSMTPEmailBackend
    monkeypatch.setattr(DjangoSMTPEmailBackend, "send_messages", lambda self, msgs: len(msgs))

    # 1. GET active SMTP settings
    get_res = api_client.get("/api/v1/settings/smtp/")
    assert get_res.status_code == 200
    data = get_res.json()["data"]
    assert data["host"] == "smtp.gmail.com"
    assert data["port"] == 465
    assert data["password"] == ""

    # 2. UPDATE SMTP settings
    update_res = api_client.post(
        "/api/v1/settings/smtp/",
        {
            "username": "musfiq.works@gmail.com",
            "password": "testapppassword1",
            "default_from_email": "Kevin's Construction OS <musfiq.works@gmail.com>",
            "kevin_email": "musfiq.works@gmail.com",
        },
        format="json",
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["username"] == "musfiq.works@gmail.com"
    assert update_res.json()["data"]["password"] == ""
    assert update_res.json()["data"]["has_password"] is True

    # 3. Test SMTP live verification trigger
    test_res = api_client.post(
        "/api/v1/settings/smtp/test/",
        {"recipient": "musfiq.works@gmail.com"},
        format="json",
    )
    assert test_res.status_code == 200
    assert test_res.json()["data"]["status"] == "Sent via SMTP"

    # 4. Trigger client email automations (Part 3 assessment)
    client_res = api_client.post(
        "/api/v1/client-emails/trigger/",
        {
            "client_email": "musfiq.works+client1@gmail.com",
            "client_name": "Arthur & Clara Henderson",
            "project_code": "PRJ-101",
            "email_type": "milestone_update",
        },
        format="json",
    )
    assert client_res.status_code == 200
    assert client_res.json()["data"]["status"] == "Sent via SMTP"
    assert client_res.json()["data"]["client_email"] == "musfiq.works+client1@gmail.com"


@pytest.mark.django_db
def test_opportunity_patch_and_kevin_review_approval(api_client: APIClient, seeded_db):
    # 1. Locate an opportunity requiring Kevin's review
    opp = Opportunity.objects.filter(requires_kevin_review=True).first()
    assert opp is not None
    assert opp.requires_kevin_review is True

    # 2. Patch opportunity to clear review flag, advance stage, and record Kevin review notes
    patch_res = api_client.patch(
        f"/api/v1/opportunities/{opp.id}/",
        {
            "requires_kevin_review": False,
            "stage": "3. Design Agreement",
            "design_agreement_status": "Signed & Executed",
            "kevin_review_notes": "Approved for architectural phase with 10% mobilization retainer.",
        },
        format="json",
    )
    assert patch_res.status_code == 200
    body = patch_res.json()
    assert body["success"] is True
    assert body["data"]["requires_kevin_review"] is False
    assert body["data"]["stage"] == "3. Design Agreement"
    assert body["data"]["design_agreement_status"] == "Signed & Executed"
    assert "Approved for architectural phase" in body["data"]["kevin_review_notes"]

    # 3. Reload from DB and verify persistence
    opp.refresh_from_db()
    assert opp.requires_kevin_review is False
    assert opp.stage == "3. Design Agreement"
    assert opp.design_agreement_status == "Signed & Executed"




