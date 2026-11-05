#!/usr/bin/env bash
set -e

TARGET_DB="${POSTGRES_DB:-beamline_os}"

# 1. If legacy database exists but target does not, migrate it over
legacy_exists=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='kevin_construction_os'")
target_exists=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='$TARGET_DB'")

if [ "$legacy_exists" = "1" ] && [ "$target_exists" != "1" ]; then
  echo "Migrating legacy kevin_construction_os to $TARGET_DB..."
  psql -U "$POSTGRES_USER" -c "CREATE DATABASE $TARGET_DB WITH TEMPLATE kevin_construction_os OWNER $POSTGRES_USER;"
  target_exists="1"
fi

# 2. Ensure target database exists
if [ "$target_exists" != "1" ]; then
  echo "Creating target database $TARGET_DB..."
  psql -U "$POSTGRES_USER" -c "CREATE DATABASE $TARGET_DB OWNER $POSTGRES_USER;"
fi

# 3. Clean up legacy database to avoid duplicates
if [ "$legacy_exists" = "1" ] && [ "$TARGET_DB" != "kevin_construction_os" ]; then
  echo "Removing legacy database kevin_construction_os to prevent duplicate databases..."
  psql -U "$POSTGRES_USER" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'kevin_construction_os';" || true
  psql -U "$POSTGRES_USER" -c "DROP DATABASE IF EXISTS kevin_construction_os;" || true
fi
