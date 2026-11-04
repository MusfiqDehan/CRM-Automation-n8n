from __future__ import annotations

from django.urls import path
from integrations.views import (
    IntegrationLogsAndTransactionsAPIView,
    PaymentCheckoutAPIView,
    PaymentWebhookAPIView,
    SuperadminIntegrationDetailAPIView,
    SuperadminIntegrationListAPIView,
    SuperadminIntegrationTestAPIView,
    TenantIntegrationActionAPIView,
    TenantIntegrationDetailAPIView,
    TenantIntegrationListAPIView,
    TenantIntegrationTestAPIView,
)

urlpatterns = [
    # Platform Superadmin Integrations Governance & Credentials
    path(
        "superadmin/providers/",
        SuperadminIntegrationListAPIView.as_view(),
        name="superadmin-integrations-list",
    ),
    path("superadmin/providers", SuperadminIntegrationListAPIView.as_view()),
    path(
        "superadmin/providers/<str:provider_key>/",
        SuperadminIntegrationDetailAPIView.as_view(),
        name="superadmin-integrations-detail",
    ),
    path(
        "superadmin/providers/<str:provider_key>",
        SuperadminIntegrationDetailAPIView.as_view(),
    ),
    path(
        "superadmin/providers/<str:provider_key>/test/",
        SuperadminIntegrationTestAPIView.as_view(),
        name="superadmin-integrations-test",
    ),
    path(
        "superadmin/providers/<str:provider_key>/test",
        SuperadminIntegrationTestAPIView.as_view(),
    ),
    # Tenant Organization Integrations & BYOC Credentials
    path(
        "tenant/providers/",
        TenantIntegrationListAPIView.as_view(),
        name="tenant-integrations-list",
    ),
    path("tenant/providers", TenantIntegrationListAPIView.as_view()),
    path(
        "tenant/providers/<str:provider_key>/",
        TenantIntegrationDetailAPIView.as_view(),
        name="tenant-integrations-detail",
    ),
    path(
        "tenant/providers/<str:provider_key>",
        TenantIntegrationDetailAPIView.as_view(),
    ),
    path(
        "tenant/providers/<str:provider_key>/test/",
        TenantIntegrationTestAPIView.as_view(),
        name="tenant-integrations-test",
    ),
    path(
        "tenant/providers/<str:provider_key>/test",
        TenantIntegrationTestAPIView.as_view(),
    ),
    path(
        "tenant/providers/<str:provider_key>/action/",
        TenantIntegrationActionAPIView.as_view(),
        name="tenant-integrations-action",
    ),
    path(
        "tenant/providers/<str:provider_key>/action",
        TenantIntegrationActionAPIView.as_view(),
    ),
    # Unified Payment Gateways (Stripe, bKash, SSLCommerz)
    path(
        "payments/checkout/",
        PaymentCheckoutAPIView.as_view(),
        name="integrations-payment-checkout",
    ),
    path("payments/checkout", PaymentCheckoutAPIView.as_view()),
    path(
        "payments/webhook/<str:provider_key>/",
        PaymentWebhookAPIView.as_view(),
        name="integrations-payment-webhook",
    ),
    path(
        "payments/webhook/<str:provider_key>",
        PaymentWebhookAPIView.as_view(),
    ),
    # Execution Audit Logs & Payment Ledger
    path(
        "logs/",
        IntegrationLogsAndTransactionsAPIView.as_view(),
        name="integrations-logs",
    ),
    path("logs", IntegrationLogsAndTransactionsAPIView.as_view()),
]

