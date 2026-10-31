from __future__ import annotations

import base64
import io
import json
import logging
import re
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from typing import Any
import httpx
from django.conf import settings
from fpdf import FPDF
from pypdf import PdfReader

logger = logging.getLogger(__name__)


def generate_sample_invoice_pdf(
    supplier: str,
    document_reference: str,
    project_reference: str,
    amount: str | float | Decimal,
    currency: str = "USD",
    payment_status: str = "Unpaid",
    invoice_date: str | None = None,
    payment_due_date: str | None = None,
    description: str = "Construction Subcontractor / Material Progress Billing",
    generated_datetime: str | None = None,
) -> bytes:
    """Generates a valid binary PDF invoice/receipt with exact generation second for testing and live demonstration."""
    inv_date = invoice_date or date.today().isoformat()
    due_date = payment_due_date or (date.today() + timedelta(days=14)).isoformat()
    gen_time = generated_datetime or datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, f"INVOICE / RECEIPT: {document_reference}", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 11)
    lines = [
        f"Supplier: {supplier}",
        f"Document Reference: {document_reference}",
        f"Construction Project: {project_reference}",
        f"Invoice Date: {inv_date}",
        f"Generated / Recorded At: {gen_time}",
        f"Amount: {amount} {currency}",
        f"Currency: {currency}",
        f"Payment Status: {payment_status}",
        f"Payment Due Date: {due_date}",
        f"Description: {description}",
    ]
    for line in lines:
        pdf.cell(0, 8, line, new_x="LMARGIN", new_y="NEXT")

    return bytes(pdf.output())


class InvoiceExtractorService:
    """
    Two-tier invoice & receipt extractor:
    - Tier 1 (Default, Deterministic): Extracts text from PDF bytes via pypdf + email body/subject
      and parses structured cost fields using deterministic patterns.
    - Tier 2 (Optional LLM Hook): Enriches/verifies fields via OpenAI, Gemini, or DeepSeek if configured.
    """

    def extract_pdf_text(self, attachment_base64: str) -> str:
        if not attachment_base64:
            return ""
        try:
            raw = attachment_base64
            if "," in raw and raw.strip().startswith("data:"):
                raw = raw.split(",", 1)[1]
            pdf_bytes = base64.b64decode(raw)
            if not pdf_bytes.startswith(b"%PDF-"):
                return pdf_bytes.decode("utf-8", errors="ignore")
            reader = PdfReader(io.BytesIO(pdf_bytes))
            pages_text = [page.extract_text() or "" for page in reader.pages]
            return "\n".join(pages_text)
        except Exception as exc:
            logger.warning("PDF text extraction warning: %s", exc)
            return ""

    def parse_deterministically(
        self,
        email_subject: str,
        email_sender: str,
        email_body: str,
        pdf_text: str,
    ) -> dict[str, Any]:
        combined = "\n".join(filter(None, [pdf_text, email_body, email_subject]))

        def _match(patterns: list[str], default: str = "") -> str:
            for pat in patterns:
                m = re.search(pat, combined, re.IGNORECASE | re.MULTILINE)
                if m:
                    return m.group(1).strip()
            return default

        supplier = _match(
            [
                r"Supplier\s*:\s*([^\n\r]+)",
                r"Vendor\s*:\s*([^\n\r]+)",
                r"From\s*:\s*([^\n\r<]+)",
            ],
            default="",
        )
        if not supplier and email_sender and "@" in email_sender:
            domain_part = email_sender.split("@")[1].split(".")[0]
            supplier = domain_part.replace("-", " ").title() + " Supply"

        doc_ref = _match(
            [
                r"Document Reference\s*:\s*([A-Z0-9\-_]+)",
                r"Invoice\s*(?:#|No\.?|Reference)?\s*:\s*([A-Z0-9\-_]+)",
                r"\b((?:INV|REC|PO)-\d{4}-\d{3,6})\b",
            ],
            default="",
        )

        project_ref = _match(
            [
                r"Construction Project\s*:\s*([^\n\r]+)",
                r"Project\s*:\s*([^\n\r]+)",
                r"\b(PRJ-\d{3})\b",
                r"\b(Oakridge|Harborview|Crestwood|Sycamore)\b",
            ],
            default="",
        )

        inv_date = _match(
            [
                r"Invoice Date\s*:\s*(\d{4}-\d{2}-\d{2})",
                r"Date\s*:\s*(\d{4}-\d{2}-\d{2})",
            ],
            default=date.today().isoformat(),
        )

        due_date = _match(
            [
                r"Payment Due Date\s*:\s*(\d{4}-\d{2}-\d{2})",
                r"Due Date\s*:\s*(\d{4}-\d{2}-\d{2})",
            ],
            default="",
        )

        currency = _match(
            [
                r"Currency\s*:\s*(USD|CAD|EUR|GBP)",
                r"\b(USD|CAD|EUR|GBP)\b",
            ],
            default="USD",
        ).upper()

        amount_raw = _match(
            [
                r"Amount\s*:\s*\$?\s*([0-9,]+(?:\.\d{1,2})?)",
                r"Total\s*:\s*\$?\s*([0-9,]+(?:\.\d{1,2})?)",
                r"\$\s*([0-9,]+(?:\.\d{1,2})?)",
            ],
            default="0.00",
        ).replace(",", "")

        try:
            amount_val = str(Decimal(amount_raw))
        except (InvalidOperation, ValueError):
            amount_val = "0.00"

        status_raw = _match(
            [
                r"Payment Status\s*:\s*(Paid|Unpaid|Partially Paid)",
                r"Status\s*:\s*(Paid|Unpaid|Partially Paid)",
            ],
            default="",
        )
        if not status_raw:
            if re.search(r"\b(?:PAID IN FULL|RECEIPT - PAID|STATUS:\s*PAID)\b", combined, re.I):
                status_raw = "Paid"
            else:
                status_raw = "Unpaid"
        else:
            status_raw = status_raw.title()

        event_timestamp = _match(
            [
                r"Generated\s*(?:/\s*Recorded)?\s*At\s*:\s*([0-9]{4}-[0-9]{2}-[0-9]{2}\s+[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\s+[A-Z]+)?)",
                r"Timestamp\s*:\s*([0-9]{4}-[0-9]{2}-[0-9]{2}[T\s][0-9]{2}:[0-9]{2}:[0-9]{2})",
            ],
            default="",
        )
        if event_timestamp:
            ts_clean = event_timestamp.strip()
            if ts_clean.endswith(" UTC"):
                ts_clean = ts_clean[:-4] + "Z"
            ts_clean = ts_clean.replace(" ", "T")
            event_timestamp = ts_clean
        else:
            event_timestamp = datetime.now(timezone.utc).isoformat()

        description = _match(
            [r"Description\s*:\s*([^\n\r]+)"],
            default=email_subject or f"Invoice {doc_ref} from {supplier}",
        )

        return {
            "title": description[:220],
            "supplier": supplier[:180],
            "document_reference": doc_ref[:100],
            "project_reference": project_ref[:220],
            "invoice_date": inv_date or None,
            "event_timestamp": event_timestamp or datetime.now(timezone.utc).isoformat(),
            "amount": amount_val,
            "currency": currency if currency in ("USD", "CAD", "EUR", "GBP") else "USD",
            "payment_status": status_raw if status_raw in ("Paid", "Unpaid", "Partially Paid") else "Unpaid",
            "payment_due_date": due_date or None,
            "source_email": email_sender or "vendor@supplier.com",
            "extraction_engine": "deterministic_pypdf_regex",
        }

    def call_optional_llm(
        self,
        combined_text: str,
        fallback_result: dict[str, Any],
        requested_provider: str = "auto",
    ) -> dict[str, Any]:
        """
        Optional LLM hook supporting OpenAI, Gemini, or DeepSeek if API keys are present.
        Falls back cleanly to deterministic output if no keys are configured.
        """
        if requested_provider == "deterministic":
            return fallback_result

        openai_key = getattr(settings, "OPENAI_API_KEY", "")
        gemini_key = getattr(settings, "GEMINI_API_KEY", "")
        deepseek_key = getattr(settings, "DEEPSEEK_API_KEY", "")

        provider = requested_provider
        if provider == "auto":
            if openai_key:
                provider = "openai"
            elif gemini_key:
                provider = "gemini"
            elif deepseek_key:
                provider = "deepseek"
            else:
                return fallback_result

        prompt = (
            "Extract construction invoice details as JSON with keys: "
            "title, supplier, document_reference, project_reference, invoice_date (YYYY-MM-DD), "
            "amount (numeric string), currency (USD|CAD|EUR|GBP), payment_status (Paid|Unpaid|Partially Paid), "
            "payment_due_date (YYYY-MM-DD or null).\n\nText:\n" + combined_text[:3500]
        )

        try:
            if provider == "openai" and openai_key:
                with httpx.Client(timeout=15.0) as client:
                    r = client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {openai_key}"},
                        json={
                            "model": getattr(settings, "OPENAI_MODEL", "gpt-4o-mini"),
                            "response_format": {"type": "json_object"},
                            "messages": [{"role": "user", "content": prompt}],
                        },
                    )
                    if r.status_code == 200:
                        parsed = json.loads(r.json()["choices"][0]["message"]["content"])
                        return {**fallback_result, **parsed, "extraction_engine": "openai"}

            if provider == "deepseek" and deepseek_key:
                with httpx.Client(timeout=15.0) as client:
                    r = client.post(
                        "https://api.deepseek.com/chat/completions",
                        headers={"Authorization": f"Bearer {deepseek_key}"},
                        json={
                            "model": getattr(settings, "DEEPSEEK_MODEL", "deepseek-chat"),
                            "response_format": {"type": "json_object"},
                            "messages": [{"role": "user", "content": prompt}],
                        },
                    )
                    if r.status_code == 200:
                        parsed = json.loads(r.json()["choices"][0]["message"]["content"])
                        return {**fallback_result, **parsed, "extraction_engine": "deepseek"}

            if provider == "gemini" and gemini_key:
                model = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")
                with httpx.Client(timeout=15.0) as client:
                    r = client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}",
                        json={
                            "contents": [{"parts": [{"text": prompt}]}],
                            "generationConfig": {"responseMimeType": "application/json"},
                        },
                    )
                    if r.status_code == 200:
                        text_out = r.json()["candidates"][0]["content"]["parts"][0]["text"]
                        parsed = json.loads(text_out)
                        return {**fallback_result, **parsed, "extraction_engine": "gemini"}
        except Exception as exc:
            logger.warning("Optional LLM provider (%s) fallback to deterministic: %s", provider, exc)

        return fallback_result

    def extract(
        self,
        email_subject: str = "",
        email_sender: str = "billing@vendor.com",
        email_body: str = "",
        attachment_base64: str = "",
        llm_provider: str = "auto",
    ) -> dict[str, Any]:
        pdf_text = self.extract_pdf_text(attachment_base64)
        base = self.parse_deterministically(email_subject, email_sender, email_body, pdf_text)
        combined = "\n".join(filter(None, [pdf_text, email_body, email_subject]))
        return self.call_optional_llm(combined, base, requested_provider=llm_provider)

