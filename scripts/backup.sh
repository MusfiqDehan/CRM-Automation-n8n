#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Kevin's Construction OS — Database & State Backup Utility
# ─────────────────────────────────────────────────────────────────────────────

set -Eeuo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

echo "Creating PostgreSQL backup..."
docker exec -t crm_prod_db pg_dump -U kevin_os_user kevin_construction_os_prod | gzip > "$BACKUP_DIR/db_${TIMESTAMP}.sql.gz"

echo "PostgreSQL backup created at: $BACKUP_DIR/db_${TIMESTAMP}.sql.gz"

