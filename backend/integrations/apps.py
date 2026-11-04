from __future__ import annotations

from django.apps import AppConfig


class IntegrationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "integrations"
    verbose_name = "Third-Party Integrations & Plugins"

    def ready(self) -> None:
        # Ensure all built-in provider plugins are registered on startup
        from integrations.providers import load_builtin_providers

        load_builtin_providers()

