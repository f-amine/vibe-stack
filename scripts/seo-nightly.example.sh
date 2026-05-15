#!/usr/bin/env bash
# Nightly headless SEO audit using toprank + Claude Code.
#
# Copy to seo-nightly.sh, fill in SITE_URL + NOTIFY_WEBHOOK, drop into a cron
# (or GitHub Actions schedule), and let toprank pull live Search Console data
# every night.
#
# Prereqs (one-time, on the runner / VPS):
#   1. Claude Code installed and authenticated:        claude login
#   2. toprank plugin installed:                       /plugin install toprank@nowork-studio
#   3. Google Search Console OAuth complete once:      run /toprank:seo-analysis interactively
#   4. Your production domain verified in Search Console (post-deploy step).
#
# After that, the cron runs unattended.

set -euo pipefail

SITE_URL="${SITE_URL:-https://your-vibestack-site.com}"
NOTIFY_WEBHOOK="${NOTIFY_WEBHOOK:-}"          # Optional Slack/Discord webhook
OUT_DIR="${OUT_DIR:-./reports/seo}"

mkdir -p "$OUT_DIR"
TS="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
REPORT="$OUT_DIR/$TS.md"

# Run toprank's seo-analysis skill non-interactively. `--print` returns the
# final assistant message to stdout; we capture it as the report.
claude --print "/toprank:seo-analysis $SITE_URL — produce the 30-day plan; surface quick wins and traffic drops; output markdown only, no preamble." \
  > "$REPORT"

echo "Wrote $REPORT"

# Optional: ping a webhook with the summary.
if [ -n "$NOTIFY_WEBHOOK" ]; then
  SUMMARY="$(head -c 1500 "$REPORT")"
  curl -sS -X POST -H "content-type: application/json" \
    -d "{\"text\": \"vibestack SEO audit ($SITE_URL):\n\n${SUMMARY//\"/\\\"}\n\nFull: $REPORT\"}" \
    "$NOTIFY_WEBHOOK" >/dev/null || true
fi

# Example cron line (edit paths):
#   30 4 * * *  cd /srv/vibestack && SITE_URL=https://example.com NOTIFY_WEBHOOK=https://hooks.slack.com/... ./scripts/seo-nightly.sh >> ./logs/seo.log 2>&1
