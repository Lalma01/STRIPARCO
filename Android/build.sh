#!/usr/bin/env bash
# STRIPARCO Android – build script
set -e
cd "$(dirname "$0")"

if [ ! -f gradlew ]; then
  echo "Wrapper missing, generating..."
  gradle wrapper --gradle-version 8.7
fi

echo "[1/2] Building release APK..."
./gradlew assembleRelease

mkdir -p release
cp app/build/outputs/apk/release/app-release.apk release/STRIPARCO.apk
echo "DONE: release/STRIPARCO.apk"
