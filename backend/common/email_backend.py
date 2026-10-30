from __future__ import annotations

import logging
from typing import Iterable
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail.backends.smtp import EmailBackend as DjangoSMTPEmailBackend
from django.core.mail.message import EmailMessage

logger = logging.getLogger(__name__)


class AuditedEmailBackend(BaseEmailBackend):
    """
    Built-in Django EmailBackend extension that persists every sent email into
    EmailCommunicationLog for live UI inspection and optionally relays over SMTP.
    """

    def send_messages(self, email_messages: Iterable[EmailMessage]) -> int:
        if not email_messages:
            return 0

        from crm.models import EmailCommunicationLog

        sent_count = 0
        smtp_backend = None
        if getattr(settings, "SMTP_HOST", ""):
            smtp_backend = DjangoSMTPEmailBackend(
                host=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=settings.SMTP_USE_TLS,
            )

        for msg in email_messages:
            recipient_str = ", ".join(msg.to) if msg.to else settings.NOTIFICATION_RECIPIENT_EMAIL
            attachment_names = []
            for att in getattr(msg, "attachments", []) or []:
                if isinstance(att, tuple) and len(att) >= 1:
                    attachment_names.append(str(att[0]))

            status_val = "Sent"
            if smtp_backend:
                try:
                    smtp_backend.send_messages([msg])
                except Exception as exc:
                    logger.warning("SMTP relay failed, recorded in local audit log: %s", exc)
                    status_val = "Logged (Local)"

            custom_headers = getattr(msg, "extra_headers", {}) or {}
            direction = custom_headers.get("X-Direction", "Outbound Alert")
            related_cost_id = custom_headers.get("X-Related-Cost-Id")

            log_kwargs = {
                "subject": msg.subject[:255],
                "sender": (msg.from_email or settings.DEFAULT_FROM_EMAIL)[:255],
                "recipient": recipient_str[:255],
                "direction": direction,
                "status": status_val,
                "body_preview": (msg.body or "")[:2000],
                "attachment_name": ", ".join(attachment_names)[:255],
            }
            if related_cost_id:
                log_kwargs["related_cost_id"] = related_cost_id

            EmailCommunicationLog.objects.create(**log_kwargs)
            sent_count += 1

        return sent_count
