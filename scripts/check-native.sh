#!/usr/bin/env bash
# Builds and tests every native adapter against the committed generated tokens.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
echo "== swift";   (cd "$root" && swift test)
echo "== flutter"; (cd "$root/native/flutter" && flutter pub get >/dev/null && flutter analyze && flutter test)
echo "== android"; (cd "$root/native/android" && ./gradlew :abe-design:testDebugUnitTest :abe-design:assembleRelease --console=plain -q)
echo "native adapters OK"
