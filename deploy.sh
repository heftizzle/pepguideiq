#!/bin/bash
# NOTE: removed `set -e` — we want continue-on-error per stage,
# with explicit reporting at the end.

cd "$(dirname "$0")"

# WSL: a PATH entry to "…/nodejs" only exposes `node.exe`; the npm `pnpm` shim still runs `exec node`, which fails.
# Git Bash: `/mnt/c/...` may be absent — try `/c/...` too.
# When we find both Windows `node.exe` and the global `pnpm.cjs`, invoke that pair explicitly; otherwise use `pnpm` on PATH (CI / PowerShell).
_pepv_win_node_exe=""
for _pepv_d in "/mnt/c/Program Files/nodejs" "/c/Program Files/nodejs"; do
  if [ -f "${_pepv_d}/node.exe" ]; then
    _pepv_win_node_exe="${_pepv_d}/node.exe"
    break
  fi
done

_pepv_pnpm_cjs=""
if _pepv_shim=$(command -v pnpm 2>/dev/null); then
  _pepv_bd=$(dirname "$_pepv_shim")
  if [ -f "${_pepv_bd}/node_modules/pnpm/bin/pnpm.cjs" ]; then
    _pepv_pnpm_cjs="${_pepv_bd}/node_modules/pnpm/bin/pnpm.cjs"
  fi
fi

pepv_pnpm() {
  if [ -n "$_pepv_win_node_exe" ] && [ -n "$_pepv_pnpm_cjs" ]; then
    # Windows node.exe expects a Win32 path for the script; WSL gives `/mnt/c/...` which breaks resolution.
    _pepv_cjs_arg="$_pepv_pnpm_cjs"
    if command -v wslpath >/dev/null 2>&1; then
      _pepv_cjs_arg=$(wslpath -w "$_pepv_pnpm_cjs")
    elif command -v cygpath >/dev/null 2>&1; then
      _pepv_cjs_arg=$(cygpath -w "$_pepv_pnpm_cjs" 2>/dev/null) || _pepv_cjs_arg="$_pepv_pnpm_cjs"
    fi
    "$_pepv_win_node_exe" "$_pepv_cjs_arg" "$@"
  else
    command pnpm "$@"
  fi
}

unset _pepv_d _pepv_shim _pepv_bd 2>/dev/null || true

echo "▶ Building app..."
if ! pepv_pnpm run build; then
  echo "✗ Build failed. Aborting (no point deploying broken code)."
  exit 1
fi
echo "✓ Build complete"

PAGES_OK=0
WORKER_OK=0

# Pages first — this is what users see.
echo "▶ Deploying Pages..."
if pepv_pnpm exec wrangler pages deploy dist --project-name pepguideiq --branch main; then
  echo "✓ Pages deployed"
  PAGES_OK=1
else
  echo "✗ Pages deploy failed"
  PAGES_OK=0
fi

# Worker second — independent. Skip if no Worker changes since last commit.
echo "▶ Checking for Worker changes..."
if git diff --quiet HEAD~1 HEAD -- workers/ wrangler.worker.toml; then
  echo "○ No Worker changes since last commit — skipping Worker deploy"
  WORKER_OK=1
else
  echo "▶ Deploying Worker..."
  if pepv_pnpm exec wrangler deploy --config wrangler.worker.toml; then
    echo "✓ Worker deployed"
    WORKER_OK=1
  else
    echo "✗ Worker deploy failed"
    WORKER_OK=0
  fi
fi

echo ""
echo "═══ DEPLOY SUMMARY ═══"
[ "$PAGES_OK" = "1" ] && echo "✓ Pages" || echo "✗ Pages  (frontend NOT updated)"
[ "$WORKER_OK" = "1" ] && echo "✓ Worker" || echo "✗ Worker (API NOT updated)"
[ "$PAGES_OK" = "1" ] && [ "$WORKER_OK" = "1" ] && exit 0 || exit 1
