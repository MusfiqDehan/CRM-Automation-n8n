from __future__ import annotations

from django.urls import path
from crm.views import (
    AutomationSimulatorAPIView,
    BlueprintDownloadAPIView,
    ConstructionProjectDetailAPIView,
    ConstructionProjectListCreateAPIView,
    ContactDetailAPIView,
    ContactListCreateAPIView,
    DashboardSummaryAPIView,
    EmailCommunicationLogDetailAPIView,
    EmailCommunicationLogListCreateAPIView,
    InvoiceExtractAPIView,
    InvoiceProcessAPIView,
    MaterialOrderDetailAPIView,
    MaterialOrderListCreateAPIView,
    NotionProvisionAPIView,
    OpportunityDetailAPIView,
    OpportunityListCreateAPIView,
    ProjectCostDetailAPIView,
    ProjectCostListCreateAPIView,
    ProjectTaskDetailAPIView,
    ProjectTaskListCreateAPIView,
    SalesActivityDetailAPIView,
    SalesActivityListCreateAPIView,
    SampleInvoicePDFAPIView,
    SMTPSettingsAPIView,
    SMTPTestConnectionAPIView,
    ClientEmailTriggerAPIView,
    OAuthPublicConfigAPIView,
    LoginAPIView,
    GoogleOAuthAPIView,
    MeAPIView,
    PlatformSettingsAPIView,
    SuperadminOrganizationListCreateAPIView,
    SuperadminOrganizationDetailAPIView,
    SuperadminInvitationAPIView,
    TenantSettingsAPIView,
    TenantMemberListCreateAPIView,
    AcceptInvitationAPIView,
)

urlpatterns = [
    # 1. Contacts & Enquiries (CRM)
    path("contacts/", ContactListCreateAPIView.as_view(), name="contact-list"),
    path("contacts", ContactListCreateAPIView.as_view()),
    path("contacts/<str:pk>/", ContactDetailAPIView.as_view(), name="contact-detail"),
    path("contacts/<str:pk>", ContactDetailAPIView.as_view()),

    # 2. Opportunities (High-Value Deals $3M+)
    path("opportunities/", OpportunityListCreateAPIView.as_view(), name="opportunity-list"),
    path("opportunities", OpportunityListCreateAPIView.as_view()),
    path("opportunities/<str:pk>/", OpportunityDetailAPIView.as_view(), name="opportunity-detail"),
    path("opportunities/<str:pk>", OpportunityDetailAPIView.as_view()),

    # 3. Sales Activities & Touchpoints
    path("activities/", SalesActivityListCreateAPIView.as_view(), name="activity-list"),
    path("activities", SalesActivityListCreateAPIView.as_view()),
    path("activities/<str:pk>/", SalesActivityDetailAPIView.as_view(), name="activity-detail"),
    path("activities/<str:pk>", SalesActivityDetailAPIView.as_view()),

    # 4. Construction Projects (4-Phase Template)
    path("projects/", ConstructionProjectListCreateAPIView.as_view(), name="project-list"),
    path("projects", ConstructionProjectListCreateAPIView.as_view()),
    path("projects/<str:pk>/", ConstructionProjectDetailAPIView.as_view(), name="project-detail"),
    path("projects/<str:pk>", ConstructionProjectDetailAPIView.as_view()),

    # 5. Project Tasks & Milestone Checklists
    path("tasks/", ProjectTaskListCreateAPIView.as_view(), name="task-list"),
    path("tasks", ProjectTaskListCreateAPIView.as_view()),
    path("tasks/<str:pk>/", ProjectTaskDetailAPIView.as_view(), name="task-detail"),
    path("tasks/<str:pk>", ProjectTaskDetailAPIView.as_view()),

    # 6. Material Orders & Site Procurement
    path("materials/", MaterialOrderListCreateAPIView.as_view(), name="material-list"),
    path("materials", MaterialOrderListCreateAPIView.as_view()),
    path("materials/<str:pk>/", MaterialOrderDetailAPIView.as_view(), name="material-detail"),
    path("materials/<str:pk>", MaterialOrderDetailAPIView.as_view()),
    path("material-orders/", MaterialOrderListCreateAPIView.as_view(), name="material-order-list"),
    path("material-orders", MaterialOrderListCreateAPIView.as_view()),
    path("material-orders/<str:pk>/", MaterialOrderDetailAPIView.as_view(), name="material-order-detail"),
    path("material-orders/<str:pk>", MaterialOrderDetailAPIView.as_view()),

    # 7. Project Costs & Subcontractor Invoices
    path("costs/", ProjectCostListCreateAPIView.as_view(), name="cost-list"),
    path("costs", ProjectCostListCreateAPIView.as_view()),
    path("costs/<str:pk>/", ProjectCostDetailAPIView.as_view(), name="cost-detail"),
    path("costs/<str:pk>", ProjectCostDetailAPIView.as_view()),

    # 8. Email Communication Logs & Stakeholder Notifications
    path("notifications/", EmailCommunicationLogListCreateAPIView.as_view(), name="notification-list"),
    path("notifications", EmailCommunicationLogListCreateAPIView.as_view()),
    path("notifications/<str:pk>/", EmailCommunicationLogDetailAPIView.as_view(), name="notification-detail"),
    path("notifications/<str:pk>", EmailCommunicationLogDetailAPIView.as_view()),
    path("email-logs/", EmailCommunicationLogListCreateAPIView.as_view(), name="email-log-list"),
    path("email-logs", EmailCommunicationLogListCreateAPIView.as_view()),
    path("email-logs/<str:pk>/", EmailCommunicationLogDetailAPIView.as_view(), name="email-log-detail"),
    path("email-logs/<str:pk>", EmailCommunicationLogDetailAPIView.as_view()),

    # 9. Executive Summary & Dashboard Metrics
    path("dashboard/summary/", DashboardSummaryAPIView.as_view(), name="dashboard-summary"),
    path("dashboard/summary", DashboardSummaryAPIView.as_view()),

    # 10. Notion OS Workspace Bidirectional Provisioning
    path("notion/provision/", NotionProvisionAPIView.as_view(), name="notion-provision"),
    path("notion/provision", NotionProvisionAPIView.as_view()),

    # 11. Invoice Extraction & Deduplication Endpoints (called by n8n or direct upload)
    path("invoices/extract/", InvoiceExtractAPIView.as_view(), name="invoice-extract"),
    path("invoices/extract", InvoiceExtractAPIView.as_view()),
    path("invoices/process/", InvoiceProcessAPIView.as_view(), name="invoice-process"),
    path("invoices/process", InvoiceProcessAPIView.as_view()),

    # 12. Test Bench & Scenario Simulator
    path("simulator/trigger/", AutomationSimulatorAPIView.as_view(), name="simulator-trigger"),
    path("simulator/trigger", AutomationSimulatorAPIView.as_view()),

    # 13. Dynamic PDF Invoice & Document Downloads
    path("docs/sample-invoice/<str:doc_ref>/", SampleInvoicePDFAPIView.as_view(), name="sample-invoice-pdf"),
    path("docs/download/<str:filetype>/", BlueprintDownloadAPIView.as_view(), name="blueprint-download"),

    # 14. Dynamic SMTP Settings & Live Connection Testing
    path("settings/smtp/", SMTPSettingsAPIView.as_view(), name="smtp-settings"),
    path("settings/smtp", SMTPSettingsAPIView.as_view()),
    path("settings/smtp/test/", SMTPTestConnectionAPIView.as_view(), name="smtp-test-connection"),
    path("settings/smtp/test", SMTPTestConnectionAPIView.as_view()),

    # 15. Client & Stakeholder Email Automations (Part 3 Assessment)
    path("client-emails/trigger/", ClientEmailTriggerAPIView.as_view(), name="client-email-trigger"),
    path("client-emails/trigger", ClientEmailTriggerAPIView.as_view()),

    # 16. Multi-Tenant Auth & Dynamic OAuth Endpoints
    path("auth/oauth-config/", OAuthPublicConfigAPIView.as_view(), name="oauth-config"),
    path("auth/oauth-config", OAuthPublicConfigAPIView.as_view()),
    path("auth/login/", LoginAPIView.as_view(), name="auth-login"),
    path("auth/login", LoginAPIView.as_view()),
    path("auth/google/", GoogleOAuthAPIView.as_view(), name="auth-google"),
    path("auth/google", GoogleOAuthAPIView.as_view()),
    path("auth/me/", MeAPIView.as_view(), name="auth-me"),
    path("auth/me", MeAPIView.as_view()),

    # 17. Platform Superadmin Control Plane
    path("superadmin/platform-settings/", PlatformSettingsAPIView.as_view(), name="superadmin-platform-settings"),
    path("superadmin/platform-settings", PlatformSettingsAPIView.as_view()),
    path("superadmin/organizations/", SuperadminOrganizationListCreateAPIView.as_view(), name="superadmin-organizations-list"),
    path("superadmin/organizations", SuperadminOrganizationListCreateAPIView.as_view()),
    path("superadmin/organizations/<str:pk>/", SuperadminOrganizationDetailAPIView.as_view(), name="superadmin-organization-detail"),
    path("superadmin/organizations/<str:pk>", SuperadminOrganizationDetailAPIView.as_view()),
    path("superadmin/invitations/", SuperadminInvitationAPIView.as_view(), name="superadmin-invitations"),
    path("superadmin/invitations", SuperadminInvitationAPIView.as_view()),

    # 18. Client Tenant Settings & Team Invitations
    path("tenant/settings/", TenantSettingsAPIView.as_view(), name="tenant-settings"),
    path("tenant/settings", TenantSettingsAPIView.as_view()),
    path("tenant/members/", TenantMemberListCreateAPIView.as_view(), name="tenant-members"),
    path("tenant/members", TenantMemberListCreateAPIView.as_view()),
    path("invitations/accept/", AcceptInvitationAPIView.as_view(), name="invitations-accept"),
    path("invitations/accept", AcceptInvitationAPIView.as_view()),
]
