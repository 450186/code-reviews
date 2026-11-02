#!/bin/sh
# Apply any pending Prisma migrations and seed the database before starting the API.
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Seeding database (no-op if already seeded)..."
node prisma/seed.ts

exec "$@"
