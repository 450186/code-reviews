#!/bin/sh
# Apply any pending Prisma migrations, seed, and ingest World Bank data before starting the API.
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Seeding database (no-op if already seeded)..."
node prisma/seed.ts

echo "Ingesting World Bank data (no-op if already populated)..."
node dist/ingest/worldbank.js

exec "$@"
