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

        from crm.models import EmailCommunicationLog, SMTPSettings

        sent_count = 0
        smtp_backend = None
        smtp_cfg = None
        try:
            smtp_cfg = SMTPSettings.get_active()
        except Exception:
            smtp_cfg = None

        host = (smtp_cfg.host if smtp_cfg and smtp_cfg.host else getattr(settings, "SMTP_HOST", "")) or "smtp.gmail.com"
        port = int(smtp_cfg.port if smtp_cfg and smtp_cfg.port else getattr(settings, "SMTP_PORT", 465))
        user = (smtp_cfg.username if smtp_cfg and smtp_cfg.username else getattr(settings, "SMTP_USER", ""))
        raw_pw = (smtp_cfg.password if smtp_cfg and smtp_cfg.password else getattr(settings, "SMTP_PASSWORD", ""))
        pw = (raw_pw or "").replace(" ", "")
        use_ssl = bool(smtp_cfg.use_ssl if smtp_cfg and smtp_cfg.use_ssl is not None else getattr(settings, "SMTP_USE_SSL", True))
        use_tls = bool(smtp_cfg.use_tls if smtp_cfg and smtp_cfg.use_tls is not None else getattr(settings, "SMTP_USE_TLS", False))
        default_from = (
            (smtp_cfg.default_from_email if smtp_cfg and smtp_cfg.default_from_email else getattr(settings, "DEFAULT_FROM_EMAIL", ""))
            or user
            or "ops-automation@crm.musfiqdehan.com"
        )
        fallback_to = (
            (smtp_cfg.kevin_email if smtp_cfg and smtp_cfg.kevin_email else getattr(settings, "NOTIFICATION_RECIPIENT_EMAIL", ""))
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
