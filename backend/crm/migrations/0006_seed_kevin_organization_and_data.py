# Generated data migration to initialize Beamline PlatformSettings, Kevin's Organization,
# and associate all pre-existing records to Kevin's organization.

from decimal import Decimal
from django.db import migrations


def seed_kevin_organization(apps, schema_editor):
    Organization = apps.get_model("common", "Organization")
    PlatformSettings = apps.get_model("common", "PlatformSettings")
    OrganizationMember = apps.get_model("common", "OrganizationMember")
    User = apps.get_model("auth", "User")

    # 1. Seed Beamline PlatformSettings
    PlatformSettings.objects.get_or_create(
        id="00000000-0000-0000-0000-000000000001",
        defaults={
            "platform_name": "Beamline",
            "base_domain": "beamline.musfiqdehan.com",
            "google_oauth_client_id": "",
            "google_oauth_client_secret": "",
            "google_oauth_enabled": False,
            "allow_self_registration": False,
        },
    )

    # 2. Seed Kevin's Organization
    kevin_org, _ = Organization.objects.get_or_create(
        slug="kevin",
        defaults={
            "name": "Kevin's Custom Homes",
            "custom_domain": "kevinbuild.com",
            "custom_domain_verified": True,
            "is_active": True,
            "currency": "USD",
            "deal_review_threshold": Decimal("1000000.00"),
            "invoice_review_threshold": Decimal("5000.00"),
            "executive_recipient_email": "kevin@kevinbuild.com",
        },
    )

    # 3. Associate all pre-existing records to Kevin's Organization
    model_names = [
        "ConstructionProject",
        "Contact",
        "EmailCommunicationLog",
        "MaterialOrder",
        "NotionWorkspaceConfig",
        "Opportunity",
        "ProjectCost",
        "ProjectTask",
        "SalesActivity",
        "SMTPSettings",
    ]

    for m_name in model_names:
        Model = apps.get_model("crm", m_name)
        Model.objects.filter(organization__isnull=True).update(organization=kevin_org)

    # 4. Seed default superadmin and kevin user
    admin_user = User.objects.filter(username="admin").first()
    if not admin_user:
        admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@beamline.musfiqdehan.com",
            password="adminpass2026",
        )

    kevin_user = User.objects.filter(username="kevin").first()
    if not kevin_user:
        kevin_user = User.objects.create_user(
            username="kevin",
            email="kevin@kevinbuild.com",
            password="kevinpass2026",
            first_name="Kevin",
            last_name="Founder",
        )

    OrganizationMember.objects.get_or_create(
        organization=kevin_org,
        user=kevin_user,
        defaults={"role": "Owner", "is_active": True},
    )


def rollback_kevin_organization(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("common", "0001_initial"),
        ("crm", "0005_constructionproject_organization_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_kevin_organization, rollback_kevin_organization),
    ]
