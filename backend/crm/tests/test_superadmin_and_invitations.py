import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from common.tenancy import Organization, OrganizationMember, PlatformSettings, Invitation
from crm.services.auth_service import JWTService

User = get_user_model()


@pytest.mark.django_db
def test_superadmin_platform_settings_and_client_management():
    client = Client()
    admin_user = User.objects.get(username="admin")
    tokens = JWTService.generate_token_pair(admin_user, role="Superadmin")
    auth_header = f"Bearer {tokens['access_token']}"

    # Superadmin updates platform settings
    patch_res = client.patch(
        "/api/v1/superadmin/platform-settings/",
        {
            "platform_name": "Beamline Pro",
            "google_oauth_client_id": "superadmin-oauth-id.apps.googleusercontent.com",
            "google_oauth_client_secret": "superadmin-secret",
            "google_oauth_enabled": True,
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=auth_header,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["platform_name"] == "Beamline Pro"
    assert patch_res.json()["data"]["has_google_secret"] is True

    # Superadmin toggles client active status
    kevin_org = Organization.objects.get(slug="kevin")
    deactivate_res = client.patch(
        f"/api/v1/superadmin/organizations/{kevin_org.id}/",
        {"is_active": False},
        content_type="application/json",
        HTTP_AUTHORIZATION=auth_header,
    )
    assert deactivate_res.status_code == 200
    assert deactivate_res.json()["data"]["is_active"] is False

    # Superadmin updates granular feature flags for Kevin
    feat_res = client.patch(
        f"/api/v1/superadmin/organizations/{kevin_org.id}/",
        {"feature_flags": {"page_automation": False, "sub_crm_deals": False}},
        content_type="application/json",
        HTTP_AUTHORIZATION=auth_header,
    )
    assert feat_res.status_code == 200
    updated_flags = feat_res.json()["data"]["feature_flags"]
    assert updated_flags["page_automation"] is False
    assert updated_flags["sub_crm_deals"] is False
    assert updated_flags["page_crm"] is True  # preserved default
    assert updated_flags["page_landing"] is False  # client landing pages are opt-in


@pytest.mark.django_db
def test_two_tier_invitations_workflow():
    client = Client()
    admin_user = User.objects.get(username="admin")
    tokens = JWTService.generate_token_pair(admin_user, role="Superadmin")
    auth_header = f"Bearer {tokens['access_token']}"

    # 1. Tier 1: Superadmin invites a new Client
    res_inv = client.post(
        "/api/v1/superadmin/invitations/",
        {
            "email": "sarah@apexbuilds.com",
            "invited_name": "Sarah Miller",
            "organization_name": "Apex Custom Builds",
            "organization_slug": "apex-builds",
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=auth_header,
    )
    assert res_inv.status_code == 201
    inv_data = res_inv.json()["data"]
    token = inv_data["invitation"]["token"]

    # 2. Client Owner accepts invitation via public endpoint
    res_accept = client.post(
        "/api/v1/invitations/accept/",
        {"token": token, "password": "securepassword2026", "username": "sarah_miller"},
        content_type="application/json",
    )
    assert res_accept.status_code == 200
    accept_data = res_accept.json()["data"]
    assert accept_data["role"] == "Owner"
    assert accept_data["organization"]["slug"] == "apex-builds"

    # 3. Tier 2: Sarah (Client Owner) invites a Team Member (PM)
    sarah_tokens = accept_data["tokens"]["access_token"]
    sarah_auth = f"Bearer {sarah_tokens}"

    res_team = client.post(
        "/api/v1/tenant/members/",
        {"email": "david.pm@apexbuilds.com", "role": "PM", "invited_name": "David Lead PM"},
        content_type="application/json",
        HTTP_AUTHORIZATION=sarah_auth,
        HTTP_X_TENANT_SLUG="apex-builds",
    )
    assert res_team.status_code == 201
    team_data = res_team.json()["data"]
    assert team_data["email"] == "david.pm@apexbuilds.com"
    assert team_data["role"] == "PM"
