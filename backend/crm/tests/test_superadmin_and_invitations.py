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
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=auth_header,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["platform_name"] == "Beamline Pro"

    # Superadmin updates Google OAuth via unified integrations endpoint
    oauth_patch = client.patch(
        "/api/v1/integrations/superadmin/providers/google_oauth/",
        {
            "is_enabled_globally": True,
            "credentials": {
                "client_id": "superadmin-oauth-id.apps.googleusercontent.com",
                "client_secret": "superadmin-secret",
            },
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=auth_header,
    )
    assert oauth_patch.status_code == 200
    assert oauth_patch.json()["data"]["has_secrets"]["client_secret"] is True

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

    # Superadmin enables Client Landing Page via /feature-flags/ endpoint alias
    enable_landing_res = client.patch(
        f"/api/v1/superadmin/organizations/{kevin_org.id}/feature-flags/",
        {"feature_flags": {"page_landing": True}},
        content_type="application/json",
        HTTP_AUTHORIZATION=auth_header,
    )
    assert enable_landing_res.status_code == 200
    assert enable_landing_res.json()["data"]["feature_flags"]["page_landing"] is True

    # Re-verify landing page enabled persisted on organization model
    kevin_org.refresh_from_db()
    assert kevin_org.is_feature_enabled("page_landing") is True


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


@pytest.mark.django_db
def test_superadmin_portal_telemetry_users_subscriptions_support_notifications():
    client = Client()
    admin_user = User.objects.get(username="admin")
    tokens = JWTService.generate_token_pair(admin_user, role="Superadmin")
    auth_header = f"Bearer {tokens['access_token']}"

    # 1. Telemetry stats
    res_stats = client.get("/api/v1/superadmin/dashboard-stats/", HTTP_AUTHORIZATION=auth_header)
    assert res_stats.status_code == 200
    kpis = res_stats.json()["data"]["kpis"]
    assert kpis["total_organizations"] >= 1
    assert "mrr" in kpis
    assert "open_support_queries" in kpis

    # 2. Users directory
    res_users = client.get("/api/v1/superadmin/users/", HTTP_AUTHORIZATION=auth_header)
    assert res_users.status_code == 200
    user_list = res_users.json()["data"]["results"]
    usernames = [u["username"] for u in user_list]
    assert "admin" in usernames
    assert "kevin" in usernames

    # 3. Subscriptions & MRR
    res_subs = client.get("/api/v1/superadmin/subscriptions/", HTTP_AUTHORIZATION=auth_header)
    assert res_subs.status_code == 200
    subs = res_subs.json()["data"]["results"]
    assert len(subs) >= 1
    kevin_sub = [s for s in subs if s["organization_slug"] == "kevin"][0]
    assert kevin_sub["status"] == "Active"

    # 4. Support Queries & Triage
    kevin_org = Organization.objects.get(slug="kevin")
    res_create_ticket = client.post(
        "/api/v1/superadmin/support-tickets/",
        {
            "organization": str(kevin_org.id),
            "submitted_by_name": "Kevin Builder",
            "submitted_by_email": "kevin@kevinbuild.com",
            "subject": "Need custom domain setup assistance",
            "category": "Domain & DNS",
            "priority": "High",
            "status": "Open",
            "message": "We bought kevinbuild.com and need SSL verification.",
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=auth_header,
    )
    assert res_create_ticket.status_code == 201
    ticket_id = res_create_ticket.json()["data"]["id"]

    # Patch ticket to Resolved
    res_patch_ticket = client.patch(
        f"/api/v1/superadmin/support-tickets/{ticket_id}/",
        {"status": "Resolved", "admin_notes": "Domain verified and SSL active."},
        content_type="application/json",
        HTTP_AUTHORIZATION=auth_header,
    )
    assert res_patch_ticket.status_code == 200
    assert res_patch_ticket.json()["data"]["status"] == "Resolved"

    # 5. Broadcast Announcements
    res_note = client.post(
        "/api/v1/superadmin/notifications/",
        {
            "title": "Scheduled Edge Router Upgrade",
            "message": "Maintenance will occur at 02:00 UTC with zero downtime.",
            "severity": "info",
            "is_active": True,
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=auth_header,
    )
    assert res_note.status_code == 201
    note_id = res_note.json()["data"]["id"]

    res_list_notes = client.get("/api/v1/superadmin/notifications/", HTTP_AUTHORIZATION=auth_header)
    assert res_list_notes.status_code == 200
    assert any(n["id"] == note_id for n in res_list_notes.json()["data"]["results"])


@pytest.mark.django_db
def test_non_superadmin_forbidden_from_superadmin_portal():
    client = Client()
    kevin_user = User.objects.get(username="kevin")
    kevin_org = Organization.objects.get(slug="kevin")
    tokens = JWTService.generate_token_pair(kevin_user, kevin_org, role="Owner")
    auth_header = f"Bearer {tokens['access_token']}"

    forbidden_endpoints = [
        "/api/v1/superadmin/dashboard-stats/",
        "/api/v1/superadmin/users/",
        "/api/v1/superadmin/subscriptions/",
        "/api/v1/superadmin/support-tickets/",
        "/api/v1/superadmin/notifications/",
        "/api/v1/superadmin/platform-settings/",
        "/api/v1/superadmin/organizations/",
        "/api/v1/superadmin/invitations/",
    ]
    for endpoint in forbidden_endpoints:
        res = client.get(endpoint, HTTP_AUTHORIZATION=auth_header)
        assert res.status_code == 403, f"Expected 403 for {endpoint}, got {res.status_code}"

