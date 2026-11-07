import pytest
from common.tenancy import Organization
from crm.services.traefik_sync import sync_traefik_custom_domains


@pytest.mark.django_db
def test_traefik_custom_domain_sync():
    kevin_org = Organization.objects.get(slug="kevin")
    kevin_org.custom_domain = "kevinbuild.com"
    kevin_org.save()

    content = sync_traefik_custom_domains()
    assert "Host(`kevinbuild.com`)" in content
    assert "certResolver: customdomains" in content
