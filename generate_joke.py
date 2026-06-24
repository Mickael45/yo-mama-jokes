import os
import random
import glob
import re
import telebot
from google import genai
from google.genai import types

# Initialize APIs
TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
TELEGRAM_CHAT_ID = os.environ["TELEGRAM_CHAT_ID"]

# The new SDK automatically picks up the GEMINI_API_KEY environment variable
client = genai.Client()
bot = telebot.TeleBot(TELEGRAM_BOT_TOKEN)

def get_existing_jokes():
    existing_jokes = []
    for filepath in glob.glob("jokes/**/*.md", recursive=True):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            jokes = re.findall(r'[-\*]\s*(.+)', content)
            existing_jokes.extend([j.strip() for j in jokes if j.strip()])
    return existing_jokes

CATEGORIES = ["Tech", "Classic", "Short", "Absurd", "Pop Culture", "Gaming", "Sports"]
selected_category = random.choice(CATEGORIES)
existing_pool = get_existing_jokes()

# Configure parameters under the new SDK structure
config = types.GenerateContentConfig(
    temperature=1.0,
    top_p=0.95,
    max_output_tokens=1024,
    system_instruction=(
        "You are a master comedy writer specialized in sharp, clever 'Yo Mama' jokes. "
        "Your humor uses clever subversions, smart metaphors, and punchy delivery. "
        "Avoid repetitive templates (e.g., don't start every joke with 'Yo mama so...')."
    )
)

prompt = f"""
Generate exactly 5 completely unique and hilarious 'Yo Mama' jokes belonging to the '{selected_category}' category.

CRITICAL INSTRUCTIONS:
1. Do NOT repeat or closely rephrase any of the existing jokes listed below.
2. Ensure all 5 jokes use entirely different premises, setups, or angles from one another.
3. Return the output as a clean numbered list (1 to 5). No conversational fillers or introductory text.

---
EXISTING JOKES POOL (DO NOT REPEAT ANY OF THESE):
{chr(10).join(existing_pool[:300])}
"""

print("Generating jokes via Gemini 3.5 Flash...")
response = client.models.generate_content(
    model="gemini-3.5-flash",
    contents=prompt,
    config=config
)

raw_jokes = response.text.strip().split("\n")
clean_jokes = [re.sub(r'^\d+[\.\s\-]+', '', j).strip() for j in raw_jokes if j.strip()][:5]

# Build Telegram Interactive UI Payload
markup = telebot.types.InlineKeyboardMarkup(row_width=1)
for idx, joke in enumerate(clean_jokes, 1):
    # Pass an index reference back to your Vercel webhook processor
    markup.add(telebot.types.InlineKeyboardButton(text=f"👍 Keep #{idx}", callback_data=f"keep_{idx}"))

markup.add(telebot.types.InlineKeyboardButton(text="🔄 Rerun Full Batch", callback_data="rerun_all"))

message_text = f"✨ **Fresh Yo Mama Jokes ({selected_category})** ✨\n\n"
for idx, joke in enumerate(clean_jokes, 1):
    message_text += f"**{idx}.** {joke}\n\n"

# Dispatch
bot.send_message(TELEGRAM_CHAT_ID, message_text, parse_mode="Markdown", reply_markup=markup)
print("Batch dispatched to Telegram successfully.")
