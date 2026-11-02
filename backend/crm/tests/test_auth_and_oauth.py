import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from common.tenancy import Organization, OrganizationMember, PlatformSettings
from crm.services.auth_service import GoogleOAuthService, JWTService

User = get_user_model()


@pytest.mark.django_db
def test_jwt_generation_and_decode():
    kevin_org = Organization.objects.get(slug="kevin")
    user = User.objects.get(username="kevin")

    tokens = JWTService.generate_token_pair(user, kevin_org, role="Owner")
    assert "access_token" in tokens
    assert "refresh_token" in tokens

    payload = JWTService.decode(tokens["access_token"])
    assert payload["user_id"] == str(user.id)
    assert payload["organization_slug"] == "kevin"
    assert payload["role"] == "Owner"
    assert payload["type"] == "access"


@pytest.mark.django_db
def test_login_api_view_success_and_failure():
    client = Client()
    # Test valid login with Kevin
    res_ok = client.post(
        "/api/v1/auth/login/",
        {"username_or_email": "kevin", "password": "kevinpass2026"},
        content_type="application/json",
        HTTP_X_TENANT_SLUG="kevin",
    )
    assert res_ok.status_code == 200
    data = res_ok.json()["data"]
    assert "tokens" in data
    assert data["user"]["username"] == "kevin"
    assert data["role"] == "Owner"

    # Test invalid login
    res_bad = client.post(
        "/api/v1/auth/login/",
        {"username_or_email": "kevin", "password": "wrongpassword"},
        content_type="application/json",
        HTTP_X_TENANT_SLUG="kevin",
    )
    assert res_bad.status_code == 401


@pytest.mark.django_db
def test_two_tier_google_oauth_resolution():
    client = Client()
    platform = PlatformSettings.get_settings()
    platform.google_oauth_client_id = "platform-global-id.apps.googleusercontent.com"
    platform.google_oauth_client_secret = "platform-secret"
    platform.save()

    kevin_org = Organization.objects.get(slug="kevin")
    kevin_org.use_custom_google_oauth = False
    kevin_org.save()

    # 1. Tier 1 fallback: when client custom oauth is disabled, use platform oauth
    res_plat = client.get("/api/v1/auth/oauth-config/", HTTP_X_TENANT_SLUG="kevin")
    assert res_plat.status_code == 200
    oauth_data = res_plat.json()["data"]["google_oauth"]
    assert oauth_data["source"] == "platform"
    assert oauth_data["client_id"] == "platform-global-id.apps.googleusercontent.com"

    # 2. Tier 2 override: when client configures and enables custom Google OAuth
    kevin_org.use_custom_google_oauth = True
    kevin_org.google_oauth_client_id = "kevin-custom-id.apps.googleusercontent.com"
    kevin_org.google_oauth_client_secret = "kevin-custom-secret"
    kevin_org.save()

    res_client = client.get("/api/v1/auth/oauth-config/", HTTP_X_TENANT_SLUG="kevin")
    assert res_client.status_code == 200
    oauth_client_data = res_client.json()["data"]["google_oauth"]
    assert oauth_client_data["source"] == "client"
    assert oauth_client_data["client_id"] == "kevin-custom-id.apps.googleusercontent.com"
    assert oauth_client_data["brand_name"] == "Kevin's Custom Homes"


@pytest.mark.django_db
def test_google_oauth_login_with_mock_token():
    client = Client()
    kevin_org = Organization.objects.get(slug="kevin")

    # Use test fixture token format: test_google_token_<email>
    res = client.post(
        "/api/v1/auth/google/",
        {"id_token": "test_google_token_newpm@kevinbuild.com"},
        content_type="application/json",
        HTTP_X_TENANT_SLUG="kevin",
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["user"]["email"] == "newpm@kevinbuild.com"
    assert "tokens" in data


@pytest.mark.django_db
def test_register_api_view_success_and_workspace_creation():
    client = Client()
    payload = {
        "email": "jane@apexbuilds.com",
        "password": "apexpassword2026",
        "full_name": "Jane Builder",
        "organization_name": "Apex Custom Builds",
        "organization_slug": "apex",
    }
    res = client.post(
        "/api/v1/auth/register/",
        payload,
        content_type="application/json",
    )
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["user"]["email"] == "jane@apexbuilds.com"
    assert data["organization"]["slug"] == "apex"
    assert data["organization"]["name"] == "Apex Custom Builds"
    assert data["role"] == "Owner"
    assert "tokens" in data
    assert Organization.objects.filter(slug="apex").exists()
    assert User.objects.filter(email="jane@apexbuilds.com").exists()
