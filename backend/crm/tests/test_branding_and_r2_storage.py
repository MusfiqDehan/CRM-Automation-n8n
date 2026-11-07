import io
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from common.storage import R2AssetLifecycleService
from common.tenancy import Organization, OrganizationMember, PlatformSettings, UserProfile

User = get_user_model()


@pytest.fixture
def auth_client():
    user = User.objects.create_user(
        username="testbuilder",
        email="builder@test.com",
        password="testpassword123",
        first_name="Marcus",
        last_name="Vance",
    )
    org = Organization.objects.create(
        name="Vance Custom Homes",
        slug="vance",
        site_title="Vance Custom Homes — Modern Coastal Living",
        site_description="Award-winning luxury residential architect & builder.",
    )
    OrganizationMember.objects.create(
        organization=org,
        user=user,
        role=OrganizationMember.Role.OWNER,
    )
    client = APIClient()
    client.force_authenticate(user=user)
    client.tenant = org
    client.defaults["HTTP_X_TENANT_SLUG"] = org.slug
    return client, user, org


@pytest.mark.django_db
def test_user_profile_and_me_api_patch(auth_client):
    client, user, org = auth_client

    # Verify initial GET /api/v1/auth/me/ returns profile fields
    res = client.get("/api/v1/auth/me/")
    assert res.status_code == 200
    assert res.data["success"] is True
    user_data = res.data["data"]["user"]
    assert user_data["username"] == "testbuilder"
    assert "avatar_url" in user_data
    assert "bio" in user_data

    # PATCH bio and avatar
    patch_res = client.patch(
        "/api/v1/auth/me/",
        {
            "first_name": "Marcus Aurelius",
            "bio": "Founding partner and master builder at Vance Custom Homes.",
            "job_title": "Principal Builder",
            "phone": "+1 (555) 234-5678",
            "avatar_url": "https://cdn.musfiqdehan.com/beamline/users/1/avatar.png",
        },
        format="json",
    )
    assert patch_res.status_code == 200
    updated_user = patch_res.data["data"]["user"]
    assert updated_user["first_name"] == "Marcus Aurelius"
    assert updated_user["bio"] == "Founding partner and master builder at Vance Custom Homes."
    assert updated_user["avatar_url"] == "https://cdn.musfiqdehan.com/beamline/users/1/avatar.png"

    # Verify UserProfile record in database
    profile = UserProfile.objects.get(user=user)
    assert profile.bio == "Founding partner and master builder at Vance Custom Homes."
    assert profile.avatar_url == "https://cdn.musfiqdehan.com/beamline/users/1/avatar.png"


@pytest.mark.django_db
def test_tenant_settings_branding_and_seo(auth_client):
    client, user, org = auth_client

    # Update tenant branding & SEO
    res = client.patch(
        "/api/v1/tenant/settings/",
        {
            "site_title": "Vance Architectural Builds — High Performance Homes",
            "site_description": "Crafting bespoke net-zero modern luxury homes across the Pacific Coast.",
            "logo_url": "https://cdn.musfiqdehan.com/beamline/tenants/vance/branding/logo.svg",
            "social_cover_url": "https://cdn.musfiqdehan.com/beamline/tenants/vance/branding/cover.png",
        },
        format="json",
        HTTP_X_TENANT_SLUG="vance",
    )
    assert res.status_code == 200
    assert res.data["success"] is True
    data = res.data["data"]
    assert data["site_title"] == "Vance Architectural Builds — High Performance Homes"
    assert data["logo_url"] == "https://cdn.musfiqdehan.com/beamline/tenants/vance/branding/logo.svg"
    assert data["social_cover_url"] == "https://cdn.musfiqdehan.com/beamline/tenants/vance/branding/cover.png"

    # Verify oauth-config reflects updated tenant and public tenants list
    oauth_res = client.get("/api/v1/auth/oauth-config/", HTTP_X_TENANT_SLUG="vance")
    assert oauth_res.status_code == 200
    tenant_cfg = oauth_res.data["data"]["tenant"]
    assert tenant_cfg["site_title"] == "Vance Architectural Builds — High Performance Homes"
    assert tenant_cfg["social_cover_url"] == "https://cdn.musfiqdehan.com/beamline/tenants/vance/branding/cover.png"

    # Public tenants list contains vance
    public_tenants = oauth_res.data["data"]["public_tenants"]
    assert any(t["slug"] == "vance" for t in public_tenants)


@pytest.mark.django_db
def test_media_asset_upload_and_delete_api(auth_client):
    client, user, org = auth_client

    # Create dummy PNG byte stream
    file_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    file = io.BytesIO(file_content)
    file.name = "avatar.png"
    file.content_type = "image/png"

    # Upload user avatar
    upload_res = client.post(
        "/api/v1/media/assets/",
        {"file": file, "target": "user_avatar"},
        format="multipart",
    )
    assert upload_res.status_code == 201
    assert upload_res.data["success"] is True
    avatar_url = upload_res.data["data"]["url"]
    assert avatar_url
    assert "beamline/tenants/vance/users/avatar" in avatar_url

    # Check profile updated
    profile = UserProfile.objects.get(user=user)
    assert profile.avatar_url == avatar_url

    # Test tenant logo upload (separate tenant folder)
    logo_file = io.BytesIO(file_content)
    logo_file.name = "logo.png"
    logo_file.content_type = "image/png"
    tenant_upload_res = client.post(
        "/api/v1/media/assets/",
        {"file": logo_file, "target": "tenant_logo"},
        format="multipart",
    )
    assert tenant_upload_res.status_code == 201
    tenant_logo_url = tenant_upload_res.data["data"]["url"]
    assert "beamline/tenants/vance/branding" in tenant_logo_url

    # Test platform logo upload (platform folder)
    user.is_superuser = True
    user.save()
    plat_file = io.BytesIO(file_content)
    plat_file.name = "platform_logo.png"
    plat_file.content_type = "image/png"
    plat_upload_res = client.post(
        "/api/v1/media/assets/",
        {"file": plat_file, "target": "platform_logo"},
        format="multipart",
    )
    assert plat_upload_res.status_code == 201
    plat_logo_url = plat_upload_res.data["data"]["url"]
    assert "beamline/platform/branding" in plat_logo_url

    # Delete asset
    del_res = client.delete(
        "/api/v1/media/assets/",
        {"target": "user_avatar"},
        format="json",
    )
    assert del_res.status_code == 200
    profile.refresh_from_db()
    assert profile.avatar_url == ""
