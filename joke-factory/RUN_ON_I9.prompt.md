# Claude Code handoff prompt — finish the Joke Factory on the i9

> **How to use:** on the i9 (Omarchy/Arch), `cd` into this repo on branch `joke-factory`, start Claude Code, and paste this whole file as your first message (or run `claude -p "$(cat joke-factory/RUN_ON_I9.prompt.md)"`).

---

You are continuing work on the **Yo-Mama Joke Factory** in this repo. It was designed, built, and unit-tested on a different machine (26/26 unit tests pass). All the **pure logic is done**; what remains is everything that can only be verified on THIS machine — an Intel i9 MacBook Pro (T2) running Omarchy/Arch Linux, on Wi-Fi. **Your job: stand it up live here and fix whatever breaks in this real environment.** Work on the current `joke-factory` branch and commit each environment fix with a clear message.

## Read first
- `joke-factory/README.md` — the full setup runbook (Ollama, Telegram bot, `.joke-factory.env`, sudoers, logind, systemd). Follow it.
- `docs/superpowers/specs/2026-06-22-yo-mama-joke-factory-design.md` — the design and intent. Don't drift from it.
- The code lives in `joke-factory/` (`lib/*.js`, `bot.js`, `run.js`, `loop.sh`, `joke-factory.service`).

## What the system does (one paragraph)
Nightly at 20:00 the machine wakes from suspend (`rtcwake`), picks a random joke category, generates yo-mama jokes with a local **Gemma 4 26B-A4B** model via Ollama, sends them to my phone over a **Telegram bot** with inline buttons (regenerate / steer / keep / done), commits the jokes I approve into `jokes/<category>.ts` and pushes, then suspends until the next night. Idle timeout 120 min. Fully local — no cloud LLM.

## Do these in order. Fix as you go; commit fixes on this branch.

**0. Prereqs.** Confirm `node --version` is 22.x. Run `npm install`. Confirm Ollama is installed and its service is running.

**1. Models — VERIFY THE TAGS (they were guessed off-machine).**
   - `ollama list`. The config default is `OLLAMA_MODEL=gemma4:26b-a4b`. If that exact tag doesn't exist, find the correct **Gemma 4 26B-A4B (the MoE, ~4B active)** tag in Ollama's registry, `ollama pull` it, and set the right value in `.joke-factory.env`. If 26B-A4B isn't available, fall back to `gemma4:12b` and tell me.
   - `ollama pull jina/jina-embeddings-v2-base-en` (the embedding model for dedup).

**2. Telegram bot.** Create a bot via @BotFather and get your numeric chat id (README step 3 has the exact procedure). **Ask me for the token and chat id** — then write `.joke-factory.env` (it's git-ignored). Required keys: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`; optional `OLLAMA_MODEL`, `WAKE_TIME`, `IDLE_TIMEOUT_MINUTES`, `BATCH_SIZE`.

**3. Unit tests.** `node --test 'joke-factory/test/*.test.js'` → expect **26 pass / 0 fail**. (Use the glob; the bare-dir form misreports under Node 22.)

**4. Generation smoke test.** `TELEGRAM_BOT_TOKEN=x TELEGRAM_CHAT_ID=x node joke-factory/scripts/smoke-ollama.js` → expect a few novel "Yo mama…" jokes for the `fat` category, none duplicating existing ones. If it errors, fix the model tag / Ollama host and re-run.

**5. Live Telegram session.** Run one real session with a short timeout and watch your phone:
   ```bash
   IDLE_TIMEOUT_MINUTES=5 node joke-factory/run.js
   ```
   On your phone, confirm: the batch arrives with buttons; `🔁 5 more` regenerates; `🎯 steer` + a text reply steers the next batch; `👍 n` toggles a keeper (button shows ✅); `✅ Done` appends the kept joke(s), commits, and pushes.
   - **Watch for an API-shape mismatch:** `bot.editMessageReplyMarkup` in `joke-factory/bot.js` is called as `editMessageReplyMarkup(markup, { chat_id, message_id })`. If `node-telegram-bot-api@0.66.0` rejects that, fix the call to match the installed library's signature and commit.
   - Test on a throwaway branch if you'd rather not push test jokes to `main`'s pipeline: `git checkout -b factory-test`, run, verify `git show --stat HEAD`, then `git checkout joke-factory && git branch -D factory-test`.

**6. Wake/suspend (`rtcwake`).**
   - Find the real path: `command -v rtcwake` (Arch is often `/usr/bin/rtcwake`, not `/usr/sbin`). Set up passwordless sudo for **that** path (README step 5).
   - Short-wake test: `sudo rtcwake -m mem -t "$(date -d '+2 minutes' +%s)"` — it should suspend and resume in ~2 min. **If `-m mem` doesn't resume cleanly on this T2 MacBook, try `-m freeze` then `-m disk`**, and update the mode in `joke-factory/loop.sh` to whatever works. Commit the change.
   - Set `HandleLidSwitch=ignore` in `/etc/systemd/logind.conf` so closing the lid doesn't fight the loop (README step 6).

**7. systemd service.** Install and enable `joke-factory.service` (README step 7), `loginctl enable-linger`, and confirm it starts: `systemctl --user status joke-factory.service` and `journalctl --user -u joke-factory.service -f`. Optionally set `WAKE_TIME` a couple minutes out to watch one full cycle.

**8. Decision to raise with me:** `node-telegram-bot-api@0.66.0` pulls the deprecated `request` dependency chain (npm audit flags vulnerabilities — devDependency only, never shipped to the static site). Ask me whether to migrate the bot to **`telegraf`** (actively maintained, no `request` chain) or leave it.

## Already fixed off-machine — do NOT redo
- `parseJokes` now keeps "Yo momma" and smart-quoted lines (regex `^yo\s+m[ao]m{1,2}a\b`).
- The Telegram batch is sent as **plain text** (Markdown parse_mode was removed) so jokes containing `*`/`_`/`` ` `` don't break the message.

## When done
Summarize: which steps passed, what you changed (model tag, rtcwake mode, any API-shape fix), and the `telegraf` decision. Then the nightly loop should run on its own at 20:00.
