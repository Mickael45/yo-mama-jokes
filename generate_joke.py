import os
import random
import glob
import re
import telebot
import numpy as np
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List

# 1. Enforce Structured Outputs Schema
class JokeBatch(BaseModel):
    jokes: List[str] = Field(
        description="A list containing exactly 5 hilarious, completely unique, and distinct Yo Mama jokes."
    )

# 2. Initialization Configurations
TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
TELEGRAM_CHAT_ID = os.environ["TELEGRAM_CHAT_ID"]

client = genai.Client()
bot = telebot.TeleBot(TELEGRAM_BOT_TOKEN)

# 3. Read pre-existing jokes dynamically from your category tree
def get_existing_jokes() -> list:
    existing_jokes = []
    # Reads all markdown files recursively within the jokes folder structure
    for filepath in glob.glob("jokes/**/*.md", recursive=True):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            # Extracts list items starting with '-' or '*'
            jokes = re.findall(r'[-\*]\s*(.+)', content)
            existing_jokes.extend([j.strip() for j in jokes if j.strip()])
    return existing_jokes

# 4. Math-based Embedding Computations for Semantic Deduplication
def get_embedding(text: str) -> list:
    """Fetches high-quality dense vector representations from Gemini."""
    response = client.models.embed_content(
        model="text-embedding-004",
        contents=text,
        config=types.EmbedContentConfig(task_type="SEMANTIC_SIMILARITY")
    )
    return response.embeddings[0].values

def calculate_cosine_similarity(vec_a, vec_b) -> float:
    """Calculates semantic directional distance. 1.0 means exact meaning copy."""
    dot_product = np.dot(vec_a, vec_b)
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)

def is_duplicate_concept(new_joke: str, existing_pool: list, threshold: float = 0.82) -> bool:
    """Validates the joke against existing jokes using vector calculations."""
    if not existing_pool:
        return False

    try:
        new_vector = get_embedding(new_joke)
        # Check a randomized sample of 50 jokes to verify vector consistency
        # (Saves API limits as your joke list scales over thousands of items)
        sampled_pool = random.sample(existing_pool, min(len(existing_pool), 50))

        for old_joke in sampled_pool:
            old_vector = get_embedding(old_joke)
            similarity = calculate_cosine_similarity(new_vector, old_vector)
            if similarity > threshold:
                print(f"Skipped conceptual duplicate: '{new_joke}' matched with '{old_joke}' (Score: {similarity:.2f})")
                return True
    except Exception as e:
        print(f"Embedding check skipped or faulted, defaulting to text validation: {e}")
    return False

# 5. Runtime Execution Loop
def main():
    # Derive categories from the jokes/ folder so new category files are picked up automatically
    available_categories = sorted(
        os.path.splitext(os.path.basename(f))[0]
        for f in glob.glob("jokes/*.ts")
    )
    existing_pool = get_existing_jokes()
    print(f"Analyzing {len(existing_pool)} historical jokes for structural comparisons...")

    # Configure Gemini 3.5 Flash Model Config (category-independent)
    config = types.GenerateContentConfig(
        temperature=1.0, # High creativity
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

    # Gemini occasionally returns no parseable structured output (safety block or
    # token cutoff), leaving response.parsed as None. Try a couple of distinct
    # categories before giving up so one bad category doesn't cost a whole night.
    tried_categories = set()
    selected_category = None
    candidates = []
    for attempt in range(1, 3):
        remaining = [c for c in available_categories if c not in tried_categories]
        if not remaining:
            break
        selected_category = random.choice(remaining)
        tried_categories.add(selected_category)
        print(f"Selected category: {selected_category} (attempt {attempt})")

        prompt = f"""
    Generate exactly 5 completely unique and hilarious 'Yo Mama' jokes belonging to the '{selected_category}' category.

    CRITICAL INSTRUCTIONS:
    1. Do NOT repeat or closely rephrase any of the existing jokes listed below.
    2. Ensure all 5 jokes use entirely different premises, setups, or angles from one another.

    ---
    EXISTING JOKES SAMPLE:
    {chr(10).join(random.sample(existing_pool, min(len(existing_pool), 100)) if existing_pool else [])}
    """

        print("Generating raw batches via Gemini 3.5 Flash...")
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=config
        )

        # response.parsed is None when the response was blocked or truncated.
        joke_data = response.parsed
        if joke_data is None or not getattr(joke_data, "jokes", None):
            print(f"No parseable output for '{selected_category}' (safety block or token cutoff); retrying with another category.")
            continue
        candidates = [j.strip() for j in joke_data.jokes if j.strip()]
        if candidates:
            break

    if not candidates:
        print("Pipeline termination notice: no parseable jokes after retries; aborting.")
        return

    clean_jokes = []
    for joke in candidates:
        if not is_duplicate_concept(joke, existing_pool):
            clean_jokes.append(joke)

    # Cap list values back to 5 indexes maximum
    clean_jokes = clean_jokes[:5]

    if not clean_jokes:
        print("Pipeline termination notice: No unique candidate selections compiled successfully.")
        return

    # 6. Render Telegram Inline Keyboard Callbacks
    markup = telebot.types.InlineKeyboardMarkup(row_width=1)
    for idx, joke in enumerate(clean_jokes, 1):
        markup.add(telebot.types.InlineKeyboardButton(text=f"👍 Keep #{idx}", callback_data=f"keep_{idx}"))

    markup.add(telebot.types.InlineKeyboardButton(text="🔄 Rerun Full Batch", callback_data="rerun_all"))

    # Construct presentation template
    message_text = f"✨ **Fresh Yo Mama Jokes ({selected_category})** ✨\n\n"
    for idx, joke in enumerate(clean_jokes, 1):
        message_text += f"**{idx}.** {joke}\n\n"

    # Send out message
    bot.send_message(TELEGRAM_CHAT_ID, message_text, parse_mode="Markdown", reply_markup=markup)
    print(f"Successfully delivered {len(clean_jokes)} pristine options directly to your device.")

if __name__ == "__main__":
    main()
