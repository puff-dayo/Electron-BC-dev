#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

echo "[1/3] Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "ERROR: pnpm not found."
    exit 1
fi

echo "[2/3] Compiling production build..."
pnpm run compile:prod

echo "[3/3] Building macOS app..."
pnpm exec electron-builder --mac dir --publish never

APP_NAME="Bondage Club"
VERSION=$(node -p "require('./package.json').version")
DMG="dist/electron-bondage-club-${VERSION}.dmg"

echo "[3/3] Creating DMG from .app..."
hdiutil create -volname "${APP_NAME}" \
  -srcfolder dist/mac \
  -ov -format UDZO \
  "${DMG}"

echo ""
echo "Build completed: ${DMG}"
