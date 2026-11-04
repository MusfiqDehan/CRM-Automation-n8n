from __future__ import annotations

from dataclasses import asdict, dataclass, field
from decimal import Decimal
from typing import Any, Literal


@dataclass(frozen=True)
class FieldSchema:
    key: str
    label: str
    field_type: Literal["text", "secret", "url", "email", "number", "boolean", "select"] = "text"
    required: bool = False
    default: Any = ""
    placeholder: str = ""
    help_text: str = ""
    options: list[dict[str, str]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class BaseIntegrationProvider:
    """
    Base class for all third-party integration plugins.
    Adding a new integration requires subclassing BaseIntegrationProvider and decorating with @register_provider.
    """

    provider_key: str = ""
    name: str = ""
    category: Literal[
        "identity", "workspace", "payments", "communication", "ai_automation"
    ] = "workspace"
    description: str = ""
    icon_name: str = "Blocks"
    docs_url: str = ""
    feature_flag_key: str = ""
    supports_platform_fallback: bool = True
    supports_tenant_byoc: bool = True
    supports_webhooks: bool = False
    default_availability_mode: str = "ALL_TENANTS"

    credential_schema: list[FieldSchema] = []
    config_schema: list[FieldSchema] = []
    supported_actions: list[dict[str, str]] = []

    @classmethod
    def get_secret_keys(cls) -> set[str]:
        return {f.key for f in cls.credential_schema if f.field_type == "secret"}

    @classmethod
    def get_default_platform_credentials(cls) -> dict[str, Any]:
        return {f.key: f.default for f in cls.credential_schema}

    @classmethod
    def get_default_platform_config(cls) -> dict[str, Any]:
        return {f.key: f.default for f in cls.config_schema}

    @classmethod
    def get_default_tenant_config(cls) -> dict[str, Any]:
        return {f.key: f.default for f in cls.config_schema}

    @classmethod
    def has_valid_credentials(cls, credentials: dict[str, Any]) -> bool:
        required_keys = [f.key for f in cls.credential_schema if f.required]
        if not required_keys:
            return bool(any(str(v or "").strip() for v in credentials.values()))
        return all(bool(str(credentials.get(k) or "").strip()) for k in required_keys)

    @classmethod
    def serialize_metadata(cls) -> dict[str, Any]:
        return {
            "provider_key": cls.provider_key,
            "name": cls.name,
            "category": cls.category,
            "description": cls.description,
            "icon_name": cls.icon_name,
            "docs_url": cls.docs_url,
            "feature_flag_key": cls.feature_flag_key,
            "supports_platform_fallback": cls.supports_platform_fallback,
            "supports_tenant_byoc": cls.supports_tenant_byoc,
            "supports_webhooks": cls.supports_webhooks,
            "credential_schema": [f.to_dict() for f in cls.credential_schema],
            "config_schema": [f.to_dict() for f in cls.config_schema],
            "supported_actions": cls.supported_actions,
        }

    def test_connection(
        self,
        credentials: dict[str, Any],
        config: dict[str, Any],
        organization: Any = None,
    ) -> tuple[bool, str, dict[str, Any]]:
        """
        Validates credentials and connectivity with the external provider.
        Returns (success: bool, message: str, details: dict).
        """
        if not self.has_valid_credentials(credentials):
            return False, f"Missing required credentials for {self.name}.", {}
        return True, f"{self.name} credentials verified.", {}

    def execute_action(
        self,
        action: str,
        payload: dict[str, Any],
        credentials: dict[str, Any],
        config: dict[str, Any],
        organization: Any = None,
    ) -> tuple[bool, str, dict[str, Any]]:
        return False, f"Action '{action}' is not supported by {self.name}.", {}


class BasePaymentProvider(BaseIntegrationProvider):
    """
    Specialized base class for Payment Gateway plugins (Stripe, bKash, SSLCommerz).
    Supports both Platform-level SaaS subscription billing and Tenant-level invoice/deal collection.
    """

    category = "payments"
    supports_webhooks = True

    def initiate_checkout(
        self,
        *,
        amount: Decimal,
        currency: str,
        description: str,
        customer_email: str,
        reference_id: str,
        credentials: dict[str, Any],
        config: dict[str, Any],
        return_url: str = "",
    ) -> dict[str, Any]:
        """
        Initiates a payment checkout session and returns:
        {
            "success": bool,
            "external_transaction_id": str,
            "checkout_url": str,
            "is_sandbox": bool,
            "status": "PENDING" | "SUCCEEDED" | "FAILED",
            "raw_response": dict,
        }
        """
        raise NotImplementedError

    def verify_or_handle_webhook(
        self,
        *,
        payload: dict[str, Any],
        credentials: dict[str, Any],
        config: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Verifies a webhook event or payment callback and returns normalized status:
        {
            "verified": bool,
            "external_transaction_id": str,
            "status": "SUCCEEDED" | "FAILED" | "CANCELED",
            "metadata": dict,
        }
        """
        raise NotImplementedError

