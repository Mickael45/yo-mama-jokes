import os
import requests
import base64

GITHUB_TOKEN = os.environ["MINIMAL_GITHUB_PAT"] # Repository scoping token
REPO_OWNER = "Mickael45"
REPO_NAME = "yo-mama-jokes"
TARGET_FILE = "jokes/classic.md" # Dynamically target categories based on callback payload

def commit_selected_joke(joke_string):
    url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/contents/{TARGET_FILE}"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }

    # 1. Fetch file context to maintain references
    res = requests.get(url, headers=headers)
    sha = ""
    current_content = ""

    if res.status_code == 200:
        file_data = res.json()
        sha = file_data["sha"]
        current_content = base64.b64decode(file_data["content"]).decode("utf-8")

    # 2. Append text format line
    updated_content = f"{current_content.strip()}\n- {joke_string}\n"
    encoded_bytes = base64.b64encode(updated_content.encode("utf-8")).decode("utf-8")

    # 3. Secure commit request payload
    payload = {
        "message": f"🤖 comedy-bot: append curated joke",
        "content": encoded_bytes,
        "sha": sha
    }

    push_res = requests.put(url, headers=headers, json=payload)
    if push_res.status_code in [200, 201]:
        print("Joke safely committed back to the repository data index.")
