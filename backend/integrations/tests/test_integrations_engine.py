from __future__ import annotations

from decimal import Decimal
import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from common.tenancy import ClientSubscription, Organization
from crm.models import ConstructionProject, ProjectCost
from crm.services.auth_service import JWTService
from integrations.crypto import CredentialVault
from integrations.models import (
    IntegrationExecutionLog,
    PaymentTransaction,
    PlatformIntegrationConfig,
)
from integrations.providers import ProviderRegistry, load_builtin_providers
from integrations.services.resolver import IntegrationResolver

User = get_user_model()


def test_credential_vault_encryption_decryption_and_masking():
    raw_secret = "sk_live_9876543210abcdef"
    encrypted = CredentialVault.encrypt_value(raw_secret)
    assert encrypted.startswith("enc:v1:")
    assert raw_secret not in encrypted

    decrypted = CredentialVault.decrypt_value(encrypted)
    assert decrypted == raw_secret

    masked = CredentialVault.mask_secret(encrypted)
    assert masked == "••••••••cdef"

    # Partial update preserves existing encrypted secret when masked or blank
    creds = CredentialVault.encrypt_credentials_dict(
        {"api_key": raw_secret, "username": "kevin"},
        secret_keys={"api_key"},
    )
    updated_creds = CredentialVault.encrypt_credentials_dict(
        {"api_key": "••••••••cdef", "username": "kevin_updated"},
        existing_encrypted=creds,
        secret_keys={"api_key"},
    )
    decrypted_dict = CredentialVault.decrypt_credentials_dict(updated_creds)
    assert decrypted_dict["api_key"] == raw_secret
    assert decrypted_dict["username"] == "kevin_updated"


@pytest.mark.django_db
def test_provider_registry_contains_all_ten_builtin_providers():
    load_builtin_providers()
    expected = {
        "google_oauth",
        "notion",
        "smtp_email",
        "stripe",
        "bkash",
        "sslcommerz",
        "openai",
        "gemini",
        "deepseek",
        "n8n_webhook",
    }
    assert expected.issubset(set(ProviderRegistry.keys()))


@pytest.mark.django_db
def test_three_mode_governance_and_byoc_vs_platform_fallback():
    kevin_org = Organization.objects.get(slug="kevin")
    apex_org, _ = Organization.objects.get_or_create(
        slug="apex",
        defaults={"name": "Apex Modern Homes", "is_active": True},
    )

    p_cfg = IntegrationResolver.ensure_platform_config("notion")
    p_cfg.set_credentials({"api_key": "ntn_platform_shared_key_1234"}, secret_keys={"api_key"})
    p_cfg.availability_mode = PlatformIntegrationConfig.AvailabilityMode.SPECIFIC_TENANTS
    p_cfg.allow_platform_credentials_fallback = True
    p_cfg.save()
    p_cfg.allowed_organizations.set([kevin_org])

    # Kevin is in allowed_organizations -> entitled & falls back to platform key
    res_kevin = IntegrationResolver.resolve("notion", organization=kevin_org)
    assert res_kevin.is_entitled is True
    assert res_kevin.is_enabled is True
    assert res_kevin.source == "platform"
    assert res_kevin.credentials["api_key"] == "ntn_platform_shared_key_1234"

    # Apex is not in allowed_organizations -> disabled/not entitled
    res_apex = IntegrationResolver.resolve("notion", organization=apex_org)
    assert res_apex.is_entitled is False
    assert res_apex.is_enabled is False
    assert res_apex.source == "disabled"

    # Strict BYOC mode: disable platform fallback
    p_cfg.allow_platform_credentials_fallback = False
    p_cfg.save()
    res_kevin_strict = IntegrationResolver.resolve("notion", organization=kevin_org)
    assert res_kevin_strict.is_entitled is True
    assert res_kevin_strict.is_enabled is False
    assert res_kevin_strict.source == "unconfigured"

    # Kevin adds custom BYOC Notion token
    t_cfg = IntegrationResolver.get_or_create_tenant_config("notion", kevin_org)
    t_cfg.is_enabled = True
    t_cfg.use_custom_credentials = True
    t_cfg.set_credentials({"api_key": "ntn_kevin_custom_token_9999"}, secret_keys={"api_key"})
    t_cfg.save()

    res_kevin_byoc = IntegrationResolver.resolve("notion", organization=kevin_org)
    assert res_kevin_byoc.is_enabled is True
    assert res_kevin_byoc.source == "tenant"
    assert res_kevin_byoc.credentials["api_key"] == "ntn_kevin_custom_token_9999"


@pytest.mark.django_db
def test_superadmin_and_tenant_integrations_api_endpoints():
    client = Client()
    admin_user = User.objects.get(username="admin")
    admin_tokens = JWTService.generate_token_pair(admin_user, role="Superadmin")
    admin_auth = f"Bearer {admin_tokens['access_token']}"

    # 1. Superadmin lists all providers
    list_res = client.get(
        "/api/v1/integrations/superadmin/providers/",
        HTTP_AUTHORIZATION=admin_auth,
    )
    assert list_res.status_code == 200
    providers = list_res.json()["data"]["results"]
    assert len(providers) >= 10

    # 2. Superadmin tests Stripe sandbox connection
    test_res = client.post(
        "/api/v1/integrations/superadmin/providers/stripe/test/",
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=admin_auth,
    )
    assert test_res.status_code == 200
    assert test_res.json()["data"]["success"] is True

    # 3. Tenant configures custom bKash credentials and tests connection
    kevin_user = User.objects.get(username="kevin")
    kevin_org = Organization.objects.get(slug="kevin")
    kevin_tokens = JWTService.generate_token_pair(kevin_user, kevin_org, role="Owner")
    kevin_auth = f"Bearer {kevin_tokens['access_token']}"

    patch_tenant = client.patch(
        "/api/v1/integrations/tenant/providers/bkash/",
        {
            "is_enabled": True,
            "use_custom_credentials": True,
            "credentials": {
                "app_key": "kevin_bkash_app_key",
                "app_secret": "kevin_bkash_secret_9876",
                "username": "kevin_bkash_user",
                "password": "kevin_bkash_password_1234",
            },
            "config": {"mode": "sandbox", "default_currency": "BDT"},
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=kevin_auth,
        HTTP_X_TENANT_SLUG="kevin",
    )
    assert patch_tenant.status_code == 200
    t_data = patch_tenant.json()["data"]
    assert t_data["is_enabled"] is True
    assert t_data["active_source"] == "tenant"
    assert t_data["credentials"]["app_secret"] == "••••••••9876"
    assert t_data["has_secrets"]["app_secret"] is True

    test_bkash = client.post(
        "/api/v1/integrations/tenant/providers/bkash/test/",
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=kevin_auth,
        HTTP_X_TENANT_SLUG="kevin",
    )
    assert test_bkash.status_code == 200
    assert test_bkash.json()["data"]["success"] is True


@pytest.mark.django_db
def test_dual_scope_payment_gateways_stripe_bkash_sslcommerz():
    client = Client()
    kevin_user = User.objects.get(username="kevin")
    kevin_org = Organization.objects.get(slug="kevin")
    kevin_tokens = JWTService.generate_token_pair(kevin_user, kevin_org, role="Owner")
    kevin_auth = f"Bearer {kevin_tokens['access_token']}"

    # Ensure subscription and sample unpaid ProjectCost exist
    sub, _ = ClientSubscription.objects.get_or_create(
        organization=kevin_org,
        defaults={
            "plan_tier": ClientSubscription.PlanTier.ENTERPRISE,
            "monthly_price": Decimal("899.00"),
            "status": ClientSubscription.Status.PAST_DUE,
        },
    )
    prj, _ = ConstructionProject.objects.get_or_create(
        code="PRJ-PAY-01",
        defaults={
            "organization": kevin_org,
            "name": "Payment Gateway Test Residence",
        },
    )
    cost = ProjectCost.objects.create(
        organization=kevin_org,
        title="Foundation Concrete Pour",
        supplier="Pacific ReadyMix",
        document_reference="INV-PAY-1001",
        project=prj,
        amount=Decimal("4250.00"),
        currency="USD",
        payment_status=ProjectCost.PaymentStatus.UNPAID,
    )

    # 1. Platform Subscription checkout via Stripe
    sub_res = client.post(
        "/api/v1/integrations/payments/checkout/",
        {
            "provider_key": "stripe",
            "scope": "PLATFORM_SUBSCRIPTION",
            "subscription_id": str(sub.id),
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=kevin_auth,
        HTTP_X_TENANT_SLUG="kevin",
    )
    assert sub_res.status_code == 201
    sub_tx = sub_res.json()["data"]
    assert sub_tx["provider_key"] == "stripe"
    assert sub_tx["status"] == "SUCCEEDED"
    sub.refresh_from_db()
    assert sub.status == ClientSubscription.Status.ACTIVE

    # 2. Tenant Invoice settlement via SSLCommerz
    inv_res = client.post(
        "/api/v1/integrations/payments/checkout/",
        {
            "provider_key": "sslcommerz",
            "scope": "TENANT_INVOICE",
            "project_cost_id": str(cost.id),
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=kevin_auth,
        HTTP_X_TENANT_SLUG="kevin",
    )
    assert inv_res.status_code == 201
    inv_tx = inv_res.json()["data"]
    assert inv_tx["provider_key"] == "sslcommerz"
    assert inv_tx["status"] == "SUCCEEDED"
    cost.refresh_from_db()
    assert cost.payment_status == ProjectCost.PaymentStatus.PAID

    # 3. Verify logs and payment transactions endpoint
    logs_res = client.get(
        "/api/v1/integrations/logs/",
        HTTP_AUTHORIZATION=kevin_auth,
        HTTP_X_TENANT_SLUG="kevin",
    )
    assert logs_res.status_code == 200
    assert len(logs_res.json()["data"]["transactions"]) >= 2
    assert IntegrationExecutionLog.objects.count() >= 2

