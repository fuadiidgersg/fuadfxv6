#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# FuadFX — Deploy Helper
# Commits & pushes to GitHub, then triggers Render backend redeploy.
#
# Usage:
#   bash deploy.sh                    ← auto commit message
#   bash deploy.sh "fix: my message"  ← custom commit message
# ─────────────────────────────────────────────────────────────────────────────
set -e

COMMIT_MSG="${1:-""}"

# ── Validate ──────────────────────────────────────────────────────────────────
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌  GITHUB_TOKEN secret is not set."
  exit 1
fi

# ── Push to GitHub via API ────────────────────────────────────────────────────
echo "🚀  Pushing to GitHub…"
if [ -n "$COMMIT_MSG" ]; then
  node scripts/github-push.mjs "$COMMIT_MSG"
else
  node scripts/github-push.mjs
fi

# ── Trigger Render deploy ─────────────────────────────────────────────────────
if [ -n "$RENDER_DEPLOY_HOOK_URL" ]; then
  echo ""
  echo "🔄  Triggering Render backend redeploy…"
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$RENDER_DEPLOY_HOOK_URL")
  if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "201" ]; then
    echo "✅  Render deploy triggered."
  else
    echo "⚠️   Render responded with HTTP $RESPONSE"
  fi
else
  echo "ℹ️   Skipping Render deploy (RENDER_DEPLOY_HOOK_URL not set)."
fi

echo ""
echo "🎉  All done! Check GitHub and Render for deploy progress."
