#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "🍏 Building Ultimatter.app for macOS natively..."

APP_BUNDLE="${ROOT_DIR}/bin/Ultimatter.app"
rm -rf "${APP_BUNDLE}"
mkdir -p "${APP_BUNDLE}/Contents/MacOS"
mkdir -p "${APP_BUNDLE}/Contents/Resources"

# 1. Copy Info.plist
cp "${SCRIPT_DIR}/Info.plist" "${APP_BUNDLE}/Contents/Info.plist"

# 2. Compile native Rust Wry/Tao desktop binary
echo "🦀 Compiling native Rust Wry/Tao desktop binary..."
cargo build --release --manifest-path "${ROOT_DIR}/desktop/Cargo.toml"
cp "${ROOT_DIR}/desktop/target/release/ultimatter" "${APP_BUNDLE}/Contents/MacOS/ultimatter"
chmod 755 "${APP_BUNDLE}/Contents/MacOS/ultimatter"

# 3. Compile standalone Node.js Gateway Backend inside macOS bundle
echo "📦 Packaging standalone gateway backend into macOS bundle..."
npx @yao-pkg/pkg "${ROOT_DIR}/bin/cli.js" --output "${APP_BUNDLE}/Contents/MacOS/ultimatter-backend" --targets node22-macos-arm64
chmod 755 "${APP_BUNDLE}/Contents/MacOS/ultimatter-backend"

# 4. Copy Apple ICNS and PNG Icons
if [ -f "${ROOT_DIR}/assets/AppIcon.icns" ]; then
  cp "${ROOT_DIR}/assets/AppIcon.icns" "${APP_BUNDLE}/Contents/Resources/AppIcon.icns"
fi
if [ -f "${ROOT_DIR}/assets/icon.png" ]; then
  cp "${ROOT_DIR}/assets/icon.png" "${APP_BUNDLE}/Contents/Resources/AppIcon.png"
fi

# 5. Ad-hoc Code Signing (Satisfies Apple Silicon M1/M2/M3/M4 runtime integrity)
if command -v codesign >/dev/null 2>&1; then
  echo "🔏 Applying ad-hoc codesign to Ultimatter.app..."
  codesign --force --deep -s - "${APP_BUNDLE}"
fi

echo "✅ macOS App Bundle built natively and signed at bin/Ultimatter.app"
