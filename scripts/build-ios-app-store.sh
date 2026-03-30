#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

PROJECT_PATH="$REPO_ROOT/ios/App/App.xcodeproj"
SCHEME="${IOS_SCHEME:-App}"
ARCHIVE_PATH="${IOS_ARCHIVE_PATH:-$REPO_ROOT/build/ios/App.xcarchive}"
EXPORT_PATH="${IOS_EXPORT_PATH:-$REPO_ROOT/build/ios/app-store}"
EXPORT_OPTIONS_PATH="$REPO_ROOT/ios/App/ExportOptions.plist"
ASC_AUTH_KEY_PATH="${ASC_AUTH_KEY_PATH:-${ASC_KEY_PATH:-}}"
ASC_AUTH_KEY_ID="${ASC_AUTH_KEY_ID:-${ASC_API_KEY_ID:-${ASC_KEY_ID:-}}}"
ASC_AUTH_ISSUER_ID="${ASC_AUTH_ISSUER_ID:-${ASC_API_ISSUER_ID:-${ASC_ISSUER_ID:-}}}"

XCODE_AUTH_ARGS=""
if [ -n "$ASC_AUTH_KEY_PATH" ] || [ -n "$ASC_AUTH_KEY_ID" ] || [ -n "$ASC_AUTH_ISSUER_ID" ]; then
  if [ -z "$ASC_AUTH_KEY_PATH" ] || [ -z "$ASC_AUTH_KEY_ID" ] || [ -z "$ASC_AUTH_ISSUER_ID" ]; then
    echo "[ios:build:app-store] ASC auth requires key path, key id, and issuer id together" >&2
    exit 1
  fi
  XCODE_AUTH_ARGS=" -authenticationKeyPath \"$ASC_AUTH_KEY_PATH\" -authenticationKeyID \"$ASC_AUTH_KEY_ID\" -authenticationKeyIssuerID \"$ASC_AUTH_ISSUER_ID\""
fi

echo "[ios:build:app-store] Preparing Capacitor iOS project"
"$REPO_ROOT/ci_scripts/ci_pre_xcodebuild.sh"

rm -rf "$ARCHIVE_PATH" "$EXPORT_PATH"
mkdir -p "$(dirname "$ARCHIVE_PATH")" "$EXPORT_PATH"

echo "[ios:build:app-store] Archiving Release build for generic iOS device"
eval "xcodebuild \
  -project \"$PROJECT_PATH\" \
  -scheme \"$SCHEME\" \
  -configuration Release \
  -destination \"generic/platform=iOS\" \
  -archivePath \"$ARCHIVE_PATH\" \
  -allowProvisioningUpdates \
  $XCODE_AUTH_ARGS \
  archive"

echo "[ios:build:app-store] Exporting archive for App Store Connect"
eval "xcodebuild \
  -exportArchive \
  -archivePath \"$ARCHIVE_PATH\" \
  -exportPath \"$EXPORT_PATH\" \
  -exportOptionsPlist \"$EXPORT_OPTIONS_PATH\" \
  -allowProvisioningUpdates \
  $XCODE_AUTH_ARGS"

IPA_PATH=$(find "$EXPORT_PATH" -maxdepth 1 -name "*.ipa" -print -quit || true)

echo "[ios:build:app-store] Archive ready: $ARCHIVE_PATH"
if [ -n "$IPA_PATH" ]; then
  echo "[ios:build:app-store] IPA ready: $IPA_PATH"
fi
echo "[ios:build:app-store] Build/export complete. Publish to App Store Connect with upload-package, not upload-app."
