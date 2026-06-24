import os
import random
import glob
import re
import telebot
import google.generativeai as genai

# Initialize APIs
TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
TELEGRAM_CHAT_ID = os.environ["TELEGRAM_CHAT_ID"]
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

bot = telebot.TeleBot(TELEGRAM_BOT_TOKEN)

# 1. Read existing jokes to serve as negative context
def get_existing_jokes():
    existing_jokes = []
    # Assuming markdown format files based on your repo hierarchy
    for filepath in glob.glob("jokes/**/*.md", recursive=True):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            # Basic parsing: extract list items or blockquotes
            jokes = re.findall(r'[-\*]\s*(.+)', content)
            existing_jokes.extend([j.strip() for j in jokes if j.strip()])
    return existing_jokes

# 2. Select a fresh random category
CATEGORIES = ["Tech", "Classic", "Short", "Absurd", "Pop Culture", "Gaming", "Sports"]
selected_category = random.choice(CATEGORIES)

existing_pool = get_existing_jokes()

# 3. Configure Gemini 3.5 Flash for high-quality variety
generation_config = {
    "temperature": 1.0,  # Elevated for sharper comedy/creative risks
    "top_p": 0.95,
    "max_output_tokens": 1024,
}

model = genai.GenerativeModel(
    model_name="gemini-3.5-flash",
    generation_config=generation_config,
    system_instruction=(
        "You are a master comedy writer specialized in sharp, clever 'Yo Mama' jokes. "
        "Your humor uses clever subversions, smart metaphors, and punchy delivery. "
        "Avoid repetitive templates (e.g., don't start every joke with 'Yo mama so...')."
    )
)

# 4. Construct the prompt with deduplication rules
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

# Generate content instantly
print("Generating jokes via Gemini 3.5 Flash...")
response = model.generate_content(prompt)
raw_jokes = response.text.strip().split("\n")

# Filter list formatting
clean_jokes = [re.sub(r'^\d+[\.\s\-]+', '', j).strip() for j in raw_jokes if j.strip()][:5]

# 5. Fast payload dispatch to Telegram with Inline Keyboard Actions
markup = telebot.types.InlineKeyboardMarkup(row_width=1)

# Generate quick action buttons corresponding to your selection flow
for idx, joke in enumerate(clean_jokes, 1):
    markup.add(telebot.types.InlineKeyboardButton(text=f"👍 Keep #{idx}", callback_data=f"keep_{idx}"))

markup.add(telebot.types.InlineKeyboardButton(text="🔄 Rerun Full Batch", callback_data="rerun_all"))

# Send everything in one prompt package
message_text = f"✨ **Fresh Yo Mama Jokes ({selected_category})** ✨\n\n"
for idx, joke in enumerate(clean_jokes, 1):
    message_text += f"**{idx}.** {joke}\n\n"

bot.send_message(TELEGRAM_CHAT_ID, message_text, parse_mode="Markdown", reply_markup=markup)
print("Batch dispatched to Telegram successfully.")
