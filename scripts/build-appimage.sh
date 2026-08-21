#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🚀 Building Ultimatter AppImage..."

# 1. Compile native Rust Wry/Tao Desktop GUI
echo "🦀 Compiling native Rust Wry/Tao desktop binary..."
cargo build --release --manifest-path "${ROOT_DIR}/desktop/Cargo.toml"
strip "${ROOT_DIR}/desktop/target/release/ultimatter"
mkdir -p "${ROOT_DIR}/bin"
install -m 755 "${ROOT_DIR}/desktop/target/release/ultimatter" "${ROOT_DIR}/bin/ultimatter-linux-x64"

APP_DIR="${ROOT_DIR}/build/AppDir"
rm -rf "${APP_DIR}"
mkdir -p "${APP_DIR}/usr/bin"
mkdir -p "${APP_DIR}/usr/share/applications"
mkdir -p "${APP_DIR}/usr/share/icons/hicolor/512x512/apps"

# 2. Copy native Rust GUI executable
cp "${ROOT_DIR}/bin/ultimatter-linux-x64" "${APP_DIR}/usr/bin/ultimatter"
chmod 755 "${APP_DIR}/usr/bin/ultimatter"

# 3. Compile standalone Node.js Gateway Backend inside AppDir
echo "📦 Compiling standalone gateway backend binary..."
npx @yao-pkg/pkg "${ROOT_DIR}/index.js" --output "${APP_DIR}/usr/bin/ultimatter-backend" --targets node22-linux-x64
chmod 755 "${APP_DIR}/usr/bin/ultimatter-backend"

cp "${ROOT_DIR}/assets/ultimatter.desktop" "${APP_DIR}/ultimatter.desktop"
cp "${ROOT_DIR}/assets/ultimatter.desktop" "${APP_DIR}/usr/share/applications/ultimatter.desktop"

cp "${ROOT_DIR}/assets/icon.png" "${APP_DIR}/ultimatter.png"
cp "${ROOT_DIR}/assets/icon.png" "${APP_DIR}/.DirIcon"
cp "${ROOT_DIR}/assets/icon.png" "${APP_DIR}/usr/share/icons/hicolor/512x512/apps/ultimatter.png"

# 3. Create AppRun launcher
cat << 'EOF' > "${APP_DIR}/AppRun"
#!/bin/sh
HERE="$(dirname "$(readlink -f "${0}")")"
export PATH="${HERE}/usr/bin:${PATH}"
exec "${HERE}/usr/bin/ultimatter" "$@"
EOF
chmod 755 "${APP_DIR}/AppRun"

# 4. Acquire appimagetool if not in PATH
APPIMAGETOOL="$(which appimagetool 2>/dev/null || true)"
CACHE_DIR="${HOME}/.cache/ultimatter"

if [ -z "${APPIMAGETOOL}" ]; then
  mkdir -p "${CACHE_DIR}"
  TOOL_PATH="${CACHE_DIR}/appimagetool-x86_64.AppImage"
  if [ ! -f "${TOOL_PATH}" ] || [ ! -s "${TOOL_PATH}" ]; then
    echo "📥 Downloading appimagetool..."
    curl -sSL -o "${TOOL_PATH}" "https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-x86_64.AppImage"
    chmod 755 "${TOOL_PATH}"
  fi
  APPIMAGETOOL="${TOOL_PATH}"
fi

# 5. Package AppImage
echo "📦 Packaging AppImage into bin/Ultimatter-x86_64.AppImage..."
mkdir -p "${ROOT_DIR}/bin"

export ARCH=x86_64
if [ -n "${APPIMAGE_EXTRACT_AND_RUN}" ] || ! command -v fusermount >/dev/null 2>&1; then
  "${APPIMAGETOOL}" --appimage-extract-and-run "${APP_DIR}" "${ROOT_DIR}/bin/Ultimatter-x86_64.AppImage"
else
  "${APPIMAGETOOL}" "${APP_DIR}" "${ROOT_DIR}/bin/Ultimatter-x86_64.AppImage" || "${APPIMAGETOOL}" --appimage-extract-and-run "${APP_DIR}" "${ROOT_DIR}/bin/Ultimatter-x86_64.AppImage"
fi

chmod 755 "${ROOT_DIR}/bin/Ultimatter-x86_64.AppImage"
echo "✅ AppImage created successfully: bin/Ultimatter-x86_64.AppImage"
