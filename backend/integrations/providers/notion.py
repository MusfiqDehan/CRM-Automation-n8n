from __future__ import annotations

from typing import Any
import httpx
from django.conf import settings
from integrations.providers.base import BaseIntegrationProvider, FieldSchema
from integrations.providers.registry import register_provider

DEFAULT_NOTION_WORKSPACE_STATE: dict[str, Any] = {
    "hub_page_id": "4098194e-c3e8-811a-b5b1-c1b79f62bce1",
    "hub_page_url": "https://app.notion.com/p/Kevin-s-Construction-OS-4098194ec3e8811ab5b1c1b79f62bce1",
    "contacts_db_id": "4098194e-c3e8-81aa-ac76-e9668e95261a",
    "contacts_db_url": "https://app.notion.com/p/4098194ec3e881aaac76e9668e95261a",
    "opportunities_db_id": "4098194e-c3e8-81a3-ae85-ec1a2f2474e7",
    "opportunities_db_url": "https://app.notion.com/p/4098194ec3e881a3ae85ec1a2f2474e7",
    "activities_db_id": "4098194e-c3e8-81f1-a84c-dd3d785e299a",
    "activities_db_url": "https://app.notion.com/p/4098194ec3e881f1a84cdd3d785e299a",
    "projects_db_id": "4098194e-c3e8-819d-8936-e84f7c594da4",
    "projects_db_url": "https://app.notion.com/p/4098194ec3e8819d8936e84f7c594da4",
    "tasks_db_id": "4098194e-c3e8-817d-9519-ca6a6950286e",
    "tasks_db_url": "https://app.notion.com/p/4098194ec3e8817d9519ca6a6950286e",
    "materials_db_id": "4098194e-c3e8-8133-8d42-e75cef33f7e4",
    "materials_db_url": "https://app.notion.com/p/4098194ec3e881338d42e75cef33f7e4",
    "costs_db_id": "4098194e-c3e8-8168-80a6-ee408dd1a250",
    "costs_db_url": "https://app.notion.com/p/4098194ec3e8816880a6ee408dd1a250",
    "sales_dashboard_page_id": "4098194e-c3e8-8111-9177-d08ccaa4c436",
    "sales_dashboard_url": "https://app.notion.com/p/Sales-Dashboard-Executive-Pipeline-Overview-4098194ec3e881119177d08ccaa4c436",
    "last_synced_at": None,
}


@register_provider
class NotionProvider(BaseIntegrationProvider):
    provider_key = "notion"
    name = "Notion Workspace OS"
    category = "workspace"
    description = (
        "Bidirectional synchronization with Notion databases for Sales CRM, "
        "4-Phase Construction Projects, Material Orders, Project Costs, and Executive Dashboards."
    )
    icon_name = "Database"
    docs_url = "https://www.notion.so/my-integrations"
    feature_flag_key = "sub_integration_notion"
    supports_platform_fallback = True
    supports_tenant_byoc = True
    supports_webhooks = False

    credential_schema = [
        FieldSchema(
            key="api_key",
            label="Notion Internal Integration Token",
            field_type="secret",
            required=True,
            placeholder="ntn_••••••••••••••••••••••••••••••••••••",
            help_text="Secret token from Notion My Integrations with Read, Update, and Insert content capabilities.",
        ),
    ]

    config_schema = [
        FieldSchema(
            key="hub_page_id",
            label="Root Hub Page ID",
            field_type="text",
            required=True,
            default="4098194e-c3e8-811a-b5b1-c1b79f62bce1",
            placeholder="4098194e-c3e8-811a-b5b1-c1b79f62bce1",
            help_text="The parent Notion Page ID shared with your Notion integration where the 7 databases live.",
        ),
        FieldSchema(
            key="notion_version",
            label="Notion API Version",
            field_type="text",
            required=False,
            default="2022-06-28",
            placeholder="2022-06-28",
            help_text="Notion REST API version header.",
        ),
        FieldSchema(
            key="auto_sync_on_write",
            label="Real-Time Auto-Sync on Record Updates",
            field_type="boolean",
            required=False,
            default=True,
            help_text="Automatically push new/updated Deals and Project Costs to Notion in real time.",
        ),
    ]

    supported_actions = [
        {
            "action": "provision_workspace",
            "label": "Provision & Sync Notion OS",
            "description": "Provisions the 7 connected databases in Notion and synchronizes all records.",
        }
    ]

    @classmethod
    def get_default_platform_credentials(cls) -> dict[str, Any]:
        return {
            "api_key": getattr(settings, "NOTION_API_KEY", "") or "",
        }

    @classmethod
    def get_default_platform_config(cls) -> dict[str, Any]:
        root_id = getattr(
            settings, "NOTION_ROOT_PAGE_ID", "4098194e-c3e8-811a-b5b1-c1b79f62bce1"
        )
        return {
            **DEFAULT_NOTION_WORKSPACE_STATE,
            "hub_page_id": root_id,
            "notion_version": getattr(settings, "NOTION_VERSION", "2022-06-28"),
            "auto_sync_on_write": True,
        }

    @classmethod
    def get_default_tenant_config(cls) -> dict[str, Any]:
        return cls.get_default_platform_config()

    def test_connection(
        self,
        credentials: dict[str, Any],
        config: dict[str, Any],
        organization: Any = None,
    ) -> tuple[bool, str, dict[str, Any]]:
        api_key = str(credentials.get("api_key") or "").strip()
        hub_page_id = str(
            config.get("hub_page_id") or DEFAULT_NOTION_WORKSPACE_STATE["hub_page_id"]
        ).strip()
        notion_version = str(config.get("notion_version") or "2022-06-28").strip()

        if not api_key:
            return (
                True,
                f"Notion workspace configured in local/offline mode (Hub Page: {hub_page_id}). Add a live Notion API token to enable remote API calls.",
                {"mode": "offline_ready", "hub_page_id": hub_page_id},
            )

        try:
            with httpx.Client(timeout=12.0) as client:
                resp = client.get(
                    "https://api.notion.com/v1/users/me",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Notion-Version": notion_version,
                    },
                )
                if resp.status_code == 200:
                    bot_info = resp.json()
                    bot_name = bot_info.get("name", "Notion Bot")
                    return (
                        True,
                        f"Successfully authenticated with Notion API as '{bot_name}' (Hub Page: {hub_page_id}).",
                        {"bot_name": bot_name, "hub_page_id": hub_page_id},
                    )
                return (
                    False,
                    f"Notion API returned HTTP {resp.status_code}: {resp.text[:200]}",
                    {"status_code": resp.status_code},
                )
        except Exception as exc:
            return False, f"Network error connecting to Notion API: {exc}", {}

    def execute_action(
        self,
        action: str,
        payload: dict[str, Any],
        credentials: dict[str, Any],
        config: dict[str, Any],
        organization: Any = None,
    ) -> tuple[bool, str, dict[str, Any]]:
        if action == "provision_workspace":
            from crm.services.notion_provisioner import NotionProvisionerService

            service = NotionProvisionerService(
                api_key=str(credentials.get("api_key") or ""),
                root_page_id=str(
                    config.get("hub_page_id")
                    or DEFAULT_NOTION_WORKSPACE_STATE["hub_page_id"]
                ),
                organization=organization,
            )
            workspace_data = service.provision_notion_workspace()
            return (
                True,
                "Notion Construction OS workspace provisioned and synchronized.",
                workspace_data,
            )
        return super().execute_action(action, payload, credentials, config, organization)

