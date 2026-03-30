#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"

ASC_API_KEY_ID="${ASC_API_KEY_ID:-}"
ASC_API_ISSUER_ID="${ASC_API_ISSUER_ID:-}"
ASC_PROVIDER_PUBLIC_ID="${ASC_PROVIDER_PUBLIC_ID:-}"
APP_STORE_APPLE_ID="${APP_STORE_APPLE_ID:-}"
IPA_PATH="${IOS_IPA_PATH:-$REPO_ROOT/build/ios/app-store/App.ipa}"

for required_var in ASC_API_KEY_ID ASC_API_ISSUER_ID APP_STORE_APPLE_ID; do
  eval "value=\${$required_var}"
  if [ -z "$value" ]; then
    echo "[ios:publish:app-store] Missing required env var: $required_var" >&2
    exit 1
  fi
done

if [ ! -f "$IPA_PATH" ]; then
  echo "[ios:publish:app-store] IPA not found at $IPA_PATH; building first"
  sh "$SCRIPT_DIR/build-ios-app-store.sh"
fi

APP_METADATA=$(python3 - "$IPA_PATH" <<'PY'
import json
import plistlib
import sys
import zipfile

ipa_path = sys.argv[1]
with zipfile.ZipFile(ipa_path) as ipa:
    info_plist_path = next(name for name in ipa.namelist() if name.endswith(".app/Info.plist"))
    info = plistlib.loads(ipa.read(info_plist_path))

print(json.dumps({
    "bundle_id": info["CFBundleIdentifier"],
    "short_version": info["CFBundleShortVersionString"],
    "bundle_version": info["CFBundleVersion"],
}))
PY
)

BUNDLE_ID=$(printf '%s' "$APP_METADATA" | python3 -c 'import json,sys; print(json.load(sys.stdin)["bundle_id"])')
SHORT_VERSION=$(printf '%s' "$APP_METADATA" | python3 -c 'import json,sys; print(json.load(sys.stdin)["short_version"])')
BUNDLE_VERSION=$(printf '%s' "$APP_METADATA" | python3 -c 'import json,sys; print(json.load(sys.stdin)["bundle_version"])')

echo "[ios:publish:app-store] Uploading $BUNDLE_ID $SHORT_VERSION ($BUNDLE_VERSION) via upload-package"
set -- \
  --upload-package "$IPA_PATH" \
  -t ios \
  --apple-id "$APP_STORE_APPLE_ID" \
  --bundle-version "$BUNDLE_VERSION" \
  --bundle-short-version-string "$SHORT_VERSION" \
  --bundle-id "$BUNDLE_ID" \
  --apiKey "$ASC_API_KEY_ID" \
  --apiIssuer "$ASC_API_ISSUER_ID" \
  --output-format json \
  --show-progress \
  --wait

if [ -n "$ASC_PROVIDER_PUBLIC_ID" ]; then
  set -- --provider-public-id "$ASC_PROVIDER_PUBLIC_ID" "$@"
fi

DEVELOPER_DIR="$DEVELOPER_DIR" xcrun altool "$@"
