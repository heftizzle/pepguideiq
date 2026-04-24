#!/bin/bash
set -e

# PowerShell does not reliably pass environment variables into a child `bash` the same way
# POSIX shells do (e.g. `SKIP_DEPLOY_GIT=1 bash ./deploy.sh` may leave SKIP_DEPLOY_GIT unset inside bash).
# Set the variable inside bash explicitly, for example from repo root in PowerShell:
#   bash -c "SKIP_DEPLOY_GIT=1 bash ./deploy.sh"
# Or use the toggle below: uncomment SKIP_DEPLOY_GIT=1 for one run instead of fighting env syntax.

# Uncomment the next line to skip git (add/commit/push) on this run:
# SKIP_DEPLOY_GIT=1

cd "$(dirname "$0")"

# ─── Optional git: stage, commit (if dirty), push to GitHub (origin) ─────────
# Same repo every time: origin → github.com/heftizzle/pepguideiq.git
# Skip with: SKIP_DEPLOY_GIT=1 ./deploy.sh (Git Bash / macOS / Linux), or bash -c "SKIP_DEPLOY_GIT=1 bash ./deploy.sh" (PowerShell), or uncomment SKIP_DEPLOY_GIT=1 near the top of this file.
#
# Credentials: do NOT embed tokens in this script. For fast local pushes, use one of:
#   • HTTPS + Git Credential Manager (Windows) — sign in once; Git caches for origin.
#   • SSH remote (git@github.com:…/pepguideiq.git) + ssh-agent with your key loaded.
#   • gh auth login (GitHub CLI) if you use gh as credential helper.
# GIT_TERMINAL_PROMPT=0 avoids hanging when there is no TTY (e.g. some agent terminals); push fails fast instead.
if [ "${SKIP_DEPLOY_GIT:-}" != "1" ] && command -v git >/dev/null 2>&1 && [ -d .git ]; then
  export GIT_TERMINAL_PROMPT=0

  echo "Git: staging all changes (git add -A)…"
  git add -A

  _branch=$(git branch --show-current 2>/dev/null || echo main)
  _origin_url=$(git remote get-url origin 2>/dev/null || echo "(origin not configured)")
  _ts_utc=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  if [ -n "$(git status --porcelain)" ]; then
    echo "Git: committing with verbose message…"
    git commit -m "chore: pre-deploy snapshot (${_ts_utc})" \
      -m "Automated commit from ./deploy.sh immediately before production build and Cloudflare deploy (Worker + Pages)." \
      -m "Branch: ${_branch}" \
      -m "Remote push target: origin → ${_origin_url}" \
      -m "Working tree was non-empty after git add -A; review this commit in git log if anything unexpected was included." \
      -m "To run deploy without git: SKIP_DEPLOY_GIT=1 ./deploy.sh, bash -c \"SKIP_DEPLOY_GIT=1 bash ./deploy.sh\" (PowerShell), or uncomment SKIP_DEPLOY_GIT=1 at top of deploy.sh."
  else
    echo "Git: nothing to commit (clean working tree)."
  fi

  echo "Git: pushing to GitHub (git push origin ${_branch})…"
  git push origin "${_branch}"
else
  if [ "${SKIP_DEPLOY_GIT:-}" = "1" ]; then
    echo "Git: skipped (SKIP_DEPLOY_GIT=1)."
  elif ! command -v git >/dev/null 2>&1; then
    echo "Git: skipped (git not on PATH)."
  elif [ ! -d .git ]; then
    echo "Git: skipped (not a git checkout / no .git)."
  fi
fi

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
