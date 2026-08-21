#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "🍏 Building Ultimatter.app for macOS..."

APP_BUNDLE="${ROOT_DIR}/bin/Ultimatter.app"
rm -rf "${APP_BUNDLE}"
mkdir -p "${APP_BUNDLE}/Contents/MacOS"
mkdir -p "${APP_BUNDLE}/Contents/Resources"

# 1. Copy Info.plist
cp "${SCRIPT_DIR}/Info.plist" "${APP_BUNDLE}/Contents/Info.plist"

# 2. Compile/Copy native Rust Wry/Tao binary
if [ -f "${ROOT_DIR}/bin/ultimatter-macos-arm64" ]; then
  cp "${ROOT_DIR}/bin/ultimatter-macos-arm64" "${APP_BUNDLE}/Contents/MacOS/ultimatter"
fi
chmod 755 "${APP_BUNDLE}/Contents/MacOS/ultimatter" 2>/dev/null || true

# 3. Compile standalone Node.js Gateway Backend inside macOS bundle
echo "📦 Packaging standalone gateway backend into macOS bundle..."
npx @yao-pkg/pkg "${ROOT_DIR}/index.js" --output "${APP_BUNDLE}/Contents/MacOS/ultimatter-backend" --targets node22-macos-arm64
chmod 755 "${APP_BUNDLE}/Contents/MacOS/ultimatter-backend" 2>/dev/null || true

# 3. Copy Icon
if [ -f "${ROOT_DIR}/assets/icon.png" ]; then
  cp "${ROOT_DIR}/assets/icon.png" "${APP_BUNDLE}/Contents/Resources/AppIcon.png"
fi

# 4. Ad-hoc Code Signing (Satisfies Apple Silicon M1/M2/M3/M4 runtime integrity)
if command -v codesign >/dev/null 2>&1; then
  echo "🔏 Applying ad-hoc codesign to Ultimatter.app..."
  codesign --force --deep -s - "${APP_BUNDLE}" 2>/dev/null || true
fi

echo "✅ macOS App Bundle configured at bin/Ultimatter.app"
