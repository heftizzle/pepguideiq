#!/bin/bash
# WSL/Git Bash: ensure Windows Node is on PATH for the npm-installed `pnpm` shim.
export PATH="$PATH:/mnt/c/Program Files/nodejs"

set -e

echo "Building app..."
pnpm run build

echo "Deploying Worker..."
pnpm exec wrangler deploy --config wrangler.worker.toml

echo "Deploying Pages..."
pnpm exec wrangler pages deploy dist --project-name pepguideiq --branch main

echo "Done. Worker + Pages deployed."
