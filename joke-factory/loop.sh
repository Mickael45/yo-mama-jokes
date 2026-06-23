#!/usr/bin/env bash
# Self-perpetuating nightly loop: run one session, then suspend until the next
# wake time. Started once; rtcwake re-arms the RTC alarm on every cycle.
set -uo pipefail

REPO_DIR="${REPO_DIR:?set REPO_DIR to the repo path on the i9}"
WAKE_TIME="${WAKE_TIME:-20:00}"          # HH:MM, local time
ENV_FILE="${ENV_FILE:-$REPO_DIR/.joke-factory.env}"

cd "$REPO_DIR"

# Wait until we can actually reach Telegram before running. On a cold boot the
# loop starts before Wi-Fi/DNS is ready, so an immediate run dies with EAI_AGAIN
# and burns the whole night. Poll up to ~5 min, then give up and let run.js fail
# gracefully (the loop re-arms and tries again next cycle).
wait_for_network() {
  for _ in $(seq 1 60); do
    if curl -s -o /dev/null --max-time 10 https://api.telegram.org; then
      return 0
    fi
    echo "[loop] network not ready, waiting…"
    sleep 5
  done
  echo "[loop] network still down after 5 min; proceeding anyway"
}

while true; do
  # Load secrets/config (git-ignored).
  set -a; [ -f "$ENV_FILE" ] && . "$ENV_FILE"; set +a

  wait_for_network

  # Run one nightly session (generation + Telegram review + commit/push).
  node joke-factory/run.js || echo "[loop] run.js exited non-zero"

  # Compute the next wake epoch (today if still ahead, else tomorrow).
  next_epoch=$(date -d "today $WAKE_TIME" +%s)
  now_epoch=$(date +%s)
  if [ "$next_epoch" -le "$now_epoch" ]; then
    next_epoch=$(date -d "tomorrow $WAKE_TIME" +%s)
  fi
  echo "[loop] next wake: $(date -d "@$next_epoch")"

  # Suspend until the RTC alarm fires at the next wake time. Use s2idle (freeze)
  # rather than deep (-m mem): on this T2 MacBook -m mem did not resume cleanly
  # (suspended but never woke, needed a hard reboot). freeze is the reliable mode
  # here; if it ever misbehaves, -m disk (hibernate) is the next fallback.
  sudo rtcwake -m freeze -t "$next_epoch" || { echo "[loop] rtcwake failed; sleeping 1h"; sleep 3600; }
done
