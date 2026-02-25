#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if [ -n "${CI_PRIMARY_REPOSITORY_PATH:-}" ] && [ -d "${CI_PRIMARY_REPOSITORY_PATH}" ]; then
  REPO_ROOT="$CI_PRIMARY_REPOSITORY_PATH"
else
  REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
fi

cd "$REPO_ROOT"

echo "[ci_pre_xcodebuild] Repo root: $REPO_ROOT"
if command -v node >/dev/null 2>&1; then
  echo "[ci_pre_xcodebuild] node: $(node -v)"
fi
if command -v npm >/dev/null 2>&1; then
  echo "[ci_pre_xcodebuild] npm: $(npm -v)"
fi

missing=0
for required_path in \
  "ios/App/App/public" \
  "ios/App/App/config.xml" \
  "ios/App/App/capacitor.config.json"
do
  if [ ! -e "$required_path" ]; then
    echo "[ci_pre_xcodebuild] Missing: $required_path"
    missing=1
  fi
done

if [ "$missing" -eq 1 ]; then
  echo "[ci_pre_xcodebuild] Attempting recovery (build + cap sync)"

  if [ ! -d "node_modules" ]; then
    echo "[ci_pre_xcodebuild] node_modules missing, installing dependencies"
    npm ci --include=dev
  fi

  npm run build
  npx cap sync ios
fi

for required_path in \
  "ios/App/App/public" \
  "ios/App/App/config.xml" \
  "ios/App/App/capacitor.config.json"
do
  if [ ! -e "$required_path" ]; then
    echo "[ci_pre_xcodebuild] Missing required asset after recovery: $required_path" >&2
    exit 1
  fi
done

echo "[ci_pre_xcodebuild] Capacitor iOS assets verified"
