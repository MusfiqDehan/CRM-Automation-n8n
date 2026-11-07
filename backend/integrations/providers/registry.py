from __future__ import annotations

from typing import Type
from integrations.providers.base import BaseIntegrationProvider


class ProviderRegistry:
    """Global in-memory registry of all available third-party integration provider plugins."""

    _providers: dict[str, Type[BaseIntegrationProvider]] = {}

    @classmethod
    def register(
        cls, provider_cls: Type[BaseIntegrationProvider]
    ) -> Type[BaseIntegrationProvider]:
        if not provider_cls.provider_key:
            raise ValueError(f"Provider class {provider_cls.__name__} must define provider_key.")
        cls._providers[provider_cls.provider_key] = provider_cls
        return provider_cls

    @classmethod
    def get(cls, provider_key: str) -> Type[BaseIntegrationProvider] | None:
        return cls._providers.get(provider_key)

    @classmethod
    def get_instance(cls, provider_key: str) -> BaseIntegrationProvider | None:
        provider_cls = cls.get(provider_key)
        return provider_cls() if provider_cls else None

    @classmethod
    def all_classes(cls) -> list[Type[BaseIntegrationProvider]]:
        return list(cls._providers.values())

    @classmethod
    def keys(cls) -> list[str]:
        return list(cls._providers.keys())


def register_provider(
    provider_cls: Type[BaseIntegrationProvider],
) -> Type[BaseIntegrationProvider]:
    return ProviderRegistry.register(provider_cls)

