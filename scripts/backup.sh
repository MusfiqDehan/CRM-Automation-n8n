#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Beamline — Database & State Backup Utility
# ─────────────────────────────────────────────────────────────────────────────

set -Eeuo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

echo "Creating PostgreSQL backup..."
docker exec -t beamline_prod_db pg_dump -U "${POSTGRES_USER:-beamline_user}" "${POSTGRES_DB:-beamline_prod}" | gzip > "$BACKUP_DIR/db_${TIMESTAMP}.sql.gz"

echo "PostgreSQL backup created at: $BACKUP_DIR/db_${TIMESTAMP}.sql.gz"

