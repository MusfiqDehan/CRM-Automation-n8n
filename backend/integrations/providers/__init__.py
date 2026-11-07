from __future__ import annotations

from integrations.providers.base import BaseIntegrationProvider, BasePaymentProvider, FieldSchema
from integrations.providers.registry import ProviderRegistry, register_provider


def load_builtin_providers() -> None:
    """Imports all built-in provider modules so @register_provider decorators execute."""
    from integrations.providers import (  # noqa: F401
        ai_automation,
        google_oauth,
        notion,
        payment_providers,
        smtp_email,
    )


__all__ = [
    "BaseIntegrationProvider",
    "BasePaymentProvider",
    "FieldSchema",
    "ProviderRegistry",
    "register_provider",
    "load_builtin_providers",
]

