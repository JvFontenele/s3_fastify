#!/bin/sh
set -e

echo "⏳ Waiting for database..."

until nc -z postgres 5432; do
  sleep 1
done

echo "✅ Database is up"

echo "🚀 Running Prisma migrations..."
npx prisma migrate deploy

echo "🔥 Starting server..."
npm run start
