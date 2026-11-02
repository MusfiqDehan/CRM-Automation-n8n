from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from common.responses import api_response
from rest_framework.decorators import api_view


@api_view(["GET"])
def health_check(request):
    return api_response(
        data={
            "service": "beamline-backend",
            "status": "healthy",
            "stack": "Python 3.14 + Django 6.1 + DRF 3.18",
        },
        message="Service is healthy.",
        success=True,
    )


@api_view(["GET"])
def api_root(request):
    return api_response(
        data={
            "service": "beamline-backend",
            "status": "healthy",
            "version": "v1",
            "health": "/api/v1/health/",
            "endpoints": {
                "health": "/api/v1/health/",
                "dashboard_summary": "/api/v1/dashboard/summary/",
                "contacts": "/api/v1/contacts/",
                "opportunities": "/api/v1/opportunities/",
                "projects": "/api/v1/projects/",
                "tasks": "/api/v1/tasks/",
                "materials": "/api/v1/materials/",
                "costs": "/api/v1/costs/",
                "notifications": "/api/v1/notifications/",
                "notion_provision": "/api/v1/notion/provision/",
                "invoices_extract": "/api/v1/invoices/extract/",
                "invoices_process": "/api/v1/invoices/process/",
                "simulator_trigger": "/api/v1/simulator/trigger/",
                "oauth_config": "/api/v1/auth/oauth-config/",
                "auth_login": "/api/v1/auth/login/",
                "auth_google": "/api/v1/auth/google/",
                "auth_me": "/api/v1/auth/me/",
                "superadmin_settings": "/api/v1/superadmin/platform-settings/",
                "superadmin_organizations": "/api/v1/superadmin/organizations/",
                "tenant_settings": "/api/v1/tenant/settings/",
            },
        },
        message="Beamline Operations API Gateway",
        success=True,
    )


urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/", api_root, name="api-root"),
    path("api", api_root),
    path("api/v1/health/", health_check, name="health-check"),
    path("api/v1/health", health_check),
    path("api/v1/", include("crm.urls")),
    path("api/v1", include("crm.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

