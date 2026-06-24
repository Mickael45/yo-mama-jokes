import os
import re
import base64
import requests
import telebot
from flask import Flask, request

# Initialize API wrappers
TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
GITHUB_TOKEN = os.environ["MINIMAL_GITHUB_PAT"]
REPO_OWNER = "Mickael45"
REPO_NAME = "yo-mama-jokes"

bot = telebot.TeleBot(TELEGRAM_BOT_TOKEN, threaded=False)
app = Flask(__name__)

def commit_to_github(category: str, joke_string: str) -> bool:
    """Fetches, appends, and pushes a joke directly to your GitHub repo file."""
    # Convert category down to matching file conventions (e.g., 'Tech' -> 'jokes/tech.md')
    file_path = f"jokes/{category.lower()}.md"
    url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/contents/{file_path}"

    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }

    # 1. Download existing file data
    res = requests.get(url, headers=headers)
    sha = ""
    current_content = ""

    if res.status_code == 200:
        file_data = res.json()
        sha = file_data["sha"]
        current_content = base64.b64decode(file_data["content"]).decode("utf-8")
    elif res.status_code == 404:
        # File doesn't exist yet, create it fresh
        current_content = f"# {category} Jokes\n"
    else:
        return False

    # 2. Format and Append
    updated_content = f"{current_content.strip()}\n- {joke_string}\n"
    encoded_bytes = base64.b64encode(updated_content.encode("utf-8")).decode("utf-8")

    # 3. Secure PUT request payload
    payload = {
        "message": f"🤖 comedy-bot: append curated {category} joke",
        "content": encoded_bytes,
        "sha": sha if sha else None
    }

    push_res = requests.put(url, headers=headers, json=payload)
    return push_res.status_code in [200, 201]

def trigger_github_rerun() -> bool:
    """Commands GitHub Actions to execute your daily comedy engine immediately."""
    url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/actions/workflows/generate-jokes.yml/dispatches"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }
    payload = {"ref": "main"}
    res = requests.post(url, headers=headers, json=payload)
    return res.status_code == 204

@bot.callback_query_handler(func=lambda call: True)
def handle_menu_clicks(call):
    # CRITICAL: Instantly stop the Telegram loading animation on your phone
    bot.answer_callback_query(call.id, text="Processing action...")

    message_text = call.message.text

    # Parse out the category name from your header: "✨ Fresh Yo Mama Jokes (Category) ✨"
    category_match = re.search(r"Fresh Yo Mama Jokes \((.*?)\)", message_text)
    category = category_match.group(1) if category_match else "Classic"

    if call.data == "rerun_all":
        if trigger_github_rerun():
            bot.edit_message_text(
                chat_id=call.message.chat.id,
                message_id=call.message.message_id,
                text=f"🔄 *Regenerating batch...* New items will arrive in seconds!",
                parse_mode="Markdown"
            )
        return

    if call.data.startswith("keep_"):
        # Identify which joke number was clicked (e.g. keep_3 -> index 3)
        joke_idx = int(call.data.split("_")[1])

        # Regex splits lines matching pattern "1. Joke text"
        jokes_found = re.findall(r"^\d+\.\s*(.+)$", message_text, re.MULTILINE)

        if not jokes_found or joke_idx > len(jokes_found):
            bot.send_message(call.message.chat.id, "❌ Error parsing joke arrays.")
            return

        selected_joke = jokes_found[joke_idx - 1].strip()

        # Dispatch to GitHub
        if commit_to_github(category, selected_joke):
            # Clean up the UI: Replace buttons with a success checkmark text
            bot.edit_message_text(
                chat_id=call.message.chat.id,
                message_id=call.message.message_id,
                text=f"{message_text}\n\n✅ *Added joke #{joke_idx} to jokes/{category.lower()}.md!*",
                parse_mode="Markdown",
                reply_markup=None # Erases the buttons permanently
            )
        else:
            bot.send_message(call.message.chat.id, "❌ GitHub API Write Failure. Check your MINIMAL_GITHUB_PAT token access rights.")

@app.route("/api/webhook", methods=["POST"])
def webhook():
    """Vercel router ingestion endpoint entrypoint."""
    if request.headers.get('content-type') == 'application/json':
        json_string = request.get_data().decode('utf-8')
        update = telebot.types.Update.de_json(json_string)
        bot.process_new_updates([update])
        return "OK", 200
    return "Forbidden", 403
