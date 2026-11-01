from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from django.conf import settings
from django.core.mail import EmailMessage
from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from common.email_backend import AuditedEmailBackend
from crm.models import ConstructionProject, ProjectCost
from crm.services.notion_provisioner import NotionProvisionerService


class CostAutomationProcessor:
    """
    Assessment Part 3 Core Engine:
    - Links each cost record and its supporting document to the correct Construction Project in Notion
    - Tracks paid and unpaid costs, including payment due dates
    - Handles duplicate submissions and subsequent updates without counting the same cost more than once
    - Flags submissions requiring clarification or review
    - Notifies the appropriate person via Django's built-in EmailBackend when a cost is recorded or requires attention
    """

    def __init__(self, notion_service: NotionProvisionerService | None = None):
        self.notion_service = notion_service or NotionProvisionerService()

    def match_project(self, project_reference: str) -> ConstructionProject | None:
        ref = (project_reference or "").strip()
        if not ref or ref.lower() in ("unknown", "unassigned", "none", "tbd", "n/a"):
            return None

        # Try exact code match first (e.g. PRJ-101)
        code_candidate = ref.split()[0].strip(" -:,")
        project = ConstructionProject.objects.filter(
            Q(code__iexact=code_candidate) | Q(code__icontains=ref) | Q(name__icontains=ref)
        ).first()
        if project:
            return project

        for keyword in ("Oakridge", "Harborview", "Crestwood", "Sycamore", "PRJ-101", "PRJ-102", "PRJ-103", "PRJ-104"):
            if keyword.lower() in ref.lower():
                return ConstructionProject.objects.filter(
                    Q(code__icontains=keyword) | Q(name__icontains=keyword)
                ).first()
        return None

    def process_cost_submission(self, payload: dict[str, Any]) -> dict[str, Any]:
        supplier = (payload.get("supplier") or "").strip()
        doc_ref = (payload.get("document_reference") or "").strip()
        project_ref = (payload.get("project_reference") or "").strip()
        title = (payload.get("title") or "").strip()
        currency = (payload.get("currency") or "USD").upper()
        payment_status = payload.get("payment_status") or "Unpaid"
        invoice_date = payload.get("invoice_date") or date.today()
        payment_due_date = payload.get("payment_due_date")
        source_email = payload.get("source_email") or "billing@vendor.com"
        sync_to_notion = payload.get("sync_to_notion", True)

        raw_amount = payload.get("amount")
        try:
            amount = Decimal(str(raw_amount)) if raw_amount is not None else Decimal("0.00")
        except Exception:
            amount = Decimal("0.00")

        clarification_reasons: list[str] = []
        if not supplier:
            supplier = "Unidentified Vendor"
            clarification_reasons.append("Supplier name missing or unclear in submission.")
        if not doc_ref:
            doc_ref = f"UNREF-{date.today().strftime('%Y%m%d')}"
            clarification_reasons.append("Invoice/Receipt reference number missing.")
        if amount <= Decimal("0.00"):
            amount = Decimal("1.00")
            clarification_reasons.append("Invoice amount missing or zero; placeholder $1.00 recorded for review.")

        matched_project = self.match_project(project_ref)
        if not matched_project:
            clarification_reasons.append(
                f"Could not match project reference '{project_ref or 'NONE'}' to an active Construction Project."
            )

        if payment_status == "Unpaid" and not payment_due_date:
            clarification_reasons.append("Unpaid invoice submitted without an explicit Payment Due Date.")

        supporting_url = (
            payload.get("supporting_document_url")
            or f"http://localhost:8017/api/v1/docs/sample-invoice/{doc_ref}/"
        )
        if not title:
            title = f"{supplier} — {doc_ref}"

        raw_event_ts = payload.get("event_timestamp")
        event_ts = None
        if isinstance(raw_event_ts, datetime):
            event_ts = raw_event_ts
        elif isinstance(raw_event_ts, str) and raw_event_ts.strip():
            clean_ts = raw_event_ts.strip()
            if clean_ts.endswith(" UTC"):
                clean_ts = clean_ts[:-4] + "Z"
            clean_ts = clean_ts.replace(" ", "T")
            event_ts = parse_datetime(clean_ts)
        if not event_ts:
            event_ts = timezone.now()

        # Check existing cost by (supplier, document_reference) for deduplication / in-place update
        existing = ProjectCost.objects.filter(
            supplier__iexact=supplier,
            document_reference__iexact=doc_ref,
        ).first()

        action_taken = "created_new"
        if existing:
            existing.submission_count += 1
            existing.event_timestamp = event_ts
            same_amount = existing.amount == amount
            same_status = existing.payment_status == payment_status
            same_project = (existing.project_id == getattr(matched_project, "id", None)) or (
                matched_project is None
            )

            if same_amount and same_status and same_project:
                action_taken = "duplicate_skipped"
                dup_note = (
                    f"[Duplicate Submission #{existing.submission_count} Ignored] "
                    f"Identical invoice {doc_ref} ({amount} {currency}, {payment_status}) already recorded; skipped to prevent double-counting."
                )
                if dup_note not in existing.clarification_notes:
                    existing.clarification_notes = (
                        f"{existing.clarification_notes}\n{dup_note}".strip()
                    )
                existing.save()
                if sync_to_notion:
                    self.notion_service.upsert_cost_in_notion(existing)
                self._send_notification(existing, action_taken)
                return {
                    "action": action_taken,
                    "cost": existing,
                    "duplicate_prevented": True,
                    "needs_clarification": existing.needs_clarification,
                }

            # Subsequent update to existing cost (e.g., Unpaid -> Paid or revised amount)
            action_taken = "updated_existing"
            prev_status = existing.payment_status
            prev_amount = existing.amount

            if prev_amount > Decimal("0") and abs(amount - prev_amount) / prev_amount > Decimal("0.10"):
                clarification_reasons.append(
                    f"Updated invoice amount (${amount}) differs by >10% from previous amount (${prev_amount})."
                )

            existing.payment_status = payment_status
            existing.amount = amount
            existing.currency = currency
            if matched_project:
                existing.project = matched_project
            if payment_due_date:
                existing.payment_due_date = payment_due_date

            update_summary = (
                f"[Updated Submission #{existing.submission_count}] "
                f"Status: {prev_status} -> {payment_status}; Amount: ${prev_amount} -> ${amount}."
            )
            if clarification_reasons:
                existing.needs_clarification = True
                existing.clarification_notes = (
                    f"{update_summary} Flagged: {' '.join(clarification_reasons)}"
                )
            else:
                if matched_project and existing.amount > Decimal("0"):
                    existing.needs_clarification = False
                existing.clarification_notes = update_summary

            existing.save()
            if sync_to_notion:
                self.notion_service.upsert_cost_in_notion(existing)
            self._send_notification(existing, action_taken)
            return {
                "action": action_taken,
                "cost": existing,
                "duplicate_prevented": True,
                "needs_clarification": existing.needs_clarification,
            }

        # Create brand-new cost record
        needs_flag = bool(clarification_reasons)
        notes = (
            "FLAGGED FOR REVIEW: " + " ".join(clarification_reasons)
            if needs_flag
            else f"Automatically verified and linked to {matched_project.code} ({matched_project.name})."
        )
        # Determine recipient based on review flag and linked client
        try:
            from crm.models import SMTPSettings
            smtp_cfg = SMTPSettings.get_active()
            kevin_email = smtp_cfg.kevin_email or getattr(settings, "NOTIFICATION_RECIPIENT_EMAIL", "") or "ops-automation@crm.musfiqdehan.com"
        except Exception:
            kevin_email = getattr(settings, "NOTIFICATION_RECIPIENT_EMAIL", "") or "ops-automation@crm.musfiqdehan.com"

        client_email = None
        if matched_project and hasattr(matched_project, "opportunities"):
            first_opp = matched_project.opportunities.select_related("contact").first()
            if first_opp and first_opp.contact and first_opp.contact.email:
                client_email = first_opp.contact.email

        notified_recipient = (
            kevin_email
            if needs_flag
            else (client_email or "musfiq.works+client1@gmail.com")
        )

        new_cost = ProjectCost.objects.create(
            title=title,
            supplier=supplier,
            document_reference=doc_ref,
            project=matched_project,
            invoice_date=invoice_date,
            event_timestamp=event_ts,
            amount=amount,
            currency=currency,
            payment_status=payment_status,
            payment_due_date=payment_due_date,
            supporting_document_url=supporting_url,
            source_email=source_email,
            submission_count=1,
            needs_clarification=needs_flag,
            clarification_notes=notes,
            notified_person=notified_recipient,
        )
        if sync_to_notion:
            self.notion_service.upsert_cost_in_notion(new_cost)
        self._send_notification(new_cost, action_taken)
        return {
            "action": action_taken,
            "cost": new_cost,
            "duplicate_prevented": False,
            "needs_clarification": new_cost.needs_clarification,
        }

    def _send_notification(self, cost: ProjectCost, action: str) -> None:
        """Dispatches notification via Django's built-in EmailMessage (AuditedEmailBackend)."""
        project_label = (
            f"{cost.project.code} ({cost.project.name})"
            if cost.project
            else "UNMATCHED PROJECT (Requires Review)"
        )
        if cost.needs_clarification:
            subject = f"[ACTION REQUIRED] Flagged Construction Cost: {cost.document_reference} ({cost.supplier})"
        elif action == "duplicate_skipped":
            subject = f"[DUPLICATE BLOCKED] Invoice {cost.document_reference} ({cost.supplier}) Ignored"
        elif action == "updated_existing":
            subject = f"[COST UPDATED] {cost.document_reference} ({cost.supplier}) -> {cost.payment_status}"
        else:
            subject = f"[COST RECORDED] {cost.document_reference} ({cost.supplier}) - ${cost.amount} {cost.currency}"

        body = (
            f"Construction Cost Automation Notification\n"
            f"=========================================\n"
            f"Action Taken: {action}\n"
            f"Supplier: {cost.supplier}\n"
            f"Document Reference: {cost.document_reference}\n"
            f"Project: {project_label}\n"
            f"Amount: ${cost.amount} {cost.currency}\n"
            f"Payment Status: {cost.payment_status}\n"
            f"Payment Due Date: {cost.payment_due_date or 'N/A'}\n"
            f"Needs Clarification / Review: {'YES' if cost.needs_clarification else 'No'}\n"
            f"Notes: {cost.clarification_notes}\n"
            f"Supporting Document: {cost.supporting_document_url}\n"
            f"Notion Record URL: {cost.notion_url or 'Synced to Notion Costs DB'}\n"
        )

        from_addr = getattr(settings, "DEFAULT_FROM_EMAIL", "Kevin's Construction OS <ops-automation@crm.musfiqdehan.com>")
        to_addr = cost.notified_person
        try:
            from crm.models import SMTPSettings
            smtp_cfg = SMTPSettings.get_active()
            if smtp_cfg.default_from_email:
                from_addr = smtp_cfg.default_from_email
            if not to_addr:
                to_addr = smtp_cfg.kevin_email or getattr(settings, "NOTIFICATION_RECIPIENT_EMAIL", "") or "ops-automation@crm.musfiqdehan.com"
        except Exception:
            if not to_addr:
                to_addr = getattr(settings, "NOTIFICATION_RECIPIENT_EMAIL", "") or "ops-automation@crm.musfiqdehan.com"

        msg = EmailMessage(
            subject=subject,
            body=body,
            from_email=from_addr,
            to=[to_addr],
            headers={
                "X-Direction": "Outbound Alert",
                "X-Related-Cost-Id": str(cost.id),
            },
        )
        AuditedEmailBackend().send_messages([msg])
