from __future__ import annotations

import contextvars
import logging
from typing import Any
from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse

logger = logging.getLogger(__name__)

_current_tenant: contextvars.ContextVar[Any] = contextvars.ContextVar(
    "current_tenant", default=None
)


def get_current_tenant() -> Any:
    """Returns the currently active organization tenant in the current context."""
    return _current_tenant.get()


def set_current_tenant(tenant: Any) -> None:
    """Sets the active organization tenant in the current context."""
    _current_tenant.set(tenant)


class TenantResolutionMiddleware:
    """
    Resolves the active Organization tenant for every incoming HTTP request.
    Precedence:
    1. Direct Custom Domain match against Organization.custom_domain (e.g. kevinbuild.com)
    2. Subdomain match against Organization.slug (e.g. kevin.beamline.musfiqdehan.com or kevin.localhost)
    3. X-Tenant-Slug or X-Tenant-ID HTTP headers (for SPAs, webhooks, and API clients)
    4. ?tenant= query parameter (for dev testing)
    5. Fallback to default 'kevin' organization when on bare localhost / testserver

    Enforces platform suspension: If an organization is marked is_active=False,
    requests from non-superadmins are rejected with a 403 TENANT_DISABLED response.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        from common.tenancy import Organization, PlatformSettings

        tenant = None
        raw_host = request.get_host().split(":")[0].strip().lower()

        # 1. Custom Domain Match (e.g., kevinbuild.com)
        if raw_host:
            tenant = Organization.objects.filter(custom_domain__iexact=raw_host).first()

        # 2. Subdomain Match
        if not tenant and raw_host:
            platform = PlatformSettings.get_settings()
            base_domains = [
                platform.base_domain.lower(),
                "beamline.musfiqdehan.com",
                "musfiqdehan.com",
                "localhost",
            ]
            for base in base_domains:
                suffix = f".{base}"
                if raw_host.endswith(suffix):
                    subdomain = raw_host[: -len(suffix)].split(".")[-1]
                    if subdomain and subdomain not in ("www", "api", "app", "beamline"):
                        tenant = Organization.objects.filter(slug__iexact=subdomain).first()
                        if tenant:
                            break

        # 3. HTTP Header Resolution
        if not tenant:
            header_slug = request.headers.get("X-Tenant-Slug")
            header_id = request.headers.get("X-Tenant-ID")
            if header_slug:
                tenant = Organization.objects.filter(slug__iexact=header_slug.strip()).first()
            elif header_id:
                try:
                    tenant = Organization.objects.filter(id=header_id.strip()).first()
                except Exception:
                    tenant = None

        # 4. Query Parameter Fallback (?tenant=slug_or_id)
        if not tenant:
            param = request.GET.get("tenant", "").strip()
            if param:
                tenant = Organization.objects.filter(slug__iexact=param).first()
                if not tenant:
                    try:
                        tenant = Organization.objects.filter(id=param).first()
                    except Exception:
                        tenant = None

        # 5. Localhost / Testserver Default Fallback to 'kevin' (excluding platform apex & public platform endpoints)
        if not tenant:
            is_platform_apex = raw_host in (
                "localhost",
                "127.0.0.1",
                "beamline.musfiqdehan.com",
                "musfiqdehan.com",
                "www.beamline.musfiqdehan.com",
            )
            is_platform_endpoint = request.path_info.startswith(
                "/api/v1/auth/oauth-config"
            ) or request.path_info.startswith("/api/v1/superadmin/")

            if raw_host == "testserver" or (settings.DEBUG and not is_platform_apex and not is_platform_endpoint):
                tenant = Organization.objects.filter(slug="kevin").first()

        # Check if tenant is suspended (is_active == False)
        if tenant and not tenant.is_active:
            # Superadmin paths (/api/v1/superadmin/ or Django admin) are allowed through
            path = request.path_info
            is_superadmin_path = path.startswith("/admin/") or path.startswith("/api/v1/superadmin/")
            is_superuser = getattr(request, "user", None) and request.user.is_superuser
            if not (is_superadmin_path or is_superuser):
                return JsonResponse(
                    {
                        "success": False,
                        "message": f"Client organization '{tenant.name}' has been suspended by the platform administrator.",
                        "code": "TENANT_DISABLED",
                    },
                    status=403,
                )

        request.tenant = tenant
        set_current_tenant(tenant)
        try:
            response = self.get_response(request)
            return response
        finally:
            set_current_tenant(None)
