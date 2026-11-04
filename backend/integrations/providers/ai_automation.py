from __future__ import annotations

from typing import Any
from django.conf import settings
from integrations.providers.base import BaseIntegrationProvider, FieldSchema
from integrations.providers.registry import register_provider


@register_provider
class OpenAIProvider(BaseIntegrationProvider):
    provider_key = "openai"
    name = "OpenAI GPT Extractor"
    category = "ai_automation"
    description = (
        "AI-powered PDF invoice & receipt extraction using OpenAI GPT-4o / GPT-4o-mini "
        "with structured JSON schema verification."
    )
    icon_name = "Sparkles"
    docs_url = "https://platform.openai.com/api-keys"
    feature_flag_key = "sub_automation_invoices"
    supports_platform_fallback = True
    supports_tenant_byoc = True

    credential_schema = [
        FieldSchema(
            key="api_key",
            label="OpenAI API Key",
            field_type="secret",
            required=True,
            placeholder="sk-proj-••••••••••••••••••••••••••••••••",
            help_text="OpenAI API secret key. Encrypted at rest.",
        ),
    ]

    config_schema = [
        FieldSchema(
            key="model",
            label="Default Model",
            field_type="text",
            required=False,
            default="gpt-4o-mini",
            placeholder="gpt-4o-mini",
            help_text="Model identifier used for structured invoice extraction.",
        ),
    ]

    @classmethod
    def get_default_platform_credentials(cls) -> dict[str, Any]:
        return {"api_key": getattr(settings, "OPENAI_API_KEY", "") or ""}

    @classmethod
    def get_default_platform_config(cls) -> dict[str, Any]:
        return {"model": getattr(settings, "OPENAI_MODEL", "gpt-4o-mini") or "gpt-4o-mini"}


@register_provider
class GeminiProvider(BaseIntegrationProvider):
    provider_key = "gemini"
    name = "Google Gemini AI"
    category = "ai_automation"
    description = (
        "Multimodal document and subcontractor invoice extraction powered by Google Gemini 2.5 Flash / Pro."
    )
    icon_name = "Bot"
    docs_url = "https://aistudio.google.com/app/apikey"
    feature_flag_key = "sub_automation_invoices"
    supports_platform_fallback = True
    supports_tenant_byoc = True

    credential_schema = [
        FieldSchema(
            key="api_key",
            label="Google Gemini API Key",
            field_type="secret",
            required=True,
            placeholder="AIzaSy••••••••••••••••••••••••••••••",
            help_text="Google AI Studio API Key. Encrypted at rest.",
        ),
    ]

    config_schema = [
        FieldSchema(
            key="model",
            label="Default Gemini Model",
            field_type="text",
            required=False,
            default="gemini-2.5-flash",
            placeholder="gemini-2.5-flash",
            help_text="Gemini model used for structured JSON extraction.",
        ),
    ]

    @classmethod
    def get_default_platform_credentials(cls) -> dict[str, Any]:
        return {"api_key": getattr(settings, "GEMINI_API_KEY", "") or ""}

    @classmethod
    def get_default_platform_config(cls) -> dict[str, Any]:
        return {"model": getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash") or "gemini-2.5-flash"}


@register_provider
class DeepSeekProvider(BaseIntegrationProvider):
    provider_key = "deepseek"
    name = "DeepSeek AI"
    category = "ai_automation"
    description = (
        "High-efficiency reasoning & financial invoice extraction via DeepSeek V3 / R1 API."
    )
    icon_name = "Cpu"
    docs_url = "https://platform.deepseek.com/api_keys"
    feature_flag_key = "sub_automation_invoices"
    supports_platform_fallback = True
    supports_tenant_byoc = True

    credential_schema = [
        FieldSchema(
            key="api_key",
            label="DeepSeek API Key",
            field_type="secret",
            required=True,
            placeholder="sk-••••••••••••••••••••••••••••••••",
            help_text="DeepSeek API key. Encrypted at rest.",
        ),
    ]

    config_schema = [
        FieldSchema(
            key="model",
            label="Default DeepSeek Model",
            field_type="text",
            required=False,
            default="deepseek-chat",
            placeholder="deepseek-chat",
        ),
    ]

    @classmethod
    def get_default_platform_credentials(cls) -> dict[str, Any]:
        return {"api_key": getattr(settings, "DEEPSEEK_API_KEY", "") or ""}

    @classmethod
    def get_default_platform_config(cls) -> dict[str, Any]:
        return {"model": getattr(settings, "DEEPSEEK_MODEL", "deepseek-chat") or "deepseek-chat"}


@register_provider
class N8NWebhookProvider(BaseIntegrationProvider):
    provider_key = "n8n_webhook"
    name = "n8n Workflow Automation"
    category = "ai_automation"
    description = (
        "Connects inbound/outbound construction cost pipelines, email triggers, and custom "
        "orchestration workflows via n8n webhooks."
    )
    icon_name = "Workflow"
    docs_url = "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/"
    feature_flag_key = "sub_automation_simulator"
    supports_platform_fallback = True
    supports_tenant_byoc = True
    supports_webhooks = True

    credential_schema = [
        FieldSchema(
            key="auth_header_token",
            label="Webhook Secret / Bearer Token (Optional)",
            field_type="secret",
            required=False,
            placeholder="n8n_sec_••••••••••••••••••••••••",
            help_text="Optional shared secret sent in the X-Webhook-Secret or Authorization header.",
        ),
    ]

    config_schema = [
        FieldSchema(
            key="webhook_url",
            label="n8n Webhook Endpoint URL",
            field_type="url",
            required=True,
            default="http://n8n:5678/webhook/construction-cost-intake",
            placeholder="https://n8n.yourdomain.com/webhook/construction-cost-intake",
            help_text="Target n8n webhook URL triggered on invoice ingestion and automation simulations.",
        ),
        FieldSchema(
            key="auth_header_name",
            label="Custom Auth Header Name",
            field_type="text",
            required=False,
            default="X-Webhook-Secret",
            placeholder="X-Webhook-Secret",
        ),
    ]

    @classmethod
    def get_default_platform_credentials(cls) -> dict[str, Any]:
        return {"auth_header_token": ""}

    @classmethod
    def get_default_platform_config(cls) -> dict[str, Any]:
        return {
            "webhook_url": getattr(
                settings,
                "N8N_WEBHOOK_URL",
                "http://n8n:5678/webhook/construction-cost-intake",
            ),
            "auth_header_name": "X-Webhook-Secret",
        }

    def test_connection(
        self,
        credentials: dict[str, Any],
        config: dict[str, Any],
        organization: Any = None,
    ) -> tuple[bool, str, dict[str, Any]]:
        webhook_url = str(config.get("webhook_url") or "").strip()
        if not webhook_url:
            return False, "n8n Webhook Endpoint URL is required.", {}
        return (
            True,
            f"n8n Webhook endpoint configured ({webhook_url}).",
            {"webhook_url": webhook_url},
        )

