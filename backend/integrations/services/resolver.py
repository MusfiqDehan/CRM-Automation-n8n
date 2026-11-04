from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from django.utils import timezone
from common.middleware import get_current_tenant
from common.tenancy import Organization
from integrations.crypto import CredentialVault
from integrations.models import (
    IntegrationExecutionLog,
    PlatformIntegrationConfig,
    TenantIntegrationConfig,
)
from integrations.providers import ProviderRegistry, load_builtin_providers
from integrations.providers.notion import DEFAULT_NOTION_WORKSPACE_STATE


@dataclass
class ResolvedIntegration:
    provider_key: str
    is_enabled: bool
    is_entitled: bool
    source: str  # "tenant" | "platform" | "unconfigured" | "disabled"
    credentials: dict[str, Any]
    config: dict[str, Any]
    platform_config: PlatformIntegrationConfig
    tenant_config: TenantIntegrationConfig | None = None


class IntegrationResolver:
    """
    Central resolution engine for the two-tier integration architecture:
    Tier 1: Platform Superadmin governance (availability mode, plan tiers, allowed orgs, fallback policy).
    Tier 2: Tenant Admin configuration (BYOC custom credentials vs Platform shared fallback).
    """

    @classmethod
    def ensure_all_platform_configs(cls) -> list[PlatformIntegrationConfig]:
        load_builtin_providers()
        configs = []
        for provider_cls in ProviderRegistry.all_classes():
            configs.append(cls.ensure_platform_config(provider_cls.provider_key))
        return configs

    @classmethod
    def ensure_platform_config(cls, provider_key: str) -> PlatformIntegrationConfig:
        load_builtin_providers()
        provider_cls = ProviderRegistry.get(provider_key)
        if not provider_cls:
            raise ValueError(f"Unknown integration provider '{provider_key}'.")

        obj, created = PlatformIntegrationConfig.objects.get_or_create(
            provider_key=provider_key,
            defaults={
                "is_enabled_globally": True,
                "availability_mode": provider_cls.default_availability_mode,
                "allow_platform_credentials_fallback": provider_cls.supports_platform_fallback,
                "allow_tenant_custom_credentials": provider_cls.supports_tenant_byoc,
                "encrypted_credentials": CredentialVault.encrypt_credentials_dict(
                    provider_cls.get_default_platform_credentials(),
                    secret_keys=provider_cls.get_secret_keys(),
                ),
                "config": provider_cls.get_default_platform_config(),
            },
        )
        if not created:
            # Ensure default config keys exist
            default_cfg = provider_cls.get_default_platform_config()
            merged_cfg = {**default_cfg, **(obj.config or {})}
            if merged_cfg != obj.config:
                obj.config = merged_cfg
                obj.save(update_fields=["config", "updated_at"])
        return obj

    @classmethod
    def get_or_create_tenant_config(
        cls, provider_key: str, organization: Organization
    ) -> TenantIntegrationConfig:
        load_builtin_providers()
        provider_cls = ProviderRegistry.get(provider_key)
        if not provider_cls:
            raise ValueError(f"Unknown integration provider '{provider_key}'.")

        obj, _ = TenantIntegrationConfig.objects.get_or_create(
            organization=organization,
            provider_key=provider_key,
            defaults={
                "is_enabled": False,
                "use_custom_credentials": True,
                "encrypted_credentials": {},
                "config": provider_cls.get_default_tenant_config(),
                "status": TenantIntegrationConfig.ConnectionStatus.PENDING_SETUP,
            },
        )
        return obj

    @classmethod
    def resolve(
        cls,
        provider_key: str,
        organization: Organization | None = None,
    ) -> ResolvedIntegration:
        load_builtin_providers()
        provider_cls = ProviderRegistry.get(provider_key)
        if not provider_cls:
            raise ValueError(f"Unknown integration provider '{provider_key}'.")

        org = organization or get_current_tenant()
        platform_cfg = cls.ensure_platform_config(provider_key)

        is_entitled = platform_cfg.is_available_to_organization(org)
        if org and provider_cls.feature_flag_key:
            # Respect tenant feature flag if explicitly set to False by Superadmin
            flags = org.get_feature_flags()
            if flags.get(provider_cls.feature_flag_key) is False:
                is_entitled = False

        if not platform_cfg.is_enabled_globally or not is_entitled:
            return ResolvedIntegration(
                provider_key=provider_key,
                is_enabled=False,
                is_entitled=False,
                source="disabled",
                credentials={},
                config=provider_cls.get_default_platform_config(),
                platform_config=platform_cfg,
                tenant_config=None,
            )

        tenant_cfg: TenantIntegrationConfig | None = None
        if org:
            tenant_cfg = TenantIntegrationConfig.objects.filter(
                organization=org, provider_key=provider_key
            ).first()

        # Check if Tenant has enabled custom credentials (BYOC)
        if (
            tenant_cfg
            and tenant_cfg.is_enabled
            and tenant_cfg.use_custom_credentials
            and platform_cfg.allow_tenant_custom_credentials
        ):
            tenant_creds = tenant_cfg.get_decrypted_credentials()
            tenant_merged_cfg = {
                **provider_cls.get_default_tenant_config(),
                **(platform_cfg.config or {}),
                **(tenant_cfg.config or {}),
            }
            if provider_cls.has_valid_credentials(tenant_creds) or any(
                str(v or "").strip() for v in tenant_creds.values()
            ):
                return ResolvedIntegration(
                    provider_key=provider_key,
                    is_enabled=True,
                    is_entitled=True,
                    source="tenant",
                    credentials=tenant_creds,
                    config=tenant_merged_cfg,
                    platform_config=platform_cfg,
                    tenant_config=tenant_cfg,
                )

        # Fallback to Platform Credentials if permitted
        if platform_cfg.allow_platform_credentials_fallback:
            plat_creds = platform_cfg.get_decrypted_credentials()
            # Merge defaults from settings if platform DB credentials are blank
            default_plat_creds = provider_cls.get_default_platform_credentials()
            merged_creds = {
                k: (plat_creds.get(k) or default_plat_creds.get(k) or "")
                for k in set(plat_creds.keys()) | set(default_plat_creds.keys())
            }
            merged_cfg = {
                **provider_cls.get_default_platform_config(),
                **(platform_cfg.config or {}),
                **(tenant_cfg.config if tenant_cfg and tenant_cfg.config else {}),
            }
            return ResolvedIntegration(
                provider_key=provider_key,
                is_enabled=True,
                is_entitled=True,
                source="platform",
                credentials=merged_creds,
                config=merged_cfg,
                platform_config=platform_cfg,
                tenant_config=tenant_cfg,
            )

        return ResolvedIntegration(
            provider_key=provider_key,
            is_enabled=False,
            is_entitled=True,
            source="unconfigured",
            credentials={},
            config={
                **provider_cls.get_default_tenant_config(),
                **(tenant_cfg.config if tenant_cfg and tenant_cfg.config else {}),
            },
            platform_config=platform_cfg,
            tenant_config=tenant_cfg,
        )

    @classmethod
    def get_notion_workspace_state(
        cls, organization: Organization | None = None
    ) -> dict[str, Any]:
        """Returns the resolved Notion workspace state (database IDs, URLs, last_synced_at)."""
        resolved = cls.resolve("notion", organization=organization)
        state = {
            **DEFAULT_NOTION_WORKSPACE_STATE,
            **(resolved.config or {}),
        }
        if resolved.tenant_config and resolved.tenant_config.last_synced_at:
            state["last_synced_at"] = resolved.tenant_config.last_synced_at.isoformat()
        return state

    @classmethod
    def update_notion_workspace_state(
        cls,
        updates: dict[str, Any],
        organization: Organization | None = None,
    ) -> dict[str, Any]:
        """Persists updated Notion database IDs/URLs to TenantIntegrationConfig (or PlatformIntegrationConfig)."""
        org = organization or get_current_tenant()
        if not org:
            org = Organization.objects.filter(slug="kevin").first()

        now = timezone.now()
        if org:
            t_cfg = cls.get_or_create_tenant_config("notion", org)
            merged = {
                **DEFAULT_NOTION_WORKSPACE_STATE,
                **(t_cfg.config or {}),
                **updates,
                "last_synced_at": now.isoformat(),
            }
            t_cfg.config = merged
            t_cfg.last_synced_at = now
            if t_cfg.status == TenantIntegrationConfig.ConnectionStatus.PENDING_SETUP:
                t_cfg.status = TenantIntegrationConfig.ConnectionStatus.CONNECTED
            t_cfg.save()
            return merged

        p_cfg = cls.ensure_platform_config("notion")
        merged = {
            **DEFAULT_NOTION_WORKSPACE_STATE,
            **(p_cfg.config or {}),
            **updates,
            "last_synced_at": now.isoformat(),
        }
        p_cfg.config = merged
        p_cfg.save()
        return merged

    @classmethod
    def get_smtp_state(
        cls, organization: Organization | None = None
    ) -> dict[str, Any]:
        """Returns resolved SMTP configuration & credentials for EmailBackend and API responses."""
        org = organization or get_current_tenant()
        resolved = cls.resolve("smtp_email", organization=org)
        creds = resolved.credentials
        cfg = resolved.config
        password = str(creds.get("password") or "")
        kevin_email = (
            str(cfg.get("kevin_email") or "").strip()
            or (org.executive_recipient_email if org else "")
        )
        return {
            "id": str(resolved.tenant_config.id if resolved.tenant_config else resolved.platform_config.id),
            "host": str(cfg.get("host") or "smtp.gmail.com"),
            "port": int(cfg.get("port") or 465),
            "username": str(creds.get("username") or ""),
            "password": password,
            "has_password": bool(password),
            "masked_password": CredentialVault.mask_secret(password) if password else "",
            "use_ssl": bool(cfg.get("use_ssl", True)),
            "use_tls": bool(cfg.get("use_tls", False)),
            "default_from_email": str(cfg.get("default_from_email") or ""),
            "kevin_email": kevin_email,
            "is_active": resolved.is_enabled,
            "source": resolved.source,
            "updated_at": (
                resolved.tenant_config.updated_at.isoformat()
                if resolved.tenant_config
                else resolved.platform_config.updated_at.isoformat()
            ),
        }

    @classmethod
    def update_smtp_state(
        cls,
        data: dict[str, Any],
        organization: Organization | None = None,
    ) -> dict[str, Any]:
        """Updates tenant (or platform) SMTP configuration via the unified integrations engine."""
        org = organization or get_current_tenant()
        if not org:
            org = Organization.objects.filter(slug="kevin").first()

        provider_cls = ProviderRegistry.get("smtp_email")
        secret_keys = provider_cls.get_secret_keys() if provider_cls else {"password"}

        cred_updates: dict[str, Any] = {}
        if "username" in data:
            cred_updates["username"] = str(data["username"] or "").strip()
        if "password" in data:
            cred_updates["password"] = data["password"]

        cfg_keys = ("host", "port", "use_ssl", "use_tls", "default_from_email", "kevin_email")
        cfg_updates = {k: data[k] for k in cfg_keys if k in data}
        if cfg_updates.get("use_ssl") and cfg_updates.get("use_tls"):
            cfg_updates["use_tls"] = False

        if org:
            t_cfg = cls.get_or_create_tenant_config("smtp_email", org)
            t_cfg.is_enabled = bool(data.get("is_active", True))
            t_cfg.use_custom_credentials = True
            t_cfg.set_credentials(cred_updates, secret_keys=secret_keys)
            t_cfg.config = {**(t_cfg.config or {}), **cfg_updates}
            t_cfg.status = TenantIntegrationConfig.ConnectionStatus.CONNECTED
            t_cfg.save()
        else:
            p_cfg = cls.ensure_platform_config("smtp_email")
            p_cfg.set_credentials(cred_updates, secret_keys=secret_keys)
            p_cfg.config = {**(p_cfg.config or {}), **cfg_updates}
            p_cfg.save()

        return cls.get_smtp_state(organization=org)

    @classmethod
    def log_execution(
        cls,
        *,
        provider_key: str,
        action: str,
        status: str = IntegrationExecutionLog.Status.SUCCESS,
        organization: Organization | None = None,
        credential_source: str = "platform",
        duration_ms: int = 0,
        summary: str = "",
        metadata: dict[str, Any] | None = None,
    ) -> IntegrationExecutionLog:
        return IntegrationExecutionLog.objects.create(
            organization=organization,
            provider_key=provider_key,
            action=action,
            status=status,
            credential_source=credential_source,
            duration_ms=max(0, int(duration_ms)),
            summary=summary[:1000],
            metadata=metadata or {},
        )

