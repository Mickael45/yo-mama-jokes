import os
import re
import hmac
import base64
import requests
import telebot
from flask import Flask, request

# Initialize API wrappers. Read with .get so a missing var never crashes the
# module at import time (which would 500 even the health check); the values are
# only actually required when handling a real callback.
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
GITHUB_TOKEN = os.environ.get("MINIMAL_GITHUB_PAT", "")
# Shared secret Telegram echoes in the X-Telegram-Bot-Api-Secret-Token header.
# Set the SAME value as the secret_token when registering via setWebhook.
WEBHOOK_SECRET = os.environ.get("TELEGRAM_WEBHOOK_SECRET", "")
# Only this chat is allowed to curate jokes.
ALLOWED_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")
REPO_OWNER = "Mickael45"
REPO_NAME = "yo-mama-jokes"

# Categories are single lowercase words matching jokes/<category>.ts filenames.
# Validating against this also blocks path traversal in the committed file path.
VALID_CATEGORY = re.compile(r"^[a-z]+$")

bot = telebot.TeleBot(TELEGRAM_BOT_TOKEN, threaded=False)
app = Flask(__name__)


def commit_to_github(category: str, joke_string: str) -> bool:
    """Append a joke to the category's TypeScript array and commit it."""
    # The Astro site reads jokes/<category>.ts (export default [...]), NOT markdown.
    file_path = f"jokes/{category}.ts"
    url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/contents/{file_path}"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    }

    # Escape for embedding inside a double-quoted TS string literal.
    safe_joke = joke_string.replace("\\", "\\\\").replace('"', '\\"')

    res = requests.get(url, headers=headers)
    sha = None
    if res.status_code == 200:
        file_data = res.json()
        sha = file_data["sha"]
        current = base64.b64decode(file_data["content"]).decode("utf-8")
        # Insert the new entry just before the array's final closing bracket.
        idx = current.rfind("]")
        if idx == -1:
            return False
        updated = current[:idx] + f'  "{safe_joke}",\n' + current[idx:]
    elif res.status_code == 404:
        updated = f'export default [\n  "{safe_joke}",\n];\n'
    else:
        return False

    payload = {
        "message": f"🤖 comedy-bot: append curated {category} joke",
        "content": base64.b64encode(updated.encode("utf-8")).decode("utf-8"),
    }
    if sha:
        payload["sha"] = sha

    push_res = requests.put(url, headers=headers, json=payload)
    return push_res.status_code in (200, 201)


def trigger_github_rerun() -> bool:
    """Dispatch the daily comedy engine workflow on demand."""
    url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/actions/workflows/generate-jokes.yml/dispatches"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    }
    res = requests.post(url, headers=headers, json={"ref": "main"})
    return res.status_code == 204


@bot.callback_query_handler(func=lambda call: True)
def handle_menu_clicks(call):
    # Allowlist: only the configured chat may curate (defense in depth).
    if ALLOWED_CHAT_ID and str(call.message.chat.id) != ALLOWED_CHAT_ID:
        bot.answer_callback_query(call.id, text="Not authorized.")
        return

    bot.answer_callback_query(call.id, text="Processing action...")
    message_text = call.message.text or ""

    # Header: "✨ Fresh Yo Mama Jokes (<category>) ✨" (Telegram strips the markup).
    category_match = re.search(r"Fresh Yo Mama Jokes \((.*?)\)", message_text)
    category = category_match.group(1).strip().lower() if category_match else ""

    if call.data == "rerun_all":
        if trigger_github_rerun():
            bot.edit_message_text(
                chat_id=call.message.chat.id,
                message_id=call.message.message_id,
                text="🔄 *Regenerating batch...* New items will arrive in seconds!",
                parse_mode="Markdown",
            )
        return

    if call.data.startswith("keep_"):
        if not VALID_CATEGORY.match(category):
            bot.send_message(call.message.chat.id, f"❌ Unrecognized category: {category!r}")
            return

        joke_idx = int(call.data.split("_")[1])
        # Joke lines are "**1.** text" or "1. text" depending on whether Telegram
        # stripped the markdown; tolerate both leading/inner asterisks.
        jokes_found = re.findall(r"^\*{0,2}\d+\.\*{0,2}\s*(.+)$", message_text, re.MULTILINE)
        if not jokes_found or joke_idx > len(jokes_found):
            bot.send_message(call.message.chat.id, "❌ Error parsing joke arrays.")
            return

        selected_joke = jokes_found[joke_idx - 1].strip()
        if commit_to_github(category, selected_joke):
            bot.edit_message_text(
                chat_id=call.message.chat.id,
                message_id=call.message.message_id,
                text=f"{message_text}\n\n✅ Added joke #{joke_idx} to jokes/{category}.ts!",
                reply_markup=None,  # Erase the buttons
            )
        else:
            bot.send_message(call.message.chat.id, "❌ GitHub API write failure. Check MINIMAL_GITHUB_PAT scopes.")


@app.route("/api/webhook", methods=["POST"])
def webhook():
    """Telegram webhook ingestion endpoint."""
    # Verify the shared secret Telegram echoes back; reject anything forged.
    provided = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
    if not WEBHOOK_SECRET or not hmac.compare_digest(provided, WEBHOOK_SECRET):
        return "Forbidden", 403

    if request.headers.get("content-type") == "application/json":
        try:
            update = telebot.types.Update.de_json(request.get_data().decode("utf-8"))
        except (KeyError, ValueError):
            # Not a well-formed Telegram update (e.g. a manual probe). Ack and
            # drop it — returning 5xx would make Telegram retry indefinitely.
            return "OK", 200
        if update is not None:
            bot.process_new_updates([update])
        return "OK", 200
    return "Forbidden", 403


@app.route("/api/webhook", methods=["GET"])
def health():
    """Liveness probe — confirms the function is deployed and routable."""
    return "yo-mama webhook up", 200
