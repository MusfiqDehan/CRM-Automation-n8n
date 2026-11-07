from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal
import time
from typing import Any
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView
from common.middleware import get_current_tenant
from common.responses import api_response
from common.tenancy import ClientSubscription, Organization, OrganizationMember
from crm.models import Opportunity, ProjectCost
from integrations.crypto import CredentialVault
from integrations.models import (
    IntegrationExecutionLog,
    PaymentTransaction,
    PlatformIntegrationConfig,
    TenantIntegrationConfig,
)
from integrations.providers import BasePaymentProvider, ProviderRegistry, load_builtin_providers
from integrations.services.resolver import IntegrationResolver


def _is_superadmin(request) -> bool:
    if bool(request.user and request.user.is_authenticated and request.user.is_superuser):
        return True
    payload = getattr(request, "auth_payload", None) or {}
    return bool(payload.get("is_superuser"))


def _resolve_target_organization(request) -> Organization | None:
    org_id = request.query_params.get("organization_id") or request.data.get("organization_id")
    if org_id and _is_superadmin(request):
        org = Organization.objects.filter(pk=org_id).first()
        if org:
            return org
    org = getattr(request, "tenant", None) or get_current_tenant()
    if org:
        return org
    if request.user and request.user.is_authenticated:
        membership = (
            OrganizationMember.objects.filter(user=request.user, is_active=True)
            .select_related("organization")
            .first()
        )
        if membership:
            return membership.organization
    return Organization.objects.filter(slug="kevin").first()


def _serialize_platform_provider(provider_cls, p_cfg: PlatformIntegrationConfig) -> dict[str, Any]:
    secret_keys = provider_cls.get_secret_keys()
    masked_creds, has_secrets = CredentialVault.mask_credentials_dict(
        p_cfg.encrypted_credentials, secret_keys=secret_keys
    )
    allowed_org_ids = [str(uid) for uid in p_cfg.allowed_organizations.values_list("id", flat=True)]
    connected_tenants_count = TenantIntegrationConfig.objects.filter(
        provider_key=provider_cls.provider_key, is_enabled=True
    ).count()

    return {
        **provider_cls.serialize_metadata(),
        "id": str(p_cfg.id),
        "is_enabled_globally": p_cfg.is_enabled_globally,
        "availability_mode": p_cfg.availability_mode,
        "allowed_plan_tiers": p_cfg.allowed_plan_tiers or [],
        "allowed_organization_ids": allowed_org_ids,
        "allow_platform_credentials_fallback": p_cfg.allow_platform_credentials_fallback,
        "allow_tenant_custom_credentials": p_cfg.allow_tenant_custom_credentials,
        "credentials": masked_creds,
        "has_secrets": has_secrets,
        "config": {**provider_cls.get_default_platform_config(), **(p_cfg.config or {})},
        "last_tested_at": p_cfg.last_tested_at.isoformat() if p_cfg.last_tested_at else None,
        "last_test_status": p_cfg.last_test_status,
        "last_test_message": p_cfg.last_test_message,
        "connected_tenants_count": connected_tenants_count,
        "updated_at": p_cfg.updated_at.isoformat() if p_cfg.updated_at else None,
    }


def _serialize_tenant_provider(
    provider_cls,
    organization: Organization,
) -> dict[str, Any]:
    resolved = IntegrationResolver.resolve(provider_cls.provider_key, organization=organization)
    p_cfg = resolved.platform_config
    t_cfg = TenantIntegrationConfig.objects.filter(
        organization=organization, provider_key=provider_cls.provider_key
    ).first()

    secret_keys = provider_cls.get_secret_keys()
    masked_creds, has_secrets = CredentialVault.mask_credentials_dict(
        t_cfg.encrypted_credentials if t_cfg else {},
        secret_keys=secret_keys,
    )
    _, platform_has_secrets = CredentialVault.mask_credentials_dict(
        p_cfg.encrypted_credentials,
        secret_keys=secret_keys,
    )
    merged_config = {
        **provider_cls.get_default_tenant_config(),
        **(p_cfg.config or {}),
        **(t_cfg.config if t_cfg and t_cfg.config else {}),
    }

    return {
        **provider_cls.serialize_metadata(),
        "id": str(t_cfg.id) if t_cfg else None,
        "organization_id": str(organization.id),
        "organization_slug": organization.slug,
        "is_entitled": resolved.is_entitled,
        "is_enabled_globally": p_cfg.is_enabled_globally,
        "availability_mode": p_cfg.availability_mode,
        "allow_platform_credentials_fallback": p_cfg.allow_platform_credentials_fallback,
        "allow_tenant_custom_credentials": p_cfg.allow_tenant_custom_credentials,
        "platform_has_credentials": any(platform_has_secrets.values())
        or provider_cls.has_valid_credentials(p_cfg.get_decrypted_credentials()),
        "is_enabled": bool(t_cfg.is_enabled) if t_cfg else resolved.is_enabled,
        "use_custom_credentials": (
            bool(t_cfg.use_custom_credentials)
            if t_cfg
            else not p_cfg.allow_platform_credentials_fallback
        ),
        "active_source": resolved.source,
        "status": (
            t_cfg.status
            if t_cfg
            else (
                TenantIntegrationConfig.ConnectionStatus.CONNECTED
                if resolved.source == "platform"
                else TenantIntegrationConfig.ConnectionStatus.PENDING_SETUP
            )
        ),
        "credentials": masked_creds,
        "has_secrets": has_secrets,
        "config": merged_config,
        "last_synced_at": (
            t_cfg.last_synced_at.isoformat() if t_cfg and t_cfg.last_synced_at else None
        ),
        "last_tested_at": (
            t_cfg.last_tested_at.isoformat() if t_cfg and t_cfg.last_tested_at else None
        ),
        "last_error": t_cfg.last_error if t_cfg else "",
        "updated_at": t_cfg.updated_at.isoformat() if t_cfg and t_cfg.updated_at else None,
    }


class SuperadminIntegrationListAPIView(APIView):
    """
    GET /api/v1/integrations/superadmin/providers/
    Returns the complete catalog of third-party plugins and Platform Superadmin governance settings.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not _is_superadmin(request):
            return api_response(
                message="Platform Superadmin privileges required.",
                success=False,
                status_code=status.HTTP_403_FORBIDDEN,
            )

        load_builtin_providers()
        items = []
        for provider_cls in ProviderRegistry.all_classes():
            p_cfg = IntegrationResolver.ensure_platform_config(provider_cls.provider_key)
            items.append(_serialize_platform_provider(provider_cls, p_cfg))

        return api_response(
            data={
                "results": items,
                "count": len(items),
            },
            message="Platform integration providers retrieved.",
        )


class SuperadminIntegrationDetailAPIView(APIView):
    """
    GET / PATCH /api/v1/integrations/superadmin/providers/<str:provider_key>/
    Updates Platform Superadmin governance, fallback policies, and platform-level credentials.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, provider_key: str):
        if not _is_superadmin(request):
            return api_response(
                message="Platform Superadmin privileges required.",
                success=False,
                status_code=status.HTTP_403_FORBIDDEN,
            )
        provider_cls = ProviderRegistry.get(provider_key)
        if not provider_cls:
            return api_response(
                message=f"Integration provider '{provider_key}' not found.",
                success=False,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        p_cfg = IntegrationResolver.ensure_platform_config(provider_key)
        return api_response(
            data=_serialize_platform_provider(provider_cls, p_cfg),
            message=f"{provider_cls.name} platform settings retrieved.",
        )

    def patch(self, request, provider_key: str):
        if not _is_superadmin(request):
            return api_response(
                message="Platform Superadmin privileges required.",
                success=False,
                status_code=status.HTTP_403_FORBIDDEN,
            )
        provider_cls = ProviderRegistry.get(provider_key)
        if not provider_cls:
            return api_response(
                message=f"Integration provider '{provider_key}' not found.",
                success=False,
                status_code=status.HTTP_404_NOT_FOUND,
            )

        p_cfg = IntegrationResolver.ensure_platform_config(provider_key)
        data = request.data or {}

        if "is_enabled_globally" in data:
            p_cfg.is_enabled_globally = bool(data["is_enabled_globally"])
        if "availability_mode" in data:
            p_cfg.availability_mode = str(data["availability_mode"])
            if p_cfg.availability_mode == PlatformIntegrationConfig.AvailabilityMode.DISABLED:
                p_cfg.is_enabled_globally = False
            elif "is_enabled_globally" not in data:
                p_cfg.is_enabled_globally = True
        if "allowed_plan_tiers" in data and isinstance(data["allowed_plan_tiers"], list):
            p_cfg.allowed_plan_tiers = [str(t) for t in data["allowed_plan_tiers"]]
        if "allow_platform_credentials_fallback" in data:
            p_cfg.allow_platform_credentials_fallback = bool(
                data["allow_platform_credentials_fallback"]
            )
        if "allow_tenant_custom_credentials" in data:
            p_cfg.allow_tenant_custom_credentials = bool(data["allow_tenant_custom_credentials"])

        if "credentials" in data and isinstance(data["credentials"], dict):
            p_cfg.set_credentials(
                data["credentials"], secret_keys=provider_cls.get_secret_keys()
            )
        if "config" in data and isinstance(data["config"], dict):
            p_cfg.config = {**(p_cfg.config or {}), **data["config"]}

        p_cfg.save()

        if "allowed_organization_ids" in data and isinstance(
            data["allowed_organization_ids"], list
        ):
            orgs = Organization.objects.filter(id__in=data["allowed_organization_ids"])
            p_cfg.allowed_organizations.set(orgs)

        IntegrationResolver.log_execution(
            provider_key=provider_key,
            action="update_platform_governance",
            status=IntegrationExecutionLog.Status.SUCCESS,
            credential_source="platform",
            summary=f"Updated platform governance for {provider_cls.name} (mode={p_cfg.availability_mode}).",
        )

        return api_response(
            data=_serialize_platform_provider(provider_cls, p_cfg),
            message=f"{provider_cls.name} platform configuration saved.",
        )


class SuperadminIntegrationTestAPIView(APIView):
    """
    POST /api/v1/integrations/superadmin/providers/<str:provider_key>/test/
    Runs live connection test using Platform Superadmin credentials.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, provider_key: str):
        if not _is_superadmin(request):
            return api_response(
                message="Platform Superadmin privileges required.",
                success=False,
                status_code=status.HTTP_403_FORBIDDEN,
            )
        provider_instance = ProviderRegistry.get_instance(provider_key)
        if not provider_instance:
            return api_response(
                message=f"Integration provider '{provider_key}' not found.",
                success=False,
                status_code=status.HTTP_404_NOT_FOUND,
            )

        p_cfg = IntegrationResolver.ensure_platform_config(provider_key)
        creds = p_cfg.get_decrypted_credentials()
        cfg = {**provider_instance.get_default_platform_config(), **(p_cfg.config or {})}

        # Allow testing unsaved overrides passed in payload
        incoming_creds = request.data.get("credentials")
        if isinstance(incoming_creds, dict):
            for k, v in incoming_creds.items():
                if v and not str(v).startswith("••••"):
                    creds[k] = v
        incoming_cfg = request.data.get("config")
        if isinstance(incoming_cfg, dict):
            cfg.update(incoming_cfg)

        t0 = time.monotonic()
        ok, msg, details = provider_instance.test_connection(creds, cfg, organization=None)
        elapsed_ms = int((time.monotonic() - t0) * 1000)

        p_cfg.last_tested_at = timezone.now()
        p_cfg.last_test_status = (
            PlatformIntegrationConfig.TestStatus.HEALTHY
            if ok
            else PlatformIntegrationConfig.TestStatus.FAILED
        )
        p_cfg.last_test_message = msg
        p_cfg.save(update_fields=["last_tested_at", "last_test_status", "last_test_message", "updated_at"])

        IntegrationResolver.log_execution(
            provider_key=provider_key,
            action="test_platform_connection",
            status=(
                IntegrationExecutionLog.Status.SUCCESS
                if ok
                else IntegrationExecutionLog.Status.ERROR
            ),
            credential_source="platform",
            duration_ms=elapsed_ms,
            summary=msg,
            metadata=details,
        )

        return api_response(
            data={
                "success": ok,
                "message": msg,
                "details": details,
                "duration_ms": elapsed_ms,
                "provider": _serialize_platform_provider(provider_instance.__class__, p_cfg),
            },
            message=msg,
            success=ok,
            status_code=status.HTTP_200_OK if ok else status.HTTP_400_BAD_REQUEST,
        )


class TenantIntegrationListAPIView(APIView):
    """
    GET /api/v1/integrations/tenant/providers/
    Lists all third-party integrations for the active tenant organization.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        org = _resolve_target_organization(request)
        if not org:
            return api_response(
                message="No active tenant organization found.",
                success=False,
                status_code=status.HTTP_404_NOT_FOUND,
            )

        load_builtin_providers()
        items = []
        for provider_cls in ProviderRegistry.all_classes():
            IntegrationResolver.ensure_platform_config(provider_cls.provider_key)
            items.append(_serialize_tenant_provider(provider_cls, org))

        return api_response(
            data={
                "organization_id": str(org.id),
                "organization_name": org.name,
                "organization_slug": org.slug,
                "results": items,
                "count": len(items),
            },
            message="Tenant integrations retrieved.",
        )


class TenantIntegrationDetailAPIView(APIView):
    """
    GET / PATCH /api/v1/integrations/tenant/providers/<str:provider_key>/
    Allows a Tenant Owner/Admin to configure custom BYOC credentials, settings, or fallback mode.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, provider_key: str):
        org = _resolve_target_organization(request)
        if not org:
            return api_response(
                message="No active tenant organization found.",
                success=False,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        provider_cls = ProviderRegistry.get(provider_key)
        if not provider_cls:
            return api_response(
                message=f"Integration provider '{provider_key}' not found.",
                success=False,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return api_response(
            data=_serialize_tenant_provider(provider_cls, org),
            message=f"{provider_cls.name} tenant settings retrieved.",
        )

    def patch(self, request, provider_key: str):
        org = _resolve_target_organization(request)
        if not org:
            return api_response(
                message="No active tenant organization found.",
                success=False,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        provider_cls = ProviderRegistry.get(provider_key)
        if not provider_cls:
            return api_response(
                message=f"Integration provider '{provider_key}' not found.",
                success=False,
                status_code=status.HTTP_404_NOT_FOUND,
            )

        p_cfg = IntegrationResolver.ensure_platform_config(provider_key)
        if not p_cfg.is_available_to_organization(org) and not _is_superadmin(request):
            return api_response(
                message=f"{provider_cls.name} is not enabled for your organization's subscription plan.",
                success=False,
                status_code=status.HTTP_403_FORBIDDEN,
            )

        t_cfg = IntegrationResolver.get_or_create_tenant_config(provider_key, org)
        data = request.data or {}

        if "is_enabled" in data:
            t_cfg.is_enabled = bool(data["is_enabled"])
        if "use_custom_credentials" in data:
            want_custom = bool(data["use_custom_credentials"])
            if want_custom and not p_cfg.allow_tenant_custom_credentials and not _is_superadmin(request):
                return api_response(
                    message=f"Custom BYOC credentials are restricted by Platform Admin for {provider_cls.name}.",
                    success=False,
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            t_cfg.use_custom_credentials = want_custom

        if "credentials" in data and isinstance(data["credentials"], dict):
            t_cfg.set_credentials(
                data["credentials"], secret_keys=provider_cls.get_secret_keys()
            )
        if "config" in data and isinstance(data["config"], dict):
            merged_cfg = {**(t_cfg.config or {}), **data["config"]}
            if merged_cfg.get("use_ssl") and merged_cfg.get("use_tls"):
                merged_cfg["use_tls"] = False
            t_cfg.config = merged_cfg

        if t_cfg.is_enabled:
            t_cfg.status = TenantIntegrationConfig.ConnectionStatus.CONNECTED
            t_cfg.last_error = ""
        else:
            t_cfg.status = TenantIntegrationConfig.ConnectionStatus.DISCONNECTED

        t_cfg.save()

        IntegrationResolver.log_execution(
            provider_key=provider_key,
            action="update_tenant_config",
            status=IntegrationExecutionLog.Status.SUCCESS,
            organization=org,
            credential_source="tenant" if t_cfg.use_custom_credentials else "platform",
            summary=f"Tenant '{org.slug}' updated {provider_cls.name} configuration (enabled={t_cfg.is_enabled}).",
        )

        return api_response(
            data=_serialize_tenant_provider(provider_cls, org),
            message=f"{provider_cls.name} integration settings saved for {org.name}.",
        )


class TenantIntegrationTestAPIView(APIView):
    """
    POST /api/v1/integrations/tenant/providers/<str:provider_key>/test/
    Runs live connection health check for the tenant's integration configuration.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, provider_key: str):
        org = _resolve_target_organization(request)
        if not org:
            return api_response(
                message="No active tenant organization found.",
                success=False,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        provider_instance = ProviderRegistry.get_instance(provider_key)
        if not provider_instance:
            return api_response(
                message=f"Integration provider '{provider_key}' not found.",
                success=False,
                status_code=status.HTTP_404_NOT_FOUND,
            )

        t_cfg = IntegrationResolver.get_or_create_tenant_config(provider_key, org)
        resolved = IntegrationResolver.resolve(provider_key, organization=org)

        # Start with tenant's stored credentials if use_custom_credentials, else resolved
        creds = (
            t_cfg.get_decrypted_credentials()
            if t_cfg.use_custom_credentials
            else dict(resolved.credentials)
        )
        cfg = {
            **provider_instance.get_default_tenant_config(),
            **(resolved.config or {}),
            **(t_cfg.config or {}),
        }

        incoming_creds = request.data.get("credentials")
        if isinstance(incoming_creds, dict):
            for k, v in incoming_creds.items():
                if v and not str(v).startswith("••••"):
                    creds[k] = v
        incoming_cfg = request.data.get("config")
        if isinstance(incoming_cfg, dict):
            cfg.update(incoming_cfg)

        t0 = time.monotonic()
        ok, msg, details = provider_instance.test_connection(creds, cfg, organization=org)
        elapsed_ms = int((time.monotonic() - t0) * 1000)

        t_cfg.last_tested_at = timezone.now()
        if ok:
            t_cfg.status = TenantIntegrationConfig.ConnectionStatus.CONNECTED
            t_cfg.last_error = ""
        else:
            t_cfg.status = TenantIntegrationConfig.ConnectionStatus.ERROR
            t_cfg.last_error = msg
        t_cfg.save(update_fields=["last_tested_at", "status", "last_error", "updated_at"])

        IntegrationResolver.log_execution(
            provider_key=provider_key,
            action="test_tenant_connection",
            status=(
                IntegrationExecutionLog.Status.SUCCESS
                if ok
                else IntegrationExecutionLog.Status.ERROR
            ),
            organization=org,
            credential_source="tenant" if t_cfg.use_custom_credentials else "platform",
            duration_ms=elapsed_ms,
            summary=msg,
            metadata=details,
        )

        return api_response(
            data={
                "success": ok,
                "message": msg,
                "details": details,
                "duration_ms": elapsed_ms,
                "provider": _serialize_tenant_provider(provider_instance.__class__, org),
            },
            message=msg,
            success=ok,
            status_code=status.HTTP_200_OK if ok else status.HTTP_400_BAD_REQUEST,
        )


class TenantIntegrationActionAPIView(APIView):
    """
    POST /api/v1/integrations/tenant/providers/<str:provider_key>/action/
    Executes provider-specific actions (e.g., Notion workspace provisioning, SMTP test email).
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, provider_key: str):
        org = _resolve_target_organization(request)
        provider_instance = ProviderRegistry.get_instance(provider_key)
        if not provider_instance:
            return api_response(
                message=f"Integration provider '{provider_key}' not found.",
                success=False,
                status_code=status.HTTP_404_NOT_FOUND,
            )

        action = str(request.data.get("action") or "").strip()
        if not action:
            return api_response(
                message="Field 'action' is required.",
                success=False,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        resolved = IntegrationResolver.resolve(provider_key, organization=org)
        if not resolved.is_entitled and not _is_superadmin(request):
            return api_response(
                message=f"{provider_instance.name} is not enabled for this organization.",
                success=False,
                status_code=status.HTTP_403_FORBIDDEN,
            )

        t0 = time.monotonic()
        try:
            ok, msg, result_data = provider_instance.execute_action(
                action=action,
                payload=request.data or {},
                credentials=resolved.credentials,
                config=resolved.config,
                organization=org,
            )
        except Exception as exc:
            ok = False
            msg = f"Failed to execute '{action}' on {provider_instance.name}: {exc}"
            result_data = {}

        elapsed_ms = int((time.monotonic() - t0) * 1000)

        IntegrationResolver.log_execution(
            provider_key=provider_key,
            action=action,
            status=(
                IntegrationExecutionLog.Status.SUCCESS
                if ok
                else IntegrationExecutionLog.Status.ERROR
            ),
            organization=org,
            credential_source=resolved.source,
            duration_ms=elapsed_ms,
            summary=msg,
            metadata=result_data if isinstance(result_data, dict) else {},
        )

        return api_response(
            data={
                "success": ok,
                "action": action,
                "result": result_data,
                "duration_ms": elapsed_ms,
                "provider": (
                    _serialize_tenant_provider(provider_instance.__class__, org)
                    if org
                    else None
                ),
            },
            message=msg,
            success=ok,
            status_code=status.HTTP_200_OK if ok else status.HTTP_400_BAD_REQUEST,
        )


class PaymentCheckoutAPIView(APIView):
    """
    POST /api/v1/integrations/payments/checkout/
    Initiates a payment checkout session via Stripe, bKash, or SSLCommerz for either:
    - PLATFORM_SUBSCRIPTION: Tenant paying Beamline SaaS subscription (uses Platform gateway credentials).
    - TENANT_INVOICE: Paying/settling a ProjectCost invoice (uses Tenant's gateway or Platform fallback).
    - TENANT_DEAL: Collecting construction deposit on an Opportunity.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data or {}
        provider_key = str(data.get("provider_key") or "stripe").strip().lower()
        scope = str(
            data.get("scope") or PaymentTransaction.Scope.TENANT_INVOICE
        ).strip()

        provider = ProviderRegistry.get_instance(provider_key)
        if not provider or not isinstance(provider, BasePaymentProvider):
            return api_response(
                message=f"'{provider_key}' is not a registered payment gateway provider.",
                success=False,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        org = _resolve_target_organization(request)

        # Resolve credentials based on payment scope
        if scope == PaymentTransaction.Scope.PLATFORM_SUBSCRIPTION:
            p_cfg = IntegrationResolver.ensure_platform_config(provider_key)
            if not p_cfg.is_enabled_globally:
                return api_response(
                    message=f"{provider.name} is currently disabled for platform billing.",
                    success=False,
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            creds = p_cfg.get_decrypted_credentials()
            cfg = {**provider.get_default_platform_config(), **(p_cfg.config or {})}
            cred_source = "platform"
        else:
            resolved = IntegrationResolver.resolve(provider_key, organization=org)
            if not resolved.is_enabled or not resolved.is_entitled:
                return api_response(
                    message=f"{provider.name} is not enabled or entitled for this organization.",
                    success=False,
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            creds = resolved.credentials
            cfg = resolved.config
            cred_source = resolved.source

        related_sub: ClientSubscription | None = None
        related_cost: ProjectCost | None = None
        related_opp: Opportunity | None = None

        amount = Decimal(str(data.get("amount") or "0.00"))
        currency = str(
            data.get("currency") or cfg.get("default_currency") or "USD"
        ).upper()
        description = str(data.get("description") or "").strip()
        customer_email = str(data.get("customer_email") or "").strip()
        reference_id = str(data.get("reference_id") or "").strip()

        if scope == PaymentTransaction.Scope.PLATFORM_SUBSCRIPTION:
            sub_id = data.get("subscription_id")
            if sub_id:
                related_sub = ClientSubscription.objects.filter(pk=sub_id).first()
            elif org:
                related_sub = getattr(org, "subscription", None)
            if related_sub:
                org = related_sub.organization
                if amount <= Decimal("0.00"):
                    amount = related_sub.monthly_price
                if not description:
                    description = f"Beamline {related_sub.plan_tier} Subscription ({org.name})"
                if not reference_id:
                    reference_id = f"SUB-{org.slug.upper()}"

        elif scope == PaymentTransaction.Scope.TENANT_INVOICE:
            cost_id = data.get("project_cost_id")
            if cost_id:
                related_cost = ProjectCost.all_objects.filter(pk=cost_id).first()
                if related_cost:
                    org = related_cost.organization or org
                    if amount <= Decimal("0.00"):
                        amount = related_cost.amount
                    currency = str(data.get("currency") or related_cost.currency or currency)
                    if not description:
                        description = f"Invoice {related_cost.document_reference} - {related_cost.supplier}"
                    if not reference_id:
                        reference_id = related_cost.document_reference
                    if not customer_email:
                        customer_email = related_cost.source_email

        elif scope == PaymentTransaction.Scope.TENANT_DEAL:
            opp_id = data.get("opportunity_id")
            if opp_id:
                related_opp = Opportunity.all_objects.filter(pk=opp_id).first()
                if related_opp:
                    org = related_opp.organization or org
                    if amount <= Decimal("0.00"):
                        amount = (related_opp.estimated_value * Decimal("0.05")).quantize(
                            Decimal("0.01")
                        )
                    if not description:
                        description = f"Design/Construction Retainer - {related_opp.name}"
                    if not reference_id:
                        reference_id = f"DEAL-{str(related_opp.id)[:8].upper()}"

        if amount <= Decimal("0.00"):
            amount = Decimal("499.00")
        if not description:
            description = f"{provider.name} Payment"
        if not reference_id:
            reference_id = f"REF-{int(time.time())}"

        t0 = time.monotonic()
        checkout_res = provider.initiate_checkout(
            amount=amount,
            currency=currency,
            description=description,
            customer_email=customer_email or "billing@kevinconstruction.com",
            reference_id=reference_id,
            credentials=creds,
            config=cfg,
            return_url=str(data.get("return_url") or ""),
        )
        elapsed_ms = int((time.monotonic() - t0) * 1000)

        tx_status = str(checkout_res.get("status") or PaymentTransaction.Status.PENDING)
        now = timezone.now()

        tx = PaymentTransaction.objects.create(
            organization=org,
            provider_key=provider_key,
            scope=scope,
            status=tx_status,
            amount=amount,
            currency=currency,
            external_transaction_id=str(checkout_res.get("external_transaction_id") or ""),
            checkout_url=str(checkout_res.get("checkout_url") or ""),
            customer_email=customer_email,
            description=description,
            related_subscription=related_sub,
            related_project_cost=related_cost,
            related_opportunity=related_opp,
            is_sandbox=bool(checkout_res.get("is_sandbox", True)),
            metadata=checkout_res.get("raw_response") or {},
            completed_at=now if tx_status == PaymentTransaction.Status.SUCCEEDED else None,
        )

        # If sandbox checkout succeeded immediately, update linked entity status
        if tx.status == PaymentTransaction.Status.SUCCEEDED:
            _apply_successful_payment_side_effects(tx)

        IntegrationResolver.log_execution(
            provider_key=provider_key,
            action=f"payment_checkout:{scope.lower()}",
            status=IntegrationExecutionLog.Status.SUCCESS,
            organization=org,
            credential_source=cred_source,
            duration_ms=elapsed_ms,
            summary=f"Initiated {provider.name} checkout for {amount} {currency} ({tx.external_transaction_id}).",
            metadata={
                "transaction_id": str(tx.id),
                "external_transaction_id": tx.external_transaction_id,
                "scope": scope,
                "amount": str(amount),
                "currency": currency,
            },
        )

        return api_response(
            data=_serialize_payment_transaction(tx),
            message=f"{provider.name} checkout completed ({amount} {currency}).",
            status_code=status.HTTP_201_CREATED,
        )


def _apply_successful_payment_side_effects(tx: PaymentTransaction) -> None:
    today = date.today()
    if tx.related_subscription:
        sub = tx.related_subscription
        sub.status = ClientSubscription.Status.ACTIVE
        sub.last_payment_date = today
        sub.next_billing_date = today + timedelta(days=30)
        sub.total_paid_ytd = (sub.total_paid_ytd or Decimal("0.00")) + tx.amount
        sub.payment_method = f"{tx.provider_key.upper()} ({tx.external_transaction_id[:12]})"
        sub.save()

    if tx.related_project_cost:
        cost = tx.related_project_cost
        cost.payment_status = ProjectCost.PaymentStatus.PAID
        cost.save(update_fields=["payment_status", "updated_at"])


def _serialize_payment_transaction(tx: PaymentTransaction) -> dict[str, Any]:
    return {
        "id": str(tx.id),
        "organization_id": str(tx.organization.id) if tx.organization else None,
        "organization_name": tx.organization.name if tx.organization else "Platform",
        "organization_slug": tx.organization.slug if tx.organization else "platform",
        "provider_key": tx.provider_key,
        "scope": tx.scope,
        "status": tx.status,
        "amount": str(tx.amount),
        "currency": tx.currency,
        "external_transaction_id": tx.external_transaction_id,
        "checkout_url": tx.checkout_url,
        "customer_email": tx.customer_email,
        "description": tx.description,
        "related_subscription_id": (
            str(tx.related_subscription_id) if tx.related_subscription_id else None
        ),
        "related_project_cost_id": (
            str(tx.related_project_cost_id) if tx.related_project_cost_id else None
        ),
        "related_opportunity_id": (
            str(tx.related_opportunity_id) if tx.related_opportunity_id else None
        ),
        "is_sandbox": tx.is_sandbox,
        "metadata": tx.metadata,
        "completed_at": tx.completed_at.isoformat() if tx.completed_at else None,
        "created_at": tx.created_at.isoformat(),
    }


class PaymentWebhookAPIView(APIView):
    """
    POST /api/v1/integrations/payments/webhook/<str:provider_key>/
    Processes inbound payment gateway webhooks/IPNs from Stripe, bKash, or SSLCommerz.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, provider_key: str):
        provider = ProviderRegistry.get_instance(provider_key)
        if not provider or not isinstance(provider, BasePaymentProvider):
            return api_response(
                message=f"Unknown payment provider '{provider_key}'.",
                success=False,
                status_code=status.HTTP_404_NOT_FOUND,
            )

        payload = request.data or {}
        tx_id = payload.get("transaction_id")
        ext_id = (
            payload.get("external_transaction_id")
            or payload.get("paymentID")
            or payload.get("sessionkey")
            or payload.get("data", {}).get("object", {}).get("id")
        )

        tx = None
        if tx_id:
            tx = PaymentTransaction.objects.filter(pk=tx_id).first()
        if not tx and ext_id:
            tx = PaymentTransaction.objects.filter(external_transaction_id=ext_id).first()

        org = tx.organization if tx else _resolve_target_organization(request)
        resolved = IntegrationResolver.resolve(provider_key, organization=org)

        verification = provider.verify_or_handle_webhook(
            payload=payload,
            credentials=resolved.credentials,
            config=resolved.config,
        )

        if tx:
            tx.status = verification.get("status", PaymentTransaction.Status.SUCCEEDED)
            if tx.status == PaymentTransaction.Status.SUCCEEDED and not tx.completed_at:
                tx.completed_at = timezone.now()
            tx.metadata = {**(tx.metadata or {}), **(verification.get("metadata") or {})}
            tx.save()
            if tx.status == PaymentTransaction.Status.SUCCEEDED:
                _apply_successful_payment_side_effects(tx)

        IntegrationResolver.log_execution(
            provider_key=provider_key,
            action="payment_webhook",
            status=IntegrationExecutionLog.Status.SUCCESS,
            organization=org,
            credential_source=resolved.source,
            summary=f"Processed {provider.name} webhook (status={verification.get('status')}).",
            metadata=verification,
        )

        return api_response(
            data={
                "verified": verification.get("verified", True),
                "status": verification.get("status"),
                "transaction": _serialize_payment_transaction(tx) if tx else None,
            },
            message=f"{provider.name} webhook processed.",
        )


class IntegrationLogsAndTransactionsAPIView(APIView):
    """
    GET /api/v1/integrations/logs/
    Returns recent execution logs and payment transactions for observability.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        scope = request.query_params.get("scope", "tenant")
        provider_key = request.query_params.get("provider_key", "").strip()

        logs_qs = IntegrationExecutionLog.objects.select_related("organization").all()
        tx_qs = PaymentTransaction.objects.select_related("organization").all()

        if scope == "platform" and _is_superadmin(request):
            pass
        else:
            org = _resolve_target_organization(request)
            if org:
                logs_qs = logs_qs.filter(organization=org)
                tx_qs = tx_qs.filter(organization=org)

        if provider_key:
            logs_qs = logs_qs.filter(provider_key=provider_key)
            tx_qs = tx_qs.filter(provider_key=provider_key)

        logs_data = [
            {
                "id": str(log.id),
                "organization_id": str(log.organization_id) if log.organization_id else None,
                "organization_slug": log.organization.slug if log.organization else "platform",
                "provider_key": log.provider_key,
                "action": log.action,
                "status": log.status,
                "duration_ms": log.duration_ms,
                "credential_source": log.credential_source,
                "summary": log.summary,
                "metadata": log.metadata,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs_qs[:40]
        ]

        tx_data = [_serialize_payment_transaction(tx) for tx in tx_qs[:40]]

        return api_response(
            data={
                "logs": logs_data,
                "transactions": tx_data,
            },
            message="Integration execution logs and payment transactions retrieved.",
        )

