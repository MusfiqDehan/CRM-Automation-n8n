#!/usr/bin/env bash
set -e

# Ensure both beamline_os and kevin_construction_os exist for full backward compatibility
for db in beamline_os kevin_construction_os; do
  db_exists=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='$db'")
  if [ "$db_exists" != "1" ]; then
    echo "Creating database $db..."
    psql -U "$POSTGRES_USER" -c "CREATE DATABASE $db;"
  fi
done
