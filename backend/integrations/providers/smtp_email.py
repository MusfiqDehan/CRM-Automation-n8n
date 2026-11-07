from __future__ import annotations

import smtplib
from typing import Any
from django.conf import settings
from django.core.mail import send_mail
from integrations.providers.base import BaseIntegrationProvider, FieldSchema
from integrations.providers.registry import register_provider


@register_provider
class SMTPEmailProvider(BaseIntegrationProvider):
    provider_key = "smtp_email"
    name = "Custom SMTP Email Server"
    category = "communication"
    description = (
        "Outbound email delivery for executive threshold alerts, vendor invoice clarifications, "
        "team invitations, and client milestone updates via Gmail, SES, SendGrid, or custom SMTP."
    )
    icon_name = "Mail"
    docs_url = "https://support.google.com/accounts/answer/185833"
    feature_flag_key = "sub_integration_smtp"
    supports_platform_fallback = True
    supports_tenant_byoc = True
    supports_webhooks = False

    credential_schema = [
        FieldSchema(
            key="username",
            label="SMTP Username / Email",
            field_type="text",
            required=False,
            placeholder="ops-automation@yourdomain.com",
            help_text="SMTP authentication username or email address.",
        ),
        FieldSchema(
            key="password",
            label="SMTP Password / App Password",
            field_type="secret",
            required=False,
            placeholder="•••• •••• •••• ••••",
            help_text="16-character Gmail App Password or SMTP server secret. Encrypted at rest.",
        ),
    ]

    config_schema = [
        FieldSchema(
            key="host",
            label="SMTP Host",
            field_type="text",
            required=True,
            default="smtp.gmail.com",
            placeholder="smtp.gmail.com",
            help_text="Outbound mail server hostname (e.g., smtp.gmail.com, email-smtp.us-east-1.amazonaws.com).",
        ),
        FieldSchema(
            key="port",
            label="SMTP Port",
            field_type="number",
            required=True,
            default=465,
            placeholder="465",
            help_text="Use 465 for SSL or 587 for STARTTLS.",
        ),
        FieldSchema(
            key="use_ssl",
            label="Use Implicit SSL/TLS (Port 465)",
            field_type="boolean",
            required=False,
            default=True,
            help_text="Enable for port 465. Disable if using STARTTLS on port 587.",
        ),
        FieldSchema(
            key="use_tls",
            label="Use STARTTLS (Port 587)",
            field_type="boolean",
            required=False,
            default=False,
            help_text="Enable for port 587. Cannot be enabled simultaneously with SSL.",
        ),
        FieldSchema(
            key="default_from_email",
            label="Default From Address",
            field_type="text",
            required=False,
            default="Kevin's Construction OS <ops-automation@crm.musfiqdehan.com>",
            placeholder="Kevin's Construction OS <ops@yourdomain.com>",
            help_text="Sender display name and email address shown on outbound emails.",
        ),
        FieldSchema(
            key="kevin_email",
            label="Executive Alert Recipient Email",
            field_type="email",
            required=False,
            default="",
            placeholder="kevin@kevinconstruction.com",
            help_text="Recipient email for high-value deal alerts and flagged invoice reviews.",
        ),
    ]

    supported_actions = [
        {
            "action": "send_test_email",
            "label": "Send Live Test Email",
            "description": "Authenticates with the SMTP server and dispatches a verification email.",
        }
    ]

    @classmethod
    def get_default_platform_credentials(cls) -> dict[str, Any]:
        return {
            "username": getattr(settings, "SMTP_USER", "") or "",
            "password": getattr(settings, "SMTP_PASSWORD", "") or "",
        }

    @classmethod
    def get_default_platform_config(cls) -> dict[str, Any]:
        return {
            "host": getattr(settings, "SMTP_HOST", "smtp.gmail.com") or "smtp.gmail.com",
            "port": int(getattr(settings, "SMTP_PORT", 465) or 465),
            "use_ssl": bool(getattr(settings, "SMTP_USE_SSL", True)),
            "use_tls": bool(getattr(settings, "SMTP_USE_TLS", False)),
            "default_from_email": getattr(settings, "DEFAULT_FROM_EMAIL", "") or "",
            "kevin_email": getattr(settings, "NOTIFICATION_RECIPIENT_EMAIL", "") or "",
        }

    @classmethod
    def get_default_tenant_config(cls) -> dict[str, Any]:
        return cls.get_default_platform_config()

    def test_connection(
        self,
        credentials: dict[str, Any],
        config: dict[str, Any],
        organization: Any = None,
    ) -> tuple[bool, str, dict[str, Any]]:
        host = str(config.get("host") or "smtp.gmail.com").strip()
        port = int(config.get("port") or 465)
        use_ssl = bool(config.get("use_ssl", True))
        use_tls = bool(config.get("use_tls", False))
        if use_ssl and use_tls:
            use_tls = False

        username = str(credentials.get("username") or "").strip()
        password = str(credentials.get("password") or "").strip()

        if not username or not password:
            return (
                True,
                f"SMTP configured in local audit-log fallback mode ({host}:{port}). Add SMTP username & password for live external relay.",
                {"mode": "audit_fallback", "host": host, "port": port},
            )

        try:
            if use_ssl:
                server = smtplib.SMTP_SSL(host, port, timeout=10)
            else:
                server = smtplib.SMTP(host, port, timeout=10)
                if use_tls:
                    server.starttls()
            server.login(username, password)
            server.quit()
            return (
                True,
                f"Successfully authenticated with {host}:{port} as {username}.",
                {"mode": "live_smtp", "host": host, "port": port, "username": username},
            )
        except Exception as exc:
            return False, f"SMTP authentication failed on {host}:{port}: {exc}", {}

    def execute_action(
        self,
        action: str,
        payload: dict[str, Any],
        credentials: dict[str, Any],
        config: dict[str, Any],
        organization: Any = None,
    ) -> tuple[bool, str, dict[str, Any]]:
        if action == "send_test_email":
            recipient = (
                str(payload.get("recipient") or "").strip()
                or str(config.get("kevin_email") or "").strip()
                or (organization.executive_recipient_email if organization else "")
                or str(credentials.get("username") or "").strip()
                or "kevin@kevinconstruction.com"
            )
            from_email = (
                str(config.get("default_from_email") or "").strip()
                or str(credentials.get("username") or "").strip()
                or "ops-automation@crm.musfiqdehan.com"
            )
            send_mail(
                subject="[Beamline Integration Test] SMTP Verification Successful",
                message=(
                    f"This is a verification email from Beamline Integrations Engine.\n"
                    f"SMTP Host: {config.get('host', 'smtp.gmail.com')}:{config.get('port', 465)}\n"
                    f"Recipient: {recipient}"
                ),
                from_email=from_email,
                recipient_list=[recipient],
                fail_silently=False,
            )
            return (
                True,
                f"Verification email dispatched to {recipient}.",
                {"recipient": recipient, "from_email": from_email},
            )
        return super().execute_action(action, payload, credentials, config, organization)

