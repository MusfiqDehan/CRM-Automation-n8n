from decimal import Decimal
import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from common.tenancy import Organization, OrganizationMember
from crm.models import Contact, ConstructionProject, Opportunity

User = get_user_model()


@pytest.mark.django_db
def test_kevin_organization_seeded_and_data_associated():
    kevin_org = Organization.objects.filter(slug="kevin").first()
    assert kevin_org is not None
    assert kevin_org.name == "Kevin's Custom Homes"
    assert kevin_org.custom_domain == "kevinbuild.com"
    assert kevin_org.is_active is True
    assert kevin_org.deal_review_threshold == Decimal("1000000.00")
    assert kevin_org.invoice_review_threshold == Decimal("5000.00")


@pytest.mark.django_db
def test_row_level_tenant_data_isolation():
    client = Client()
    kevin_org = Organization.objects.get(slug="kevin")

    # Create a secondary client tenant "Apex Builders"
    apex_org = Organization.objects.create(
        name="Apex Luxury Builders",
        slug="apex",
        custom_domain="apexbuilds.com",
        is_active=True,
    )

    # Create contact and project for Kevin
    kevin_contact = Contact.all_objects.create(
        organization=kevin_org,
        name="Kevin Client VIP",
        email="vip@kevinclient.com",
    )

    # Create contact and project for Apex
    apex_contact = Contact.all_objects.create(
        organization=apex_org,
        name="Apex Client Exclusive",
        email="exclusive@apexclient.com",
    )

    # Query with X-Tenant-Slug: kevin
    res_kevin = client.get("/api/v1/contacts/", HTTP_X_TENANT_SLUG="kevin")
    assert res_kevin.status_code == 200
    kevin_names = [c["name"] for c in res_kevin.json()["data"]["results"]]
    assert "Kevin Client VIP" in kevin_names
    assert "Apex Client Exclusive" not in kevin_names

    # Query with X-Tenant-Slug: apex
    res_apex = client.get("/api/v1/contacts/", HTTP_X_TENANT_SLUG="apex")
    assert res_apex.status_code == 200
    apex_names = [c["name"] for c in res_apex.json()["data"]["results"]]
    assert "Apex Client Exclusive" in apex_names
    assert "Kevin Client VIP" not in apex_names


@pytest.mark.django_db
def test_custom_domain_and_subdomain_resolution():
    client = Client()
    kevin_org = Organization.objects.get(slug="kevin")
    Contact.all_objects.create(
        organization=kevin_org,
        name="Subdomain Client Test",
        email="sub@kevin.com",
    )

    # 1. Custom Domain resolution (Host: kevinbuild.com)
    res_custom = client.get("/api/v1/contacts/", HTTP_HOST="kevinbuild.com")
    assert res_custom.status_code == 200
    names = [c["name"] for c in res_custom.json()["data"]["results"]]
    assert "Subdomain Client Test" in names

    # 2. Subdomain resolution (Host: kevin.beamline.musfiqdehan.com)
    res_sub = client.get("/api/v1/contacts/", HTTP_HOST="kevin.beamline.musfiqdehan.com")
    assert res_sub.status_code == 200
    names_sub = [c["name"] for c in res_sub.json()["data"]["results"]]
    assert "Subdomain Client Test" in names_sub


@pytest.mark.django_db
def test_disabled_organization_returns_403_tenant_disabled():
    client = Client()
    suspended_org = Organization.objects.create(
        name="Suspended Builder LLC",
        slug="suspended",
        is_active=False,
    )

    res = client.get("/api/v1/contacts/", HTTP_X_TENANT_SLUG="suspended")
    assert res.status_code == 403
    payload = res.json()
    assert payload["code"] == "TENANT_DISABLED"
    assert "suspended" in payload["message"].lower()
