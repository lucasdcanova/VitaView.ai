#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if [ -n "${CI_PRIMARY_REPOSITORY_PATH:-}" ] && [ -d "${CI_PRIMARY_REPOSITORY_PATH}" ]; then
  REPO_ROOT="$CI_PRIMARY_REPOSITORY_PATH"
else
  REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
fi

cd "$REPO_ROOT"

echo "[ci_post_clone] Repo root: $REPO_ROOT"
echo "[ci_post_clone] Installing JS dependencies"
npm ci --include=dev

echo "[ci_post_clone] Building web app"
npm run build

echo "[ci_post_clone] Syncing Capacitor iOS assets"
npx cap sync ios

for required_path in \
  "ios/App/App/public" \
  "ios/App/App/config.xml" \
  "ios/App/App/capacitor.config.json"
do
  if [ ! -e "$required_path" ]; then
    echo "[ci_post_clone] Missing required generated asset: $required_path" >&2
    exit 1
  fi
done

echo "[ci_post_clone] Capacitor assets generated successfully"
