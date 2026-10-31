from __future__ import annotations

import logging
from django.core.management.base import BaseCommand
from crm.services.notion_provisioner import NotionProvisionerService

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Provisions Kevin's Construction OS in Notion, seeds PostgreSQL 18, and generates Part 1 submission documents."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("1. Generating Assessment Part 1 submission files (.docx, .pdf, .png)..."))
        try:
            from scripts.generate_submission_docs import main as generate_part1_docs
            docs = generate_part1_docs()
            for k, v in docs.items():
                self.stdout.write(self.style.SUCCESS(f"   - {k}: {v}"))
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f"   Skipping submission docs generation in production: {exc}"))

        self.stdout.write(self.style.NOTICE("2. Provisioning Notion workspace under Kevin's Construction OS..."))
        service = NotionProvisionerService()
        cfg = service.provision_notion_workspace()
        self.stdout.write(self.style.SUCCESS(f"   - Hub Page URL: {cfg.hub_page_url}"))
        self.stdout.write(self.style.SUCCESS(f"   - Sales Dashboard URL: {cfg.sales_dashboard_url}"))
        self.stdout.write(self.style.SUCCESS(f"   - Contacts DB: {cfg.contacts_db_id}"))
        self.stdout.write(self.style.SUCCESS(f"   - Opportunities DB: {cfg.opportunities_db_id}"))
        self.stdout.write(self.style.SUCCESS(f"   - Activities DB: {cfg.activities_db_id}"))
        self.stdout.write(self.style.SUCCESS(f"   - Projects DB: {cfg.projects_db_id}"))
        self.stdout.write(self.style.SUCCESS(f"   - Tasks DB: {cfg.tasks_db_id}"))
        self.stdout.write(self.style.SUCCESS(f"   - Materials DB: {cfg.materials_db_id}"))
        self.stdout.write(self.style.SUCCESS(f"   - Project Costs DB: {cfg.costs_db_id}"))
