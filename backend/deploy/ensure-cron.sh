#!/usr/bin/env bash
# Ensure the Laravel scheduler cron job exists for this app (idempotent).
#
#   ensure-cron.sh <app-dir> [php-binary]
#
# One cron line runs `artisan schedule:run` every minute; the scheduler then
# runs nightly backups, flight-status checks and drains the job queue.
# - Already present (added by a previous deploy or by hand in cPanel): no change.
# - Managed line present but outdated (e.g. PHP path moved): replaced.
# - Missing: added, then verified.
# Exits non-zero only if crontab is available but the entry could not be saved.
set -euo pipefail

APP_DIR="${1:?usage: ensure-cron.sh <app-dir> [php-binary]}"
PHP_BIN="${2:-$(command -v php || echo php)}"
MARKER="# naoa-core scheduler (managed by deploy)"
CRON_LINE="* * * * * cd ${APP_DIR} && ${PHP_BIN} artisan schedule:run >> /dev/null 2>&1"

if ! command -v crontab >/dev/null 2>&1; then
  echo "WARN: crontab is not available over SSH on this server."
  echo "      Add this in cPanel -> Cron Jobs (Once Per Minute):"
  echo "      ${CRON_LINE#\* \* \* \* \* }"
  exit 0
fi

CURRENT="$(crontab -l 2>/dev/null || true)"

# Active (uncommented) scheduler entries for this app, managed or hand-made.
active_entries() {
  printf '%s\n' "$1" | grep -v '^[[:space:]]*#' | grep -F "$APP_DIR" | grep -F 'schedule:run' || true
}

EXISTING="$(active_entries "$CURRENT")"
if [ -n "$EXISTING" ] && printf '%s\n' "$CURRENT" | grep -qxF "$MARKER"; then
  if printf '%s\n' "$CURRENT" | grep -qxF "$CRON_LINE"; then
    echo "ok: scheduler cron job present"
    exit 0
  fi
  echo "Updating managed scheduler cron job"
elif [ -n "$EXISTING" ]; then
  echo "ok: scheduler cron job present (added outside deploys, left unchanged):"
  printf '    %s\n' "$EXISTING"
  exit 0
else
  echo "Scheduler cron job missing - creating it"
fi

# Drop any previous managed entry (marker + the line after it), then append ours.
NEW="$(printf '%s\n' "$CURRENT" | awk -v m="$MARKER" '$0 == m { skip = 1; next } skip { skip = 0; next } { print }' | sed '/^$/d')"
{
  [ -n "$NEW" ] && printf '%s\n' "$NEW"
  printf '%s\n%s\n' "$MARKER" "$CRON_LINE"
} | crontab -

if [ -n "$(active_entries "$(crontab -l 2>/dev/null || true)")" ]; then
  echo "ok: scheduler cron job installed: $CRON_LINE"
else
  echo "FATAL: could not install the scheduler cron job"
  exit 1
fi
