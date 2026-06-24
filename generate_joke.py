import os
import random
import glob
import re
import telebot
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List

# 1. Define the mandatory output schema structure
class JokeBatch(BaseModel):
    jokes: List[str] = Field(
        description="A list containing exactly 5 hilarious, unique, and distinct Yo Mama jokes."
    )

# Initialize APIs
TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
TELEGRAM_CHAT_ID = os.environ["TELEGRAM_CHAT_ID"]

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

# 2. Bind the Pydantic schema structure straight into the Gemini config
config = types.GenerateContentConfig(
    temperature=1.0,
    top_p=0.95,
    max_output_tokens=2048,
    response_mime_type="application/json",
    response_schema=JokeBatch,
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

---
EXISTING JOKES POOL (DO NOT REPEAT ANY OF THESE):
{chr(10).join(existing_pool[:300])}
"""

print("Generating jokes via Gemini 3.5 Flash (Structured Mode)...")
response = client.models.generate_content(
    model="gemini-3.5-flash",
    contents=prompt,
    config=config
)

# 3. Parse directly as JSON object matching our schema (No regex needed!)
try:
    # Under the new SDK, response.parsed automatically converts JSON to your Pydantic object
    joke_data = response.parsed
    clean_jokes = [j.strip() for j in joke_data.jokes if j.strip()][:5]
except Exception as e:
    print(f"Fallback parsing required due to schema mismatch: {e}")
    # Backup parsing in case of unexpected structural anomalies
    import json
    data = json.loads(response.text)
    clean_jokes = data.get("jokes", [])

# Ensure we received jokes back before reaching out to Telegram
if not clean_jokes:
    print("Error: No jokes were generated.")
    exit(1)

# Build Telegram Interactive UI Payload
markup = telebot.types.InlineKeyboardMarkup(row_width=1)
for idx, joke in enumerate(clean_jokes, 1):
    markup.add(telebot.types.InlineKeyboardButton(text=f"👍 Keep #{idx}", callback_data=f"keep_{idx}"))

markup.add(telebot.types.InlineKeyboardButton(text="🔄 Rerun Full Batch", callback_data="rerun_all"))

message_text = f"✨ **Fresh Yo Mama Jokes ({selected_category})** ✨\n\n"
for idx, joke in enumerate(clean_jokes, 1):
    message_text += f"**{idx}.** {joke}\n\n"

# Dispatch to your chat sequence
bot.send_message(TELEGRAM_CHAT_ID, message_text, parse_mode="Markdown", reply_markup=markup)
print(f"Batch of {len(clean_jokes)} jokes dispatched to Telegram successfully.")
