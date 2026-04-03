#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/../VitaView"
EXPORT_OPTIONS="$SCRIPT_DIR/../ExportOptions.plist"
ARCHIVE_PATH="/tmp/VitaView.xcarchive"
EXPORT_PATH="/tmp/VitaView-export"
PKG_PATH="/tmp/VitaView.pkg"

echo "=== Building VitaView for Mac App Store ==="

# 1. Clean & Archive
echo "  Archiving..."
xcodebuild archive \
  -project "$PROJECT_DIR/VitaView.xcodeproj" \
  -scheme VitaView \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  -destination "generic/platform=macOS" \
  CODE_SIGN_IDENTITY="3rd Party Mac Developer Application: Lucas Canova (9D7X84MT44)" \
  DEVELOPMENT_TEAM="9D7X84MT44" \
  PRODUCT_BUNDLE_IDENTIFIER="br.com.lucascanova.vitaview" \
  2>&1 | tail -5

# 2. Export
echo "  Exporting..."
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  2>&1 | tail -5

# 3. Create .pkg for App Store upload
echo "  Creating .pkg..."
productbuild \
  --component "$EXPORT_PATH/VitaView.app" /Applications \
  --sign "3rd Party Mac Developer Installer: Lucas Canova (9D7X84MT44)" \
  "$PKG_PATH"

echo ""
echo "=== Done ==="
echo "  .app: $EXPORT_PATH/VitaView.app"
echo "  .pkg: $PKG_PATH"
echo ""
echo "Upload with: xcrun altool --upload-app -f $PKG_PATH -t osx -u lucas.canova@icloud.com"
