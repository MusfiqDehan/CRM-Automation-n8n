import logging
from django.conf import settings
from django.core.management.base import BaseCommand
from crm.models import EmailCommunicationLog, ProjectCost
from crm.services.notion_provisioner import NotionProvisionerService

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Migrates legacy localhost document URLs to canonical production URLs in DB and live Notion pages."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be updated without saving changes or calling Notion.",
        )
        parser.add_argument(
            "--target-base",
            type=str,
            default=getattr(settings, "PUBLIC_API_URL", "https://crm.musfiqdehan.com/api/v1"),
            help="Target public API URL (default: https://crm.musfiqdehan.com/api/v1)",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        target_api_base = options["target_base"].rstrip("/")
        notion_service = NotionProvisionerService()

        self.stdout.write(
            self.style.NOTICE(f"--- Starting Document URL Migration (Target API: {target_api_base}) ---")
        )

        # 1. Update ProjectCost records
        costs = ProjectCost.objects.all()
        updated_costs = 0
        notion_synced = 0

        for cost in costs:
            old_url = cost.supporting_document_url or ""
            canonical_url = f"{target_api_base}/docs/sample-invoice/{cost.document_reference}/"

            needs_update = (
                "localhost:8017" in old_url
                or not old_url
                or old_url != canonical_url
            )

            if needs_update:
                self.stdout.write(
                    f"Cost {cost.document_reference} ({cost.supplier}):\n"
                    f"  Old: {old_url}\n"
                    f"  New: {canonical_url}"
                )
                if not dry_run:
                    cost.supporting_document_url = canonical_url
                    cost.save(update_fields=["supporting_document_url"])
                    updated_costs += 1

                    # Update Notion page directly
                    if cost.notion_page_id and notion_service.api_key:
                        try:
                            resp = notion_service._request(
                                "PATCH",
                                f"/pages/{cost.notion_page_id}",
                                {
                                    "properties": {
                                        "Supporting Document": {"url": canonical_url}
                                    }
                                },
                            )
                            if resp:
                                notion_synced += 1
                                self.stdout.write(
                                    self.style.SUCCESS(
                                        f"  -> Notion Page {cost.notion_page_id} updated with production PDF URL."
                                    )
                                )
                        except Exception as exc:
                            self.stdout.write(
                                self.style.ERROR(
                                    f"  -> Failed to patch Notion page {cost.notion_page_id}: {exc}"
                                )
                            )

        # 2. Update EmailCommunicationLog previews
        email_logs = EmailCommunicationLog.objects.filter(body_preview__contains="localhost:8017")
        updated_emails = 0
        for email in email_logs:
            new_preview = email.body_preview.replace(
                "http://localhost:8017/api/v1", target_api_base
            ).replace(
                "http://localhost:8017", getattr(settings, "PUBLIC_BASE_URL", "https://crm.musfiqdehan.com")
            )
            if not dry_run:
                email.body_preview = new_preview
                email.save(update_fields=["body_preview"])
                updated_emails += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\n=== Migration Complete ===\n"
                f"ProjectCost DB records updated: {updated_costs}\n"
                f"Notion pages live-patched: {notion_synced}\n"
                f"Email logs cleaned: {updated_emails}"
            )
        )
