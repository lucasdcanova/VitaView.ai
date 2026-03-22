#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

PROJECT_PATH="$REPO_ROOT/ios/App/App.xcodeproj"
SCHEME="${IOS_SCHEME:-App}"
ARCHIVE_PATH="${IOS_ARCHIVE_PATH:-$REPO_ROOT/build/ios/App.xcarchive}"
EXPORT_PATH="${IOS_EXPORT_PATH:-$REPO_ROOT/build/ios/app-store}"
EXPORT_OPTIONS_PATH="$REPO_ROOT/ios/App/ExportOptions.plist"

echo "[ios:build:app-store] Preparing Capacitor iOS project"
"$REPO_ROOT/ci_scripts/ci_pre_xcodebuild.sh"

rm -rf "$ARCHIVE_PATH" "$EXPORT_PATH"
mkdir -p "$(dirname "$ARCHIVE_PATH")" "$EXPORT_PATH"

echo "[ios:build:app-store] Archiving Release build for generic iOS device"
xcodebuild \
  -project "$PROJECT_PATH" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  archive

echo "[ios:build:app-store] Exporting archive for App Store Connect"
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS_PATH"

IPA_PATH=$(find "$EXPORT_PATH" -maxdepth 1 -name "*.ipa" -print -quit || true)

echo "[ios:build:app-store] Archive ready: $ARCHIVE_PATH"
if [ -n "$IPA_PATH" ]; then
  echo "[ios:build:app-store] IPA ready: $IPA_PATH"
fi
echo "[ios:build:app-store] This export is configured for App Store Connect and disables internal-only TestFlight builds."
