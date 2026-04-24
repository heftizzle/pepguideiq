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

# ─── Optional git: stage, commit (if dirty), push to GitHub ──────────────────
# Push URL is explicit (not `origin`): https://github.com/heftizzle/pepguideiq.git
# Skip with: SKIP_DEPLOY_GIT=1 ./deploy.sh (Git Bash / macOS / Linux), or bash -c "SKIP_DEPLOY_GIT=1 bash ./deploy.sh" (PowerShell), or uncomment SKIP_DEPLOY_GIT=1 near the top of this file.
#
# Commit subject/body are derived from the staged diff (git shortstat + --stat + file list).
# Hand-written subject only: DEPLOY_COMMIT_SUBJECT='fix: spotlight copy' bash ./deploy.sh
#
# Credentials: do NOT embed tokens in this script. For fast local pushes, use one of:
#   • HTTPS + Git Credential Manager (Windows) — sign in once; Git caches for origin.
#   • SSH remote (git@github.com:…/pepguideiq.git) + ssh-agent with your key loaded.
#   • gh auth login (GitHub CLI) if you use gh as credential helper.
# Only disable terminal prompts in non-interactive environments (avoids hang in CI / no TTY).
if [ ! -t 1 ]; then
  export GIT_TERMINAL_PROMPT=0
fi

if [ "${SKIP_DEPLOY_GIT:-}" != "1" ] && command -v git >/dev/null 2>&1 && [ -d .git ]; then
  echo "Git: staging all changes (git add -A)…"
  git add -A

  _branch=$(git branch --show-current 2>/dev/null || echo main)
  _github_push_url="https://github.com/heftizzle/pepguideiq.git"
  _ts_utc=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  if [ -n "$(git status --porcelain)" ]; then
    echo "Git: committing with message derived from staged changes…"
    _shortstat=$(git diff --cached --shortstat 2>/dev/null | xargs || true)
    [ -z "${_shortstat}" ] && _shortstat="(no shortstat; binary or rename only — see file list below)"
    if [ -n "${DEPLOY_COMMIT_SUBJECT:-}" ]; then
      _deploy_subj="${DEPLOY_COMMIT_SUBJECT}"
    else
      _deploy_subj="deploy: ${_shortstat} · ${_ts_utc}"
      if [ "${#_deploy_subj}" -gt 72 ]; then
        _deploy_subj="deploy: ${_shortstat}"
        [ "${#_deploy_subj}" -gt 72 ] && _deploy_subj="${_deploy_subj:0:69}..."
      fi
    fi
    _deploy_paths=$(git diff --cached --name-only | sed 's/^/- /' | awk 'NF' || true)
    git commit -F - <<EOF
${_deploy_subj}

Pre-deploy snapshot (./deploy.sh → Cloudflare Worker + Pages).
Branch: ${_branch} · push: ${_github_push_url}

$(git diff --cached --stat)

${_deploy_paths}

Skip git on a deploy run: SKIP_DEPLOY_GIT=1 ./deploy.sh
EOF
  else
    echo "Git: nothing to commit (clean working tree)."
  fi

  echo "Git: pushing to GitHub (git push ${_github_push_url} ${_branch})…"
  git push "${_github_push_url}" "${_branch}"
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
