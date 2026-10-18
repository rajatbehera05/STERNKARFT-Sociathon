#!/bin/sh
set -e

echo "===================================================="
echo "[STERN-X Backend] Starting container entrypoint"
echo "===================================================="

# 1. Wait for database readiness
echo "[STERN-X Backend] Checking database readiness..."
node scripts/wait-for-db.js

# 2. Controlled schema initialization
# For fresh local Docker environments, AUTO_DB_INIT=true safely syncs the schema
# without dropping tables or resetting migration history.
if [ "$AUTO_DB_INIT" = "true" ]; then
  echo "[STERN-X Backend] AUTO_DB_INIT=true. Synchronizing Prisma schema to PostgreSQL..."
  npx prisma db push --skip-generate
else
  echo "[STERN-X Backend] AUTO_DB_INIT is false. Skipping automated schema sync."
fi

# 3. Controlled seed execution
# Disabled by default (AUTO_DB_SEED=false) to prevent accidental data overwrites
if [ "$AUTO_DB_SEED" = "true" ]; then
  echo "[STERN-X Backend] AUTO_DB_SEED=true. Executing database seed script..."
  node dist/db/seed.js
fi

echo "[STERN-X Backend] Starting backend service: $@"
exec "$@"
