#!/bin/bash
set -e

echo "Building app..."
pnpm run build

echo "Deploying Worker..."
pnpm exec wrangler deploy --config wrangler.worker.toml

echo "Deploying Pages..."
pnpm exec wrangler pages deploy dist --project-name pepguideiq --branch main

echo "Done. Worker + Pages deployed."
