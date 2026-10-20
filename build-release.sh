#!/bin/sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
SRC="$ROOT/src"

command -v python3 >/dev/null 2>&1 || { echo "ERROR: Python 3 is required for the release language audit." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js is required for the release language audit." >&2; exit 1; }
python3 "$ROOT/scripts/check-languages.py"
INFO="$SRC/appinfo/info.xml"

[ -f "$INFO" ] || { echo "ERROR: $INFO not found" >&2; exit 1; }
VERSION="$(sed -n 's:.*<version>\([^<]*\)</version>.*:\1:p' "$INFO" | head -n 1)"
[ -n "$VERSION" ] || { echo "ERROR: version not found in info.xml" >&2; exit 1; }

for item in appinfo css img js l10n lib templates; do
    [ -e "$SRC/$item" ] || { echo "ERROR: missing src/$item" >&2; exit 1; }
done

BUILD="$ROOT/.build"
APP="$BUILD/hc_stickynotes"
RELEASE="$ROOT/release"
rm -rf "$BUILD"
mkdir -p "$APP" "$RELEASE"

for item in appinfo css img js l10n lib templates; do
    cp -R "$SRC/$item" "$APP/$item"
done
cp "$ROOT/LICENSE" "$APP/LICENSE"
cp "$ROOT/CHANGELOG.md" "$APP/CHANGELOG.md"

# The top-level directory in both archives must be exactly the app id: hc_stickynotes/
(
    cd "$BUILD"
    tar -czf "$RELEASE/hc_stickynotes-$VERSION.tar.gz" hc_stickynotes
    if command -v zip >/dev/null 2>&1; then
        zip -qr "$RELEASE/hc_stickynotes-$VERSION.zip" hc_stickynotes
    fi
)

# The full-source archive also carries installation scripts and documentation for GitHub and Publisher.
SOURCE="$BUILD/hc_stickynotes-$VERSION"
mkdir -p "$SOURCE"
(cd "$ROOT" && tar -cf - .gitignore LICENSE CHANGELOG.md CHANGELOG.cs.md README.md README_CZ.md install.sh uninstall.sh build-release.sh scripts docs assets src) | (cd "$SOURCE" && tar -xf -)
(cd "$BUILD" && zip -qr "$RELEASE/hc_stickynotes-$VERSION-source.zip" "hc_stickynotes-$VERSION")
rm -rf "$BUILD"
echo "Built release/hc_stickynotes-$VERSION.tar.gz"
[ -f "$RELEASE/hc_stickynotes-$VERSION.zip" ] && echo "Built release/hc_stickynotes-$VERSION.zip"

echo "Built release/hc_stickynotes-$VERSION-source.zip"
