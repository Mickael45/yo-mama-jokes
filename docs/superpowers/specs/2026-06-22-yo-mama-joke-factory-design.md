# Yo-Mama Joke Factory — Design Spec

**Date:** 2026-06-22
**Author:** Mickael (with Claude)
**Status:** Draft — pending review

## Summary

A self-contained nightly pipeline that generates new yo-mama jokes with a local
LLM, lets the user review/regenerate them from their phone, and commits the
approved jokes back to the `yo-mama-jokes` repo. Runs entirely on the user's
Intel i9 MacBook Pro (running Omarchy/Arch Linux) — no cloud, no email, no
always-on server.

The existing site is a static Astro build whose jokes live in `jokes/*.ts`
(21 category files). New jokes are currently added by a human via the
interactive `generate_jokes.js` script, which validates novelty using local
Ollama embeddings before committing. This project automates the *generation* of
candidate jokes (which does not exist today) and replaces the interactive CLI
approval with a phone-based (Telegram) review loop.

## Goals

- Generate funny, on-brand yo-mama jokes automatically, on a daily cadence.
- Guarantee generated jokes are novel relative to the existing category (no
  near-duplicates).
- Let the user review a batch and **regenerate as many times as needed** until
  a batch is good — controlled from an Android phone.
- On approval, commit the kept jokes to the repo and push (feeding the existing
  daily Vercel rebuild).
- Stay fully local and free: generation runs on the i9 with a local model.

## Non-Goals

- No always-on infrastructure (the Raspberry Pi is explicitly dropped).
- No email digest (replaced by the Telegram review loop).
- No cloud LLM (no Claude/OpenAI API in the default design).
- No public web endpoint / inbound network exposure.
- Not changing the site's rendering, daily-picker, or deploy pipeline.

## Hardware & Runtime Context

- **Machine:** Intel i9-9980HK (16 threads), 62 GB RAM, AMD Radeon RX 5500M
  (4 GB VRAM) + Intel UHD 630, running Omarchy (Arch Linux). T2 Mac, on Wi-Fi.
- **Why this machine:** 62 GB RAM runs any Gemma 4 variant; Linux gives real
  `systemd`/`rtcwake` scheduling that macOS/Apple-Silicon could not.
- **Power state:** stays home, normally suspended (S3). It is **not** always-on.

### Wake/sleep constraints (load-bearing)

- This is a **T2 Apple laptop on Wi-Fi**, so two common mechanisms are
  unavailable:
  - **No reliable RTC cold-boot** from full power-off under Linux on a Mac.
  - **No Wake-on-LAN** (Wi-Fi radio sleeps; WoWLAN on a T2 Mac under Linux is a
    non-starter).
- The mechanism that **does** work: **suspend-to-RAM (S3) + `rtcwake`** to wake
  the machine at a scheduled time. The design is built on this.

## Architecture

Single machine, single self-perpetuating process. The repo is cloned on the i9;
the factory runs from within it and pushes commits back to GitHub
(`git@github.com:Mickael45/yo-mama-jokes.git`), which triggers the existing
daily rebuild.

```
        ┌─────────────────────────── i9 (Omarchy) ───────────────────────────┐
        │                                                                     │
  20:00 │  rtcwake resume                                                     │
   ───▶ │   └─▶ joke-factory (Node)                                           │
        │        1. pick random category (date-seeded)                        │
        │        2. Ollama: Gemma 4 26B-A4B → 5 candidates                    │
        │        3. dedup: context + jina embeddings (0.84) vs jokes/<cat>.ts │
        │        4. Telegram bot ──────────────────────────────▶ 📱 Android   │
        │        5. ◀── regenerate / steer / keeper taps / approve ───────────│
        │        6. on approve → git commit + push keepers                    │
        │        7. arm tomorrow 20:00 → rtcwake suspend ─────────────────────│
        └─────────────────────────────────────────────────────────────────────┘
                                                              push ──▶ GitHub ──▶ Vercel rebuild
```

## The Nightly Cycle

1. **20:00 — Wake.** The i9 resumes from suspend via a previously-armed
   `rtcwake` RTC alarm.
2. **Generate.** Pick one random category from the 21 (seeded by the UTC date so
   it's reproducible and rotates). Prompt local **Gemma 4 26B-A4B** (via Ollama)
   for **5 candidate jokes** in that category's style.
3. **Dedup (both methods).**
   - *Context:* the existing jokes for that category are passed to Gemma so it
     avoids repeats up front.
   - *Embedding:* each candidate is embedded with the local `jina` model and
     compared (cosine) against every existing joke in the category; anything
     ≥ **0.84** is dropped and silently re-rolled before the user sees it.
4. **Review (Telegram).** A Telegram bot (running on the i9 during the awake
   window) sends the deduped batch to the user's phone with inline buttons:
   - `🔁 5 more` — regenerate a fresh batch, same category
   - `🎯 steer` — free-text steering (e.g. "make them about traffic")
   - `👍` per joke — mark an individual joke as a keeper
   - `✅ Done` — finish and commit kept jokes
5. **Approve & commit.** On `✅ Done`, kept jokes are appended to
   `jokes/<category>.ts`, committed, and pushed. Reuses the dedup+write logic
   from the existing `generate_jokes.js`, made non-interactive.
6. **Sleep.** The process computes tomorrow's 20:00 epoch, arms the RTC alarm,
   and suspends (`rtcwake -m mem -t <epoch>`). On the next resume the loop
   repeats.
7. **Idle timeout.** If the user does not respond within **2 hours**, the
   session ends with nothing committed and the machine suspends (re-arming the
   next wake).

## Components

| Component | Tech | Notes |
|---|---|---|
| Orchestrator | Node.js script in the repo | Extends `generate_jokes.js`; reuses its `ollama` dep + dedup logic |
| Generator | Ollama + **Gemma 4 26B-A4B** | MoE: ~4B active params/token → fast on CPU. Verify exact Ollama tag at impl time |
| Dedup (embeddings) | Ollama `jina/jina-embeddings-v2-base-en` | Existing model + 0.84 threshold, already in `generate_jokes.js` |
| Phone control | Telegram Bot API (long-poll) | Node lib (e.g. `node-telegram-bot-api` / `telegraf`); no public URL needed |
| Wake/sleep | `rtcwake` in a self-perpetuating loop | Run as a `systemd` service (`Restart=always`) so it survives crashes |
| VCS | `git` push over SSH | i9 needs a clone + working SSH deploy key |

### Generation engine details

- Default to **CPU** inference (62 GB RAM, 8 cores comfortably run 26B-A4B).
- **Optional:** benchmark partial layer offload to the Radeon RX 5500M via
  llama.cpp's **Vulkan** backend during implementation; enable only if clearly
  faster (4 GB VRAM is small, so likely a marginal win).

### Wake/sleep mechanism

A `systemd` service runs a loop:

```sh
while true; do
  run_factory_session          # generate → telegram review → commit (or 2h timeout)
  next=$(date -d 'tomorrow 20:00' +%s)
  sudo rtcwake -m mem -t "$next"   # suspends now; returns when RTC wakes it at 20:00
done
```

- `rtcwake -m mem -t <epoch>` suspends to RAM and returns when the system
  resumes, making the loop self-perpetuating.
- `systemd` timers are **not** used to wake the machine — they cannot wake from
  suspend; only the armed RTC alarm can. (This will be validated on the actual
  hardware during implementation; if `-m mem` misbehaves on this T2 Mac,
  fall back to `-m freeze` or `-m disk` and re-test.)
- First launch is manual (`systemctl --user start joke-factory` or equivalent);
  thereafter it self-perpetuates.

## Configuration & Secrets

Stored in a local, **git-ignored** config file on the i9 (e.g.
`.joke-factory.env`):

- `TELEGRAM_BOT_TOKEN` — from @BotFather
- `TELEGRAM_CHAT_ID` — the user's own chat ID (bot only talks to this ID)
- `WAKE_TIME` — default `20:00`
- `IDLE_TIMEOUT_MINUTES` — default `120`
- `BATCH_SIZE` — default `5`
- `SIMILARITY_THRESHOLD` — default `0.84`
- `OLLAMA_MODEL` — default Gemma 4 26B-A4B tag
- `OLLAMA_EMBEDDING_MODEL` — default `jina/jina-embeddings-v2-base-en`

## Prerequisites (one-time setup on the i9)

1. Clone the repo and configure an SSH deploy key with push access.
2. Install Ollama; `ollama pull` the Gemma 4 26B-A4B model and the `jina`
   embedding model.
3. Create a Telegram bot via @BotFather; record token + chat ID into the config.
4. Grant passwordless `sudo` for `rtcwake` (or a polkit rule) so the loop can
   suspend without a prompt.
5. Install Node deps; register the `systemd` service.
6. Confirm `HandleLidSwitch` behavior in `logind.conf` so closing the lid does
   not fight the suspend/wake loop.

## Error Handling

- **Model/Ollama failure:** send a Telegram message describing the error;
  suspend and try again next night (don't burn the cycle in a crash loop —
  `systemd` `Restart=always` + a backoff guard).
- **All candidates dedup-rejected:** auto re-roll up to N times; if still empty,
  notify via Telegram and offer `🔁 5 more`.
- **Git push fails:** keep the kept jokes staged locally, notify via Telegram,
  retry on next wake; never lose an approved joke.
- **No phone response:** 2-hour timeout → suspend, nothing committed.
- **Telegram unreachable:** log, suspend, retry next night.

## Known Limitations (accepted trade-offs)

- The factory can only act during the **20:00 window it wakes for**. If the
  machine is carried away, fully shut down, or off the network at 20:00, that
  night's batch is skipped — caught the next night.
- No remote wake (Wi-Fi + T2 Mac), so the schedule is fixed, not on-demand.
- Single point of presence: if the i9 is unavailable, nothing runs (acceptable
  per the "no always-on box" decision).

## Open Questions (resolve during implementation)

- Exact Ollama tag/quantization for Gemma 4 26B-A4B, and a CPU-vs-Vulkan
  benchmark to set the default.
- `rtcwake` suspend mode that's reliable on this specific T2 MacBook (`mem` vs
  `freeze` vs `disk`).
- Node Telegram library choice (`telegraf` vs `node-telegram-bot-api`).
- Whether to keep approved jokes on a feature branch + open a PR, or commit
  straight to `main` (current `generate_jokes.js` pushes directly).
