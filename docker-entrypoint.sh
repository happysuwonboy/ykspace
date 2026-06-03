#!/bin/sh
set -e

echo "Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "Seeding database..."
node node_modules/tsx/dist/cli.mjs prisma/seed.ts

echo "Starting server..."
exec node server.js
