#!/usr/bin/env bash
#
# Build alfagok and copy it to datala.nl/alfagok/. The rest of datala.nl is deployed from the datala repo
# (`make deploy-datala.nl`, which runs this too).

set -euo pipefail

cd "$(dirname "$0")"

DEPLOY_HOST="${DEPLOY_HOST:-deployer@datala.nl}"

npm ci --no-audit --no-fund
npm run --silent build -- --logLevel warn
# --delete clears the previous build's hashed assets.
rsync -a --delete dist/ "$DEPLOY_HOST:/srv/datala.nl/public/alfagok/"
