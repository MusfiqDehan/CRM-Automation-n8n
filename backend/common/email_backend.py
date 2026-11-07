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
        from integrations.services.resolver import IntegrationResolver

        sent_count = 0
        smtp_backend = None
        smtp_state: dict = {}
        try:
            smtp_state = IntegrationResolver.get_smtp_state()
        except Exception:
            smtp_state = {}

        host = (smtp_state.get("host") or getattr(settings, "SMTP_HOST", "")) or "smtp.gmail.com"
        port = int(smtp_state.get("port") or getattr(settings, "SMTP_PORT", 465))
        user = (smtp_state.get("username") or getattr(settings, "SMTP_USER", ""))
        raw_pw = (smtp_state.get("password") or getattr(settings, "SMTP_PASSWORD", ""))
        pw = (raw_pw or "").replace(" ", "")
        use_ssl = bool(
            smtp_state["use_ssl"]
            if "use_ssl" in smtp_state
            else getattr(settings, "SMTP_USE_SSL", True)
        )
        use_tls = bool(
            smtp_state["use_tls"]
            if "use_tls" in smtp_state
            else getattr(settings, "SMTP_USE_TLS", False)
        )
        default_from = (
            (smtp_state.get("default_from_email") or getattr(settings, "DEFAULT_FROM_EMAIL", ""))
            or user
            or "ops-automation@crm.musfiqdehan.com"
        )
        fallback_to = (
            (smtp_state.get("kevin_email") or getattr(settings, "NOTIFICATION_RECIPIENT_EMAIL", ""))
            or user
            or "ops-automation@crm.musfiqdehan.com"
        )

        if host and user and pw:
            try:
                smtp_backend = DjangoSMTPEmailBackend(
                    host=host,
                    port=port,
                    username=user,
                    password=pw,
                    use_ssl=use_ssl,
                    use_tls=use_tls,
                    timeout=15,
                    alias="smtp",
                )
            except Exception as e:
                logger.warning("Failed to initialize SMTP backend: %s", e)

        for msg in email_messages:
            if not msg.from_email:
                msg.from_email = default_from
            if not msg.to:
                msg.to = [fallback_to]

            recipient_str = ", ".join(msg.to)
            attachment_names = []
            for att in getattr(msg, "attachments", []) or []:
                if isinstance(att, tuple) and len(att) >= 1:
                    attachment_names.append(str(att[0]))

            status_val = "Logged (Local)"
            if smtp_backend:
                try:
                    smtp_backend.send_messages([msg])
                    status_val = "Sent via SMTP"
                except Exception as exc:
                    logger.warning("SMTP relay failed: %s", exc)
                    status_val = f"Failed ({exc.__class__.__name__})"

            custom_headers = getattr(msg, "extra_headers", {}) or {}
            direction = custom_headers.get("X-Direction", "Outbound Alert")
            related_cost_id = custom_headers.get("X-Related-Cost-Id")

            log_kwargs = {
                "subject": msg.subject[:255],
                "sender": (msg.from_email or default_from)[:255],
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
