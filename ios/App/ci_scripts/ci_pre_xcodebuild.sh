#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if [ -n "${CI_PRIMARY_REPOSITORY_PATH:-}" ] && [ -d "${CI_PRIMARY_REPOSITORY_PATH}" ]; then
  REPO_ROOT="$CI_PRIMARY_REPOSITORY_PATH"
else
  REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
fi

cd "$REPO_ROOT"

install_js_dependencies() {
  if npm ci --include=dev; then
    return 0
  fi

  echo "[ci_pre_xcodebuild] npm ci failed; lockfile may be out of sync. Falling back to npm install."
  npm install --include=dev
}

ensure_node_tooling() {
  REQUIRED_NODE_MAJOR=22

  current_node_major() {
    if ! command -v node >/dev/null 2>&1; then
      echo 0
      return 0
    fi
    node_v=$(node -v 2>/dev/null || true)
    node_v=${node_v#v}
    printf '%s\n' "${node_v%%.*}"
  }

  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    if [ "$(current_node_major)" -ge "$REQUIRED_NODE_MAJOR" ]; then
      return 0
    fi
  fi

  for candidate in /opt/homebrew/opt/node@22/bin /usr/local/opt/node@22/bin /opt/homebrew/bin /usr/local/bin; do
    if [ -d "$candidate" ]; then
      PATH="$candidate:$PATH"
    fi
  done
  if [ -n "${HOME:-}" ] && [ -d "$HOME/.volta/bin" ]; then
    PATH="$HOME/.volta/bin:$PATH"
  fi
  export PATH

  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    if [ "$(current_node_major)" -ge "$REQUIRED_NODE_MAJOR" ]; then
      return 0
    fi
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
    echo "[ci_pre_xcodebuild] Node <${REQUIRED_NODE_MAJOR} or npm missing; installing Node via Homebrew"
    "$BREW_BIN" install node@22 || "$BREW_BIN" install node

    for candidate in /opt/homebrew/opt/node@22/bin /usr/local/opt/node@22/bin /opt/homebrew/bin /usr/local/bin; do
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
  if [ "$(current_node_major)" -lt "$REQUIRED_NODE_MAJOR" ]; then
    echo "[ci_pre_xcodebuild] NodeJS >=${REQUIRED_NODE_MAJOR} is required; found $(node -v)" >&2
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

# Build number is controlled by CURRENT_PROJECT_VERSION in project.pbxproj and
# bumped manually per release. Previous attempts to override via agvtool here
# were no-ops because the project doesn't use VERSIONING_SYSTEM=apple-generic.

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
    install_js_dependencies
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

cd ios/App
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
if [ -f "Podfile" ]; then
  if ! command -v pod >/dev/null 2>&1; then
    echo "[ci_pre_xcodebuild] Podfile found but CocoaPods is not installed" >&2
    exit 1
  fi
  if [ ! -d "Pods" ] || [ ! -f "Podfile.lock" ]; then
    echo "[ci_pre_xcodebuild] Pods missing, running pod install"
    pod install
  else
    echo "[ci_pre_xcodebuild] Pods already installed"
  fi
else
  echo "[ci_pre_xcodebuild] Podfile not found (Swift Package Manager setup), skipping CocoaPods"
fi
