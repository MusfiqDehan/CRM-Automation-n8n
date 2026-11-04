from __future__ import annotations

from typing import Any
from django.conf import settings
from integrations.providers.base import BaseIntegrationProvider, FieldSchema
from integrations.providers.registry import register_provider


@register_provider
class GoogleOAuthProvider(BaseIntegrationProvider):
    provider_key = "google_oauth"
    name = "Google OAuth 2.0"
    category = "identity"
    description = (
        "Single Sign-On (SSO) with Google Workspace and consumer Google accounts. "
        "Supports platform-wide fallback SSO or white-labeled custom tenant OAuth clients."
    )
    icon_name = "KeyRound"
    docs_url = "https://console.cloud.google.com/apis/credentials"
    feature_flag_key = "sub_custom_google_oauth"
    supports_platform_fallback = True
    supports_tenant_byoc = True
    supports_webhooks = False

    credential_schema = [
        FieldSchema(
            key="client_id",
            label="Google OAuth Client ID",
            field_type="text",
            required=True,
            placeholder="1234567890-abcdef.apps.googleusercontent.com",
            help_text="OAuth 2.0 Web Application Client ID from Google Cloud Console.",
        ),
        FieldSchema(
            key="client_secret",
            label="Google OAuth Client Secret",
            field_type="secret",
            required=False,
            placeholder="GOCSPX-••••••••••••••••••••",
            help_text="Encrypted at rest. Leave blank when editing to keep your existing secret.",
        ),
    ]

    config_schema = [
        FieldSchema(
            key="allowed_hosted_domains",
            label="Allowed Hosted Domains (Optional)",
            field_type="text",
            required=False,
            default="",
            placeholder="kevinconstruction.com, apexbuilders.com",
            help_text="Comma-separated Google Workspace domains allowed to sign in (leave empty to allow any invited email).",
        ),
        FieldSchema(
            key="enforce_audience_check",
            label="Enforce Strict Audience (aud) Check",
            field_type="boolean",
            required=False,
            default=False,
            help_text="Reject ID tokens whose audience does not strictly match the configured Client ID.",
        ),
    ]

    @classmethod
    def get_default_platform_credentials(cls) -> dict[str, Any]:
        return {
            "client_id": getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "") or "",
            "client_secret": getattr(settings, "GOOGLE_OAUTH_CLIENT_SECRET", "") or "",
        }

    @classmethod
    def get_default_platform_config(cls) -> dict[str, Any]:
        return {
            "allowed_hosted_domains": "",
            "enforce_audience_check": bool(
                getattr(settings, "ENFORCE_GOOGLE_AUDIENCE_CHECK", False)
            ),
        }

    def test_connection(
        self,
        credentials: dict[str, Any],
        config: dict[str, Any],
        organization: Any = None,
    ) -> tuple[bool, str, dict[str, Any]]:
        client_id = str(credentials.get("client_id") or "").strip()
        if not client_id:
            return False, "Google OAuth Client ID is required.", {}
        if len(client_id) < 8:
            return False, "Google OAuth Client ID appears malformed.", {}
        return (
            True,
            f"Google OAuth Client ID ({client_id[:24]}...) is configured and ready for SSO verification.",
            {
                "client_id": client_id,
                "has_client_secret": bool(str(credentials.get("client_secret") or "").strip()),
            },
        )

