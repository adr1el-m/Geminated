#!/usr/bin/env bash
# ============================================================
#  publish.sh — DCN Finals Reviewer
#  Build LaTeX → PDF and optionally publish to papers-site
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

TEX_FILE="dcn_reviewer.tex"
PDF_FILE="dcn_reviewer.pdf"
BUILD_DIR="build"
PAPERS_SITE="../../papers-site"
PUBLISHER="$PAPERS_SITE/publish.js"
QUIZ_GENERATOR="$PAPERS_SITE/generate-quiz.js"
SLUG="dcn-finals-reviewer"

# ── Flags ──────────────────────────────────────────────────
BUILD_ONLY=false
PUSH=true
while [ "$#" -gt 0 ]; do
  case "$1" in
    --build-only)
      BUILD_ONLY=true
      ;;
    --no-push)
      PUSH=false
      ;;
    -h|--help)
      printf '%s\n' \
        "Publish the DCN Finals Reviewer to papers-site." \
        "" \
        "Usage:" \
        "  ./publish.sh          # build, publish, commit, push, smoke-test" \
        "  ./publish.sh --no-push" \
        "  ./publish.sh --build-only"
      exit 0
      ;;
    *)
      echo "[error] Unknown option: $1"
      echo "Run ./publish.sh --help"
      exit 1
      ;;
  esac
  shift
done

# ── Build ──────────────────────────────────────────────────
echo "▸ Building $TEX_FILE …"
mkdir -p "$BUILD_DIR"

latexmk -xelatex -interaction=nonstopmode -halt-on-error \
  -output-directory="$BUILD_DIR" "$TEX_FILE"

# Copy final PDF to project root
cp "$BUILD_DIR/$PDF_FILE" .
echo "✔ PDF ready: $PDF_FILE"

if $BUILD_ONLY; then
  echo "▸ --build-only: skipping publish."
  exit 0
fi

# ── Quiz data ───────────────────────────────────────────────
if [ -f "$QUIZ_GENERATOR" ]; then
  echo "▸ Generating quiz data for $SLUG …"
  node "$QUIZ_GENERATOR" "$SCRIPT_DIR/$TEX_FILE" "$SLUG" "DCN Finals Reviewer Quiz"
else
  echo "[warn] Quiz generator not found: $QUIZ_GENERATOR"
fi

# ── Publish ────────────────────────────────────────────────
if [ ! -f "$PUBLISHER" ]; then
  echo "[error] Site publisher not found: $PUBLISHER"
  exit 1
fi

PUBLISH_ARGS=(
  "$PUBLISHER"
  --kind reviewer
  --slug "$SLUG"
  --source "$SCRIPT_DIR/$PDF_FILE"
  --yes
  --title "DCN Finals Reviewer"
  --subtitle "Data Communication and Networking"
  --author "Adriel M. Magalona"
  --subject "Data Communication and Networking"
  --tags "DCN,Reviewer,IPv6,Networking,Security,TCP,UDP"
  --abstract "A comprehensive reviewer covering IPv6 transition and address types, IPv4 addressing, network security threats, malware types, physical and infrastructure threats, attack types, firewall filtering, IPv6 multicast addressing, and TCP/UDP transport-layer concepts for the DCN finals exam."
)

if $PUSH; then
  PUBLISH_ARGS+=(--push --message "Publish DCN finals reviewer")
fi

echo "▸ Publishing $SLUG as a reviewer …"
node "${PUBLISH_ARGS[@]}"

echo "✔ Published to papers-site."
