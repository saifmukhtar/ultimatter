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

# 3. Create Self-Integrating AppRun launcher
cat << 'EOF' > "${APP_DIR}/AppRun"
#!/bin/sh
HERE="$(dirname "$(readlink -f "${0}")")"
export PATH="${HERE}/usr/bin:${PATH}"

# Automatic Desktop & Icon Integration on First Launch
if [ -n "${APPIMAGE}" ]; then
  DESKTOP_DIR="${HOME}/.local/share/applications"
  ICON_DIR="${HOME}/.local/share/icons/hicolor/256x256/apps"
  DESKTOP_FILE="${DESKTOP_DIR}/ultimatter.desktop"
  ICON_FILE="${ICON_DIR}/ultimatter.png"

  if [ ! -f "${DESKTOP_FILE}" ] || [ ! -f "${ICON_FILE}" ]; then
    mkdir -p "${DESKTOP_DIR}" "${ICON_DIR}" 2>/dev/null || true
    if [ -f "${HERE}/ultimatter.png" ]; then
      cp "${HERE}/ultimatter.png" "${ICON_FILE}" 2>/dev/null || true
    fi

    cat << DESKTOPEOF > "${DESKTOP_FILE}"
[Desktop Entry]
Name=Ultimatter
GenericName=Universal AI Gateway
Comment=Universal AI Agent Gateway for Antigravity and OpenCode
Exec="${APPIMAGE}" %U
Icon=${ICON_FILE}
Terminal=false
Type=Application
Categories=Development;Utility;
StartupWMClass=ultimatter
Keywords=AI;Agent;Antigravity;OpenCode;Gateway;Remote;
DESKTOPEOF
    chmod 644 "${DESKTOP_FILE}" 2>/dev/null || true

    if command -v update-desktop-database >/dev/null 2>&1; then
      update-desktop-database "${DESKTOP_DIR}" >/dev/null 2>&1 || true
    fi
    if command -v kbuildsycoca5 >/dev/null 2>&1; then
      kbuildsycoca5 >/dev/null 2>&1 || true
    elif command -v kbuildsycoca6 >/dev/null 2>&1; then
      kbuildsycoca6 >/dev/null 2>&1 || true
    fi
  fi
fi

# Execute Native Desktop GUI
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

TARGET_APPIMAGE="${ROOT_DIR}/bin/Ultimatter-x86_64.AppImage"
TMP_APPIMAGE="${ROOT_DIR}/bin/Ultimatter-x86_64.AppImage.tmp.$$"

export ARCH=x86_64
if [ -n "${APPIMAGE_EXTRACT_AND_RUN}" ] || ! command -v fusermount >/dev/null 2>&1; then
  "${APPIMAGETOOL}" --appimage-extract-and-run "${APP_DIR}" "${TMP_APPIMAGE}"
else
  "${APPIMAGETOOL}" "${APP_DIR}" "${TMP_APPIMAGE}" || "${APPIMAGETOOL}" --appimage-extract-and-run "${APP_DIR}" "${TMP_APPIMAGE}"
fi

chmod 755 "${TMP_APPIMAGE}"
mv -f "${TMP_APPIMAGE}" "${TARGET_APPIMAGE}"
echo "✅ AppImage created successfully: bin/Ultimatter-x86_64.AppImage"
