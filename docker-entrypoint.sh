#!/bin/sh
set -e

./node_modules/.bin/prisma db push --config=prisma.config.ts --accept-data-loss
exec node server.js
