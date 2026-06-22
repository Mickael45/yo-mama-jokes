#!/usr/bin/env bash
# Self-perpetuating nightly loop: run one session, then suspend until the next
# wake time. Started once; rtcwake re-arms the RTC alarm on every cycle.
set -uo pipefail

REPO_DIR="${REPO_DIR:?set REPO_DIR to the repo path on the i9}"
WAKE_TIME="${WAKE_TIME:-20:00}"          # HH:MM, local time
ENV_FILE="${ENV_FILE:-$REPO_DIR/.joke-factory.env}"

cd "$REPO_DIR"

while true; do
  # Load secrets/config (git-ignored).
  set -a; [ -f "$ENV_FILE" ] && . "$ENV_FILE"; set +a

  # Run one nightly session (generation + Telegram review + commit/push).
  node joke-factory/run.js || echo "[loop] run.js exited non-zero"

  # Compute the next wake epoch (today if still ahead, else tomorrow).
  next_epoch=$(date -d "today $WAKE_TIME" +%s)
  now_epoch=$(date +%s)
  if [ "$next_epoch" -le "$now_epoch" ]; then
    next_epoch=$(date -d "tomorrow $WAKE_TIME" +%s)
  fi
  echo "[loop] next wake: $(date -d "@$next_epoch")"

  # Suspend to RAM; returns when the RTC alarm fires at the next wake time.
  sudo rtcwake -m mem -t "$next_epoch" || { echo "[loop] rtcwake failed; sleeping 1h"; sleep 3600; }
done
