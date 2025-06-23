#!/bin/sh

echo "Running Prisma generate..."
npx prisma generate

echo "Running Prisma migrate deploy..."
npx prisma migrate deploy

echo "Running Prisma seed..."
npx prisma db seed

echo "Starting server..."
exec node dist/index.js