#!/bin/bash
set -e

echo "Building app..."
npm run build

echo "Deploying Worker..."
npx wrangler deploy --config wrangler.worker.toml

echo "Deploying Pages..."
npx wrangler pages deploy dist --project-name pepguideiq --branch main

echo "Done. Worker + Pages deployed."
