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
            "service": "kevin-construction-os-backend",
            "status": "healthy",
            "stack": "Python 3.14 + Django 6.1 + DRF 3.18",
        },
        message="Service is healthy.",
        success=True,
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", health_check, name="health-check"),
    path("api/v1/", include("crm.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

