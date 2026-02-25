#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if [ -n "${CI_PRIMARY_REPOSITORY_PATH:-}" ] && [ -d "${CI_PRIMARY_REPOSITORY_PATH}" ]; then
  REPO_ROOT="$CI_PRIMARY_REPOSITORY_PATH"
else
  REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
fi

cd "$REPO_ROOT"

ensure_node_tooling() {
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    return 0
  fi

  for candidate in /opt/homebrew/bin /usr/local/bin; do
    if [ -d "$candidate" ]; then
      PATH="$candidate:$PATH"
    fi
  done
  if [ -n "${HOME:-}" ] && [ -d "$HOME/.volta/bin" ]; then
    PATH="$HOME/.volta/bin:$PATH"
  fi
  export PATH

  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    return 0
  fi

  BREW_BIN=""
  for candidate in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    if [ -x "$candidate" ]; then
      BREW_BIN="$candidate"
      break
    fi
  done
  if [ -z "$BREW_BIN" ] && command -v brew >/dev/null 2>&1; then
    BREW_BIN=$(command -v brew)
  fi

  if [ -n "$BREW_BIN" ]; then
    echo "[ci_pre_xcodebuild] npm not found; installing Node via Homebrew"
    "$BREW_BIN" install node@20 || "$BREW_BIN" install node

    for candidate in /opt/homebrew/opt/node@20/bin /usr/local/opt/node@20/bin /opt/homebrew/bin /usr/local/bin; do
      if [ -d "$candidate" ]; then
        PATH="$candidate:$PATH"
      fi
    done
    export PATH
  fi

  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "[ci_pre_xcodebuild] node/npm not available after bootstrap" >&2
    echo "[ci_pre_xcodebuild] PATH=$PATH" >&2
    exit 1
  fi
}

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
  ensure_node_tooling
  echo "[ci_pre_xcodebuild] node: $(node -v)"
  echo "[ci_pre_xcodebuild] npm: $(npm -v)"

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
