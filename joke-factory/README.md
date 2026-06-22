# Yo-Mama Joke Factory

Nightly local pipeline: the i9 wakes at 20:00, generates yo-mama jokes with
Gemma 4, you review/regenerate them on your phone via Telegram, approved jokes
are committed + pushed, then the machine suspends until the next night.

See the design spec: `docs/superpowers/specs/2026-06-22-yo-mama-joke-factory-design.md`.

## One-time setup on the i9 (Omarchy/Arch)

### 1. Clone + Node
```bash
git clone git@github.com:Mickael45/yo-mama-jokes.git ~/yo-mama-jokes
cd ~/yo-mama-jokes
node --version   # expect v22.x
npm install
```
Ensure the SSH deploy key has push access (`git push` must work non-interactively).

### 2. Ollama + models
```bash
# Install ollama per https://ollama.com (Arch: `yay -S ollama` or the official script)
systemctl --user enable --now ollama   # or system service, per your install
ollama pull gemma4:26b-a4b             # confirm the exact tag with `ollama list`
ollama pull jina/jina-embeddings-v2-base-en
```
If the Gemma 4 tag differs, set `OLLAMA_MODEL` in the env file (step 4).

### 3. Telegram bot
1. In Telegram, message **@BotFather** → `/newbot` → copy the **bot token**.
2. Message your new bot once, then visit
   `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy your numeric
   **chat id** from `message.chat.id`.

### 4. Config file (git-ignored)
```bash
cat > ~/yo-mama-jokes/.joke-factory.env <<'EOF'
TELEGRAM_BOT_TOKEN=123456:abc...
TELEGRAM_CHAT_ID=987654321
WAKE_TIME=20:00
IDLE_TIMEOUT_MINUTES=120
BATCH_SIZE=5
OLLAMA_MODEL=gemma4:26b-a4b
EOF
```

### 5. Passwordless suspend (rtcwake)
`rtcwake` lives at `/usr/bin/rtcwake` on some installs and `/usr/sbin/rtcwake` on
others. Find the real path first and whitelist exactly that:
```bash
RTCWAKE=$(command -v rtcwake)   # e.g. /usr/bin/rtcwake or /usr/sbin/rtcwake
echo "$USER ALL=(root) NOPASSWD: $RTCWAKE" | sudo tee /etc/sudoers.d/joke-factory
sudo chmod 440 /etc/sudoers.d/joke-factory
```

### 6. Don't suspend on lid close (headless)
In `/etc/systemd/logind.conf` set `HandleLidSwitch=ignore` (and
`HandleLidSwitchExternalPower=ignore`), then `sudo systemctl restart systemd-logind`.

### 7. Install the loop service
```bash
mkdir -p ~/.config/systemd/user
cp ~/yo-mama-jokes/joke-factory/joke-factory.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now joke-factory.service
loginctl enable-linger "$USER"   # keep the user service alive across logout
```

## Verify the wake/sleep loop
Test `rtcwake` with a short wake before trusting the 20:00 schedule:
```bash
sudo rtcwake -m mem -t "$(date -d '+2 minutes' +%s)"   # suspends; should resume in ~2 min
```
If `-m mem` doesn't resume cleanly on this T2 MacBook, try `-m freeze` or
`-m disk` and update `loop.sh` accordingly.

## Tests
```bash
node --test 'joke-factory/test/*.test.js'
```
