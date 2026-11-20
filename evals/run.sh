#!/usr/bin/env bash
# Stage one cold-run evaluation brief into an isolated temp workspace.
# Usage: ./evals/run.sh [--brief 01..08] [--cmd "<runner command>"]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRIEF_NUM="01"
RUN_CMD=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --brief) BRIEF_NUM="$2"; shift 2 ;;
    --cmd) RUN_CMD="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

BRIEF_PATH="$(find "$ROOT/evals/briefs" -maxdepth 1 -name "${BRIEF_NUM}-*.txt" | head -n 1)"
if [[ -z "${BRIEF_PATH:-}" || ! -f "$BRIEF_PATH" ]]; then
  echo "Brief ${BRIEF_NUM} not found under $ROOT/evals/briefs/" >&2
  exit 2
fi

WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/atlas-eval-${BRIEF_NUM}-XXXXXX")"
trap 'rm -rf "$WORKDIR"' EXIT

cp "$BRIEF_PATH" "$WORKDIR/BRIEF.txt"
if [[ -f "$ROOT/evals/attachments/faulty-diagram.svg" ]]; then
  cp "$ROOT/evals/attachments/faulty-diagram.svg" "$WORKDIR/faulty-diagram.svg"
fi
if [[ -d "$ROOT/evals/attachments/faulty-figure" ]]; then
  cp -R "$ROOT/evals/attachments/faulty-figure" "$WORKDIR/faulty-figure"
fi

echo "Staged isolated workspace: $WORKDIR"
echo "Brief: $(basename "$BRIEF_PATH")"
if [[ -n "$RUN_CMD" ]]; then
  (cd "$WORKDIR" && eval "$RUN_CMD")
else
  cat "$WORKDIR/BRIEF.txt"
fi
node "$ROOT/evals/validate.mjs"
