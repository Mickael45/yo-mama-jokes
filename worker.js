/**
 * Telegram webhook — Cloudflare Worker.
 *
 * Ported from the retired Vercel function `api/webhook.py`. Serves POST/GET at
 * `/api/webhook`; everything else is handled by static assets (see
 * wrangler.jsonc `run_worker_first: ["/api/*"]`). The daily `generate_joke.py`
 * GitHub Action posts a joke batch to Telegram with inline buttons; tapping one
 * sends a callback_query here, which we turn into a GitHub commit (Keep) or a
 * workflow_dispatch (Rerun).
 *
 * Required Worker secrets (set via `wrangler secret put <NAME>` or the dash):
 *   TELEGRAM_BOT_TOKEN       — bot token from @BotFather
 *   MINIMAL_GITHUB_PAT       — PAT with Contents:write + Actions:write on the repo
 *   TELEGRAM_WEBHOOK_SECRET  — same value passed as setWebhook's secret_token
 *   TELEGRAM_CHAT_ID         — the only chat allowed to curate
 */

const REPO_OWNER = "Mickael45";
const REPO_NAME = "yo-mama-jokes";

// Categories are single lowercase words matching jokes/<category>.ts filenames.
// Validating against this also blocks path traversal in the committed file path.
const VALID_CATEGORY = /^[a-z]+$/;

// GitHub's REST API rejects requests without a User-Agent (403). The Python
// `requests` lib set one automatically; Workers `fetch` does not, so we must.
const GH_HEADERS = (token) => ({
  Authorization: `token ${token}`,
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "yo-mama-comedy-bot",
});

// --- base64 helpers (UTF-8 safe; jokes may contain emoji / curly quotes) ------

function encodeBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function decodeBase64Utf8(b64) {
  // GitHub returns base64 with embedded newlines; atob rejects those.
  const binary = atob(b64.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// Constant-time string comparison (mirrors hmac.compare_digest).
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

// --- Telegram Bot API --------------------------------------------------------

async function tg(token, method, body) {
  return fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// --- GitHub actions ----------------------------------------------------------

async function commitToGithub(token, category, jokeString) {
  // The Astro site reads jokes/<category>.ts (export default [...]), NOT markdown.
  const filePath = `jokes/${category}.ts`;
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;

  // Escape for embedding inside a double-quoted TS string literal.
  const safeJoke = jokeString.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const res = await fetch(url, { headers: GH_HEADERS(token) });
  let sha = null;
  let updated;

  if (res.status === 200) {
    const fileData = await res.json();
    sha = fileData.sha;
    const current = decodeBase64Utf8(fileData.content);
    // Insert the new entry just before the array's final closing bracket.
    const idx = current.lastIndexOf("]");
    if (idx === -1) return false;
    updated = current.slice(0, idx) + `  "${safeJoke}",\n` + current.slice(idx);
  } else if (res.status === 404) {
    updated = `export default [\n  "${safeJoke}",\n];\n`;
  } else {
    return false;
  }

  const payload = {
    message: `🤖 comedy-bot: append curated ${category} joke`,
    content: encodeBase64Utf8(updated),
  };
  if (sha) payload.sha = sha;

  const pushRes = await fetch(url, {
    method: "PUT",
    headers: GH_HEADERS(token),
    body: JSON.stringify(payload),
  });
  return pushRes.status === 200 || pushRes.status === 201;
}

async function triggerGithubRerun(token) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/generate-jokes.yml/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: GH_HEADERS(token),
    body: JSON.stringify({ ref: "main" }),
  });
  if (res.status !== 204) {
    // 403/404 usually = PAT missing Actions:write (distinct from the Contents
    // write the Keep button uses).
    console.log(`workflow_dispatch failed: ${res.status} ${await res.text()}`);
  }
  return res.status === 204;
}

// --- callback_query handler (mirrors handle_menu_clicks) ---------------------

async function handleCallback(env, call) {
  const token = env.TELEGRAM_BOT_TOKEN || "";
  const ghToken = env.MINIMAL_GITHUB_PAT || "";
  const allowedChatId = env.TELEGRAM_CHAT_ID || "";

  const chatId = call.message.chat.id;

  // Allowlist: only the configured chat may curate (defense in depth).
  if (allowedChatId && String(chatId) !== allowedChatId) {
    await tg(token, "answerCallbackQuery", { callback_query_id: call.id, text: "Not authorized." });
    return;
  }

  await tg(token, "answerCallbackQuery", { callback_query_id: call.id, text: "Processing action..." });

  const messageText = call.message.text || "";

  // Header: "✨ Fresh Yo Mama Jokes (<category>) ✨" (Telegram strips the markup).
  const categoryMatch = messageText.match(/Fresh Yo Mama Jokes \((.*?)\)/);
  const category = categoryMatch ? categoryMatch[1].trim().toLowerCase() : "";

  if (call.data === "rerun_all") {
    if (await triggerGithubRerun(ghToken)) {
      await tg(token, "editMessageText", {
        chat_id: chatId,
        message_id: call.message.message_id,
        text: "🔄 *Regenerating batch...* New items will arrive in seconds!",
        parse_mode: "Markdown",
      });
    } else {
      await tg(token, "sendMessage", {
        chat_id: chatId,
        text: "❌ Rerun dispatch failed (see Worker logs). The MINIMAL_GITHUB_PAT likely lacks Actions: write.",
      });
    }
    return;
  }

  if (call.data.startsWith("keep_")) {
    if (!VALID_CATEGORY.test(category)) {
      await tg(token, "sendMessage", { chat_id: chatId, text: `❌ Unrecognized category: '${category}'` });
      return;
    }

    const jokeIdx = parseInt(call.data.split("_")[1], 10);
    // Joke lines are "**1.** text" or "1. text" depending on whether Telegram
    // stripped the markdown; tolerate both leading/inner asterisks.
    const jokesFound = [...messageText.matchAll(/^\*{0,2}\d+\.\*{0,2}\s*(.+)$/gm)].map((m) => m[1]);
    if (jokesFound.length === 0 || jokeIdx > jokesFound.length) {
      await tg(token, "sendMessage", { chat_id: chatId, text: "❌ Error parsing joke arrays." });
      return;
    }

    const selectedJoke = jokesFound[jokeIdx - 1].trim();
    if (await commitToGithub(ghToken, category, selectedJoke)) {
      await tg(token, "editMessageText", {
        chat_id: chatId,
        message_id: call.message.message_id,
        text: `${messageText}\n\n✅ Added joke #${jokeIdx} to jokes/${category}.ts!`,
        // Omitting reply_markup erases the buttons.
      });
    } else {
      await tg(token, "sendMessage", {
        chat_id: chatId,
        text: "❌ GitHub API write failure. Check MINIMAL_GITHUB_PAT scopes.",
      });
    }
  }
}

// --- Worker entrypoint -------------------------------------------------------

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only the webhook path is worker-first; anything else defers to assets.
    if (url.pathname !== "/api/webhook") {
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not found", { status: 404 });
    }

    // Liveness probe — confirms the Worker is deployed and routable.
    if (request.method === "GET") {
      return new Response("yo-mama webhook up", { status: 200 });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Verify the shared secret Telegram echoes back; reject anything forged.
    const secret = env.TELEGRAM_WEBHOOK_SECRET || "";
    const provided = request.headers.get("X-Telegram-Bot-Api-Secret-Token") || "";
    if (!secret || !timingSafeEqual(provided, secret)) {
      return new Response("Forbidden", { status: 403 });
    }

    if (!(request.headers.get("content-type") || "").includes("application/json")) {
      return new Response("Forbidden", { status: 403 });
    }

    let update;
    try {
      update = await request.json();
    } catch (_) {
      // Not well-formed JSON (e.g. a manual probe). Ack and drop it — a 5xx
      // would make Telegram retry indefinitely.
      return new Response("OK", { status: 200 });
    }

    // webhook.py only reacts to callback_query (button taps); ignore the rest.
    if (update && update.callback_query) {
      try {
        await handleCallback(env, update.callback_query);
      } catch (err) {
        console.log(`callback handling error: ${err && err.message}`);
      }
    }

    return new Response("OK", { status: 200 });
  },
};
