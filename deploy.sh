#!/bin/bash
set -e

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

echo "Building app..."
pepv_pnpm run build

echo "Deploying Worker..."
pepv_pnpm exec wrangler deploy --config wrangler.worker.toml

echo "Deploying Pages..."
pepv_pnpm exec wrangler pages deploy dist --project-name pepguideiq --branch main

echo "Done. Worker + Pages deployed."
