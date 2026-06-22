# Yo-Mama Joke Factory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A nightly local pipeline that generates yo-mama jokes with Gemma 4, lets the user review/regenerate them from an Android phone over Telegram, and commits the approved jokes to the repo — then suspends the machine until the next night.

**Architecture:** Pure-logic modules (category pick, repo read/write, dedup, prompt/parse, git) are unit-tested with `node:test` and inject their Ollama/exec dependencies so they run without hardware. Thin adapters wire the real Ollama client, Telegram bot, and shell. A `bash` + `rtcwake` loop drives the daily wake → run session → suspend cycle on the i9.

**Tech Stack:** Node.js 22 (CommonJS), `node:test` + `node:assert` (built-in, no new test dep), `ollama` npm package (Gemma 4 chat + `jina` embeddings), `node-telegram-bot-api`, `git`, `rtcwake`, `systemd` (Omarchy/Arch Linux on the i9).

## Global Constraints

- **Runtime:** Node.js 22, CommonJS modules (`require`/`module.exports`). No `"type": "module"`. Matches existing `generate_jokes.js`.
- **All new code lives under `joke-factory/`** in the repo. Do not modify the Astro site, `services/`, or the deploy pipeline.
- **Categories (21, exact):** `awful, bald, clumsy, dirty, dumb, entitled, evil, fat, greedy, hairy, lazy, loud, nasty, old, other, poor, scary, short, skinny, tall, ugly`.
- **Joke files:** `jokes/<category>.ts`, each `export default [ "...", ... ];`. Lowercase category filename.
- **Dedup:** cosine similarity, threshold **0.84** (`>= 0.84` ⇒ duplicate). Embedding model `jina/jina-embeddings-v2-base-en`. Ollama host `http://127.0.0.1:11434`.
- **Joke string escaping (verbatim from existing code):** `.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/"/g, '\\"')`. Append by inserting `\n  "<escaped>",` before the file's last `]`.
- **Defaults:** batch size **5**, idle timeout **120 min**, wake time **20:00**, generation model env-configurable (default tag `gemma4:26b-a4b`, verified at setup).
- **Commit policy:** commit approved keepers **directly to the current branch and push** (mirrors existing `generate_jokes.js`). Commit message: `feat: add nightly verified yo mama jokes`.
- **Tests run with:** `node --test joke-factory/test/` (or a single file path). No network/hardware in unit tests — inject fakes.
- **Telegram bot only ever talks to the configured `TELEGRAM_CHAT_ID`.**

---

### Task 1: Scaffold + config + categories (date-seeded pick)

**Files:**
- Create: `joke-factory/lib/config.js`
- Create: `joke-factory/lib/categories.js`
- Create: `joke-factory/test/config.test.js`
- Create: `joke-factory/test/categories.test.js`

**Interfaces:**
- Produces:
  - `loadConfig(env = process.env) -> { botToken, chatId, jokesDir, wakeTime, idleTimeoutMin, batchSize, threshold, ollamaHost, model, embeddingModel, commitMessage }`. Throws `Error` if `TELEGRAM_BOT_TOKEN` or `TELEGRAM_CHAT_ID` missing.
  - `CATEGORIES` — frozen array of the 21 category strings.
  - `pickDailyCategory(date, categories = CATEGORIES) -> string` — deterministic for a given calendar date.

- [ ] **Step 1: Write the failing tests**

`joke-factory/test/categories.test.js`:
```js
const { test } = require("node:test");
const assert = require("node:assert");
const { CATEGORIES, pickDailyCategory } = require("../lib/categories");

test("CATEGORIES has the 21 expected categories", () => {
  assert.equal(CATEGORIES.length, 21);
  assert.ok(CATEGORIES.includes("fat"));
  assert.ok(CATEGORIES.includes("other"));
});

test("pickDailyCategory returns a member of CATEGORIES", () => {
  const c = pickDailyCategory(new Date("2026-06-22T00:00:00Z"));
  assert.ok(CATEGORIES.includes(c));
});

test("pickDailyCategory is deterministic for the same date", () => {
  const d = new Date("2026-06-22T00:00:00Z");
  assert.equal(pickDailyCategory(d), pickDailyCategory(d));
});

test("pickDailyCategory varies across dates", () => {
  const picks = new Set();
  for (let day = 1; day <= 15; day++) {
    picks.add(pickDailyCategory(new Date(`2026-06-${String(day).padStart(2, "0")}T00:00:00Z`)));
  }
  assert.ok(picks.size > 1, "expected more than one distinct category across 15 days");
});
```

`joke-factory/test/config.test.js`:
```js
const { test } = require("node:test");
const assert = require("node:assert");
const { loadConfig } = require("../lib/config");

test("loadConfig applies defaults", () => {
  const c = loadConfig({ TELEGRAM_BOT_TOKEN: "t", TELEGRAM_CHAT_ID: "1" });
  assert.equal(c.batchSize, 5);
  assert.equal(c.idleTimeoutMin, 120);
  assert.equal(c.threshold, 0.84);
  assert.equal(c.embeddingModel, "jina/jina-embeddings-v2-base-en");
  assert.equal(c.ollamaHost, "http://127.0.0.1:11434");
});

test("loadConfig overrides from env", () => {
  const c = loadConfig({ TELEGRAM_BOT_TOKEN: "t", TELEGRAM_CHAT_ID: "1", BATCH_SIZE: "8", OLLAMA_MODEL: "gemma4:12b" });
  assert.equal(c.batchSize, 8);
  assert.equal(c.model, "gemma4:12b");
});

test("loadConfig throws when bot token missing", () => {
  assert.throws(() => loadConfig({ TELEGRAM_CHAT_ID: "1" }), /TELEGRAM_BOT_TOKEN/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test joke-factory/test/categories.test.js joke-factory/test/config.test.js`
Expected: FAIL — `Cannot find module '../lib/categories'` / `'../lib/config'`.

- [ ] **Step 3: Implement the modules**

`joke-factory/lib/categories.js`:
```js
const CATEGORIES = Object.freeze([
  "awful", "bald", "clumsy", "dirty", "dumb", "entitled", "evil", "fat",
  "greedy", "hairy", "lazy", "loud", "nasty", "old", "other", "poor",
  "scary", "short", "skinny", "tall", "ugly",
]);

// mulberry32: tiny deterministic PRNG seeded by an integer.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickDailyCategory(date, categories = CATEGORIES) {
  const iso = date.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const seed = parseInt(iso.replace(/-/g, ""), 10); // e.g. 20260622
  const r = mulberry32(seed)();
  return categories[Math.floor(r * categories.length)];
}

module.exports = { CATEGORIES, pickDailyCategory };
```

`joke-factory/lib/config.js`:
```js
const path = require("path");

function loadConfig(env = process.env) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!botToken) throw new Error("Missing TELEGRAM_BOT_TOKEN");
  if (!chatId) throw new Error("Missing TELEGRAM_CHAT_ID");

  return {
    botToken,
    chatId: String(chatId),
    jokesDir: env.JOKES_DIR || path.join(__dirname, "..", "..", "jokes"),
    wakeTime: env.WAKE_TIME || "20:00",
    idleTimeoutMin: parseInt(env.IDLE_TIMEOUT_MINUTES || "120", 10),
    batchSize: parseInt(env.BATCH_SIZE || "5", 10),
    threshold: parseFloat(env.SIMILARITY_THRESHOLD || "0.84"),
    ollamaHost: env.OLLAMA_HOST || "http://127.0.0.1:11434",
    model: env.OLLAMA_MODEL || "gemma4:26b-a4b",
    embeddingModel: env.OLLAMA_EMBEDDING_MODEL || "jina/jina-embeddings-v2-base-en",
    commitMessage: env.COMMIT_MESSAGE || "feat: add nightly verified yo mama jokes",
  };
}

module.exports = { loadConfig };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test joke-factory/test/categories.test.js joke-factory/test/config.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add joke-factory/lib/config.js joke-factory/lib/categories.js joke-factory/test/config.test.js joke-factory/test/categories.test.js
git commit -m "feat(joke-factory): config + date-seeded category picker"
```

---

### Task 2: Jokes repo read/append

**Files:**
- Create: `joke-factory/lib/jokes-repo.js`
- Create: `joke-factory/test/jokes-repo.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `getExistingJokes(category, jokesDir) -> string[]` — parses `jokes/<category>.ts`; `[]` if missing/unparseable.
  - `appendJokes(category, jokes, jokesDir) -> number` — escapes and inserts each joke before the last `]`; returns count appended.

- [ ] **Step 1: Write the failing test**

`joke-factory/test/jokes-repo.test.js`:
```js
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { getExistingJokes, appendJokes } = require("../lib/jokes-repo");

function tmpJokesDir(initial) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "jokes-"));
  fs.writeFileSync(path.join(dir, "fat.ts"), initial, "utf-8");
  return dir;
}

test("getExistingJokes parses an export default array", () => {
  const dir = tmpJokesDir('export default [\n  "Yo mama A.",\n  "Yo mama B.",\n];\n');
  assert.deepEqual(getExistingJokes("fat", dir), ["Yo mama A.", "Yo mama B."]);
});

test("getExistingJokes returns [] for a missing category", () => {
  const dir = tmpJokesDir("export default [];\n");
  assert.deepEqual(getExistingJokes("nope", dir), []);
});

test("appendJokes adds jokes and escapes quotes", () => {
  const dir = tmpJokesDir('export default [\n  "Yo mama A.",\n];\n');
  const n = appendJokes("fat", ['Yo mama "quoted".', "Yo mama C."], dir);
  assert.equal(n, 2);
  const after = getExistingJokes("fat", dir);
  assert.equal(after.length, 3);
  assert.ok(after.includes('Yo mama "quoted".'));
  assert.ok(after.includes("Yo mama C."));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test joke-factory/test/jokes-repo.test.js`
Expected: FAIL — `Cannot find module '../lib/jokes-repo'`.

- [ ] **Step 3: Implement the module**

`joke-factory/lib/jokes-repo.js`:
```js
const fs = require("node:fs");
const path = require("node:path");

function filePath(category, jokesDir) {
  return path.join(jokesDir, `${category.toLowerCase()}.ts`);
}

function getExistingJokes(category, jokesDir) {
  try {
    const content = fs.readFileSync(filePath(category, jokesDir), "utf-8");
    const match = content.match(/export default\s*(\[[\s\S]*?\]);?/);
    if (match && match[1]) {
      return new Function(`return ${match[1]};`)().map(String);
    }
  } catch (_) {
    /* missing or unreadable → [] */
  }
  return [];
}

function escapeJoke(text) {
  return text.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/"/g, '\\"');
}

function appendJokes(category, jokes, jokesDir) {
  if (!jokes.length) return 0;
  const fp = filePath(category, jokesDir);
  let content = fs.readFileSync(fp, "utf-8");
  const insert = jokes.map((j) => `\n  "${escapeJoke(j)}",`).join("");
  const lastBracket = content.lastIndexOf("]");
  content = content.slice(0, lastBracket) + insert + content.slice(lastBracket);
  fs.writeFileSync(fp, content, "utf-8");
  return jokes.length;
}

module.exports = { getExistingJokes, appendJokes, escapeJoke };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test joke-factory/test/jokes-repo.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add joke-factory/lib/jokes-repo.js joke-factory/test/jokes-repo.test.js
git commit -m "feat(joke-factory): read and append jokes to category files"
```

---

### Task 3: Dedup (cosine + novelty filter)

**Files:**
- Create: `joke-factory/lib/dedup.js`
- Create: `joke-factory/test/dedup.test.js`

**Interfaces:**
- Consumes: an injected `embed(text) -> Promise<number[]>`.
- Produces:
  - `cosineSimilarity(vecA, vecB) -> number`.
  - `filterNovel({ candidates, existingJokes, embed, threshold }) -> Promise<{ novel: string[], rejected: Array<{joke, reason, score?, closest?}> }>`. Rejects candidates with max cosine `>= threshold` against existing jokes **and** already-accepted candidates in this batch.

- [ ] **Step 1: Write the failing test**

`joke-factory/test/dedup.test.js`:
```js
const { test } = require("node:test");
const assert = require("node:assert");
const { cosineSimilarity, filterNovel } = require("../lib/dedup");

test("cosineSimilarity of identical vectors is 1", () => {
  assert.ok(Math.abs(cosineSimilarity([1, 0, 1], [1, 0, 1]) - 1) < 1e-9);
});

// Fake embedder: each joke maps to a fixed vector by lookup.
const VECS = {
  "Yo mama existing.": [1, 0, 0],
  "Yo mama dup.": [0.99, 0.01, 0], // ~identical to existing → duplicate
  "Yo mama fresh.": [0, 1, 0],     // orthogonal → novel
  "Yo mama fresh2.": [0, 0, 1],    // orthogonal → novel
};
const fakeEmbed = async (t) => VECS[t] || [0, 0, 0];

test("filterNovel keeps novel jokes and rejects near-duplicates", async () => {
  const { novel, rejected } = await filterNovel({
    candidates: ["Yo mama dup.", "Yo mama fresh."],
    existingJokes: ["Yo mama existing."],
    embed: fakeEmbed,
    threshold: 0.84,
  });
  assert.deepEqual(novel, ["Yo mama fresh."]);
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].joke, "Yo mama dup.");
  assert.equal(rejected[0].reason, "duplicate");
});

test("filterNovel dedups within the same batch", async () => {
  const { novel } = await filterNovel({
    candidates: ["Yo mama fresh.", "Yo mama fresh."],
    existingJokes: [],
    embed: fakeEmbed,
    threshold: 0.84,
  });
  assert.equal(novel.length, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test joke-factory/test/dedup.test.js`
Expected: FAIL — `Cannot find module '../lib/dedup'`.

- [ ] **Step 3: Implement the module**

`joke-factory/lib/dedup.js`:
```js
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return Math.max(-1, Math.min(1, dot / (Math.sqrt(magA) * Math.sqrt(magB))));
}

async function filterNovel({ candidates, existingJokes, embed, threshold = 0.84 }) {
  const refVectors = [];
  for (const j of existingJokes) {
    try { refVectors.push(await embed(j)); } catch (_) { /* skip */ }
  }

  const novel = [];
  const rejected = [];
  for (const cand of candidates) {
    let vec = null;
    try { vec = await embed(cand); } catch (_) { vec = null; }
    if (!vec) { rejected.push({ joke: cand, reason: "embed-failed" }); continue; }

    let maxSim = 0, closest = null;
    for (const rv of refVectors) {
      const s = cosineSimilarity(vec, rv);
      if (s > maxSim) { maxSim = s; }
    }
    if (maxSim >= threshold) {
      rejected.push({ joke: cand, reason: "duplicate", score: maxSim, closest });
    } else {
      novel.push(cand);
      refVectors.push(vec); // guard against intra-batch dupes
    }
  }
  return { novel, rejected };
}

module.exports = { cosineSimilarity, filterNovel };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test joke-factory/test/dedup.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add joke-factory/lib/dedup.js joke-factory/test/dedup.test.js
git commit -m "feat(joke-factory): cosine novelty filter with intra-batch dedup"
```

---

### Task 4: Generator (prompt build + output parse)

**Files:**
- Create: `joke-factory/lib/generator.js`
- Create: `joke-factory/test/generator.test.js`

**Interfaces:**
- Consumes: an injected `chat(args) -> Promise<{ message: { content: string } }>` (matches `ollama` client's `.chat()`).
- Produces:
  - `buildPrompt(category, existingJokes, count, steer) -> { system, user }`.
  - `parseJokes(text) -> string[]` — one joke per line, strips numbering/bullets/wrapping quotes, keeps only lines beginning with "Yo".
  - `generateJokes({ chat, model, category, existingJokes, count, steer }) -> Promise<string[]>`.

- [ ] **Step 1: Write the failing test**

`joke-factory/test/generator.test.js`:
```js
const { test } = require("node:test");
const assert = require("node:assert");
const { buildPrompt, parseJokes, generateJokes } = require("../lib/generator");

test("buildPrompt includes category, count, existing samples and steer", () => {
  const { system, user } = buildPrompt("fat", ["Yo mama A."], 3, "about traffic");
  assert.match(system, /fat/);
  assert.match(user, /3/);
  assert.match(user, /Yo mama A\./);
  assert.match(user, /about traffic/);
});

test("parseJokes strips numbering, bullets and quotes, keeps Yo lines", () => {
  const text = [
    "1. Yo mama so fat she has her own zip code.",
    '- "Yo mama so old she knew Burger King when he was a prince."',
    "Here are your jokes:", // commentary, dropped
    "",                       // blank, dropped
  ].join("\n");
  assert.deepEqual(parseJokes(text), [
    "Yo mama so fat she has her own zip code.",
    "Yo mama so old she knew Burger King when he was a prince.",
  ]);
});

test("generateJokes parses the chat response content", async () => {
  const fakeChat = async () => ({ message: { content: "Yo mama joke one.\nYo mama joke two." } });
  const out = await generateJokes({ chat: fakeChat, model: "m", category: "fat", existingJokes: [], count: 2 });
  assert.deepEqual(out, ["Yo mama joke one.", "Yo mama joke two."]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test joke-factory/test/generator.test.js`
Expected: FAIL — `Cannot find module '../lib/generator'`.

- [ ] **Step 3: Implement the module**

`joke-factory/lib/generator.js`:
```js
function buildPrompt(category, existingJokes, count, steer = "") {
  const sample = existingJokes.slice(0, 40);
  const steerLine = steer ? `\n\nExtra instruction: ${steer}` : "";
  const system =
    `You are a comedy writer specializing in classic "yo mama" jokes. ` +
    `Write original, punchy one-line jokes in the "${category}" style. ` +
    `Every joke MUST start with "Yo mama" or "Yo momma". ` +
    `Output ONLY the jokes, one per line. No numbering, no bullets, no quotes, no commentary.`;
  const user =
    `Category: ${category}\n` +
    `Write ${count} brand-new jokes that are clearly DIFFERENT from every one of these existing jokes:\n\n` +
    sample.map((j) => `- ${j}`).join("\n") +
    steerLine;
  return { system, user };
}

function parseJokes(text) {
  return String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .map((l) => l.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, "")) // strip numbering/bullets
    .map((l) => l.replace(/^["'`]+|["'`]+$/g, "").trim())   // strip wrapping quotes
    .filter((l) => /^yo\s+mam{1,2}a\b/i.test(l));           // keep only joke lines
}

async function generateJokes({ chat, model, category, existingJokes, count = 5, steer = "" }) {
  const { system, user } = buildPrompt(category, existingJokes, count, steer);
  const res = await chat({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return parseJokes(res && res.message ? res.message.content : "");
}

module.exports = { buildPrompt, parseJokes, generateJokes };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test joke-factory/test/generator.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add joke-factory/lib/generator.js joke-factory/test/generator.test.js
git commit -m "feat(joke-factory): Gemma 4 prompt builder + output parser"
```

---

### Task 5: Session orchestrator (generate → dedup → top up)

**Files:**
- Create: `joke-factory/lib/session.js`
- Create: `joke-factory/test/session.test.js`

**Interfaces:**
- Consumes: `generateJokes` (Task 4), `filterNovel` (Task 3) via injected `chat` and `embed`.
- Produces:
  - `generateBatch({ chat, embed, model, category, existingJokes, count, threshold, steer, maxAttempts }) -> Promise<string[]>` — loops generate+dedup until it has `count` novel jokes or `maxAttempts` (default 5) is hit; returns up to `count`.

- [ ] **Step 1: Write the failing test**

`joke-factory/test/session.test.js`:
```js
const { test } = require("node:test");
const assert = require("node:assert");
const { generateBatch } = require("../lib/session");

test("generateBatch tops up across attempts until count is reached", async () => {
  let call = 0;
  // First call yields 1 usable joke, second yields 2 more.
  const chat = async () => {
    call++;
    if (call === 1) return { message: { content: "Yo mama one." } };
    return { message: { content: "Yo mama two.\nYo mama three." } };
  };
  // Distinct vectors per text so nothing is treated as a duplicate.
  const vectors = {
    "Yo mama one.": [1, 0, 0],
    "Yo mama two.": [0, 1, 0],
    "Yo mama three.": [0, 0, 1],
  };
  const embed = async (t) => vectors[t] || [0.5, 0.5, 0.5];

  const out = await generateBatch({
    chat, embed, model: "m", category: "fat", existingJokes: [], count: 3, threshold: 0.84,
  });
  assert.equal(out.length, 3);
  assert.ok(out.includes("Yo mama one."));
});

test("generateBatch stops at maxAttempts", async () => {
  const chat = async () => ({ message: { content: "" } }); // never produces jokes
  const embed = async () => [1, 0, 0];
  const out = await generateBatch({
    chat, embed, model: "m", category: "fat", existingJokes: [], count: 5, threshold: 0.84, maxAttempts: 3,
  });
  assert.equal(out.length, 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test joke-factory/test/session.test.js`
Expected: FAIL — `Cannot find module '../lib/session'`.

- [ ] **Step 3: Implement the module**

`joke-factory/lib/session.js`:
```js
const { generateJokes } = require("./generator");
const { filterNovel } = require("./dedup");

async function generateBatch({
  chat, embed, model, category, existingJokes,
  count = 5, threshold = 0.84, steer = "", maxAttempts = 5,
}) {
  const collected = [];
  for (let attempt = 0; attempt < maxAttempts && collected.length < count; attempt++) {
    const candidates = await generateJokes({ chat, model, category, existingJokes, count, steer });
    if (candidates.length === 0) continue;
    const { novel } = await filterNovel({
      candidates,
      existingJokes: [...existingJokes, ...collected],
      embed,
      threshold,
    });
    collected.push(...novel);
  }
  return collected.slice(0, count);
}

module.exports = { generateBatch };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test joke-factory/test/session.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add joke-factory/lib/session.js joke-factory/test/session.test.js
git commit -m "feat(joke-factory): batch orchestrator with top-up + attempt cap"
```

---

### Task 6: Git commit/push wrapper

**Files:**
- Create: `joke-factory/lib/git.js`
- Create: `joke-factory/test/git.test.js`

**Interfaces:**
- Consumes: an injected `exec(cmd) -> void` (defaults to `child_process.execSync` with `stdio: "pipe"`).
- Produces:
  - `commitAndPush({ message, exec }) -> { pushed: boolean, error?: string }` — runs `git add --all`, `git commit -m <message>`, `git push` in order; returns `{ pushed: false, error }` on failure (never throws).

- [ ] **Step 1: Write the failing test**

`joke-factory/test/git.test.js`:
```js
const { test } = require("node:test");
const assert = require("node:assert");
const { commitAndPush } = require("../lib/git");

test("commitAndPush runs add, commit, push in order", () => {
  const calls = [];
  const res = commitAndPush({ message: "feat: x", exec: (c) => calls.push(c) });
  assert.equal(res.pushed, true);
  assert.equal(calls.length, 3);
  assert.match(calls[0], /git add --all/);
  assert.match(calls[1], /git commit -m/);
  assert.match(calls[1], /feat: x/);
  assert.match(calls[2], /git push/);
});

test("commitAndPush reports failure without throwing", () => {
  const res = commitAndPush({
    message: "feat: x",
    exec: (c) => { if (/push/.test(c)) throw new Error("no remote"); },
  });
  assert.equal(res.pushed, false);
  assert.match(res.error, /no remote/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test joke-factory/test/git.test.js`
Expected: FAIL — `Cannot find module '../lib/git'`.

- [ ] **Step 3: Implement the module**

`joke-factory/lib/git.js`:
```js
const { execSync } = require("node:child_process");

const defaultExec = (cmd) => execSync(cmd, { stdio: "pipe" });

function commitAndPush({ message, exec = defaultExec }) {
  try {
    exec("git add --all");
    exec(`git commit -m ${JSON.stringify(message)}`);
    exec("git push");
    return { pushed: true };
  } catch (err) {
    return { pushed: false, error: err.message };
  }
}

module.exports = { commitAndPush };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test joke-factory/test/git.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add joke-factory/lib/git.js joke-factory/test/git.test.js
git commit -m "feat(joke-factory): safe git commit+push wrapper"
```

---

### Task 7: Ollama client adapter (manual verification)

**Files:**
- Create: `joke-factory/lib/ollama-client.js`
- Create: `joke-factory/scripts/smoke-ollama.js`

**Interfaces:**
- Consumes: `ollama` npm package, config from Task 1.
- Produces:
  - `createOllama({ host, model, embeddingModel }) -> { chat, embed, model }` where `chat(args)` proxies `client.chat(args)` and `embed(text) -> Promise<number[]>` returns the embedding vector for `embeddingModel`.

This task wraps real I/O, so it is verified by a smoke script against a running Ollama rather than unit tests.

- [ ] **Step 1: Implement the adapter**

`joke-factory/lib/ollama-client.js`:
```js
const { Ollama } = require("ollama");

function createOllama({ host, model, embeddingModel }) {
  const client = new Ollama({ host });
  return {
    model,
    chat: (args) => client.chat(args),
    embed: async (text) => {
      const res = await client.embeddings({ model: embeddingModel, prompt: text });
      return res.embedding;
    },
  };
}

module.exports = { createOllama };
```

- [ ] **Step 2: Write the smoke script**

`joke-factory/scripts/smoke-ollama.js`:
```js
const { loadConfig } = require("../lib/config");
const { createOllama } = require("../lib/ollama-client");
const { generateBatch } = require("../lib/session");
const { getExistingJokes } = require("../lib/jokes-repo");

(async () => {
  const cfg = loadConfig();
  const ollama = createOllama(cfg);
  const existing = getExistingJokes("fat", cfg.jokesDir);
  console.log(`Existing 'fat' jokes: ${existing.length}`);
  const batch = await generateBatch({
    chat: ollama.chat, embed: ollama.embed, model: cfg.model,
    category: "fat", existingJokes: existing, count: 3, threshold: cfg.threshold,
  });
  console.log("Generated novel jokes:");
  batch.forEach((j, i) => console.log(`  ${i + 1}. ${j}`));
})().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Verify on the i9 (requires Ollama running + models pulled)**

Run (on the i9, with `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` set to any non-empty value for this check):
```bash
ollama list   # confirm the Gemma 4 + jina tags exist; set OLLAMA_MODEL if the tag differs
TELEGRAM_BOT_TOKEN=x TELEGRAM_CHAT_ID=x node joke-factory/scripts/smoke-ollama.js
```
Expected: prints 1–3 novel "Yo mama …" jokes for the `fat` category, none duplicating existing ones. If the model tag is wrong, `ollama list` shows the right one — set `OLLAMA_MODEL` accordingly.

- [ ] **Step 4: Commit**

```bash
git add joke-factory/lib/ollama-client.js joke-factory/scripts/smoke-ollama.js
git commit -m "feat(joke-factory): Ollama chat+embed adapter and smoke script"
```

---

### Task 8: Telegram review bot

**Files:**
- Create: `joke-factory/bot.js`
- Modify: `package.json` (add `node-telegram-bot-api` to `devDependencies`)

**Interfaces:**
- Consumes: `generateBatch` (Task 5), config (Task 1), Ollama adapter (Task 7).
- Produces:
  - `runTelegramSession({ botToken, chatId, category, existingJokes, chat, embed, model, batchSize, threshold, idleTimeoutMin, BotApi }) -> Promise<string[]>` — sends a batch with inline buttons, handles `regen`/`steer`/`keep:<i>`/`done`, resolves with the approved keeper strings (empty array on timeout). `BotApi` is injectable (defaults to `node-telegram-bot-api`) so the message flow can be exercised with a fake in a later test if desired.

This task is integration-heavy (live Telegram); it is verified manually from the phone. Provide the full implementation.

- [ ] **Step 1: Add the dependency**

Edit `package.json` `devDependencies` to add (keep alphabetical with existing entries):
```json
    "node-telegram-bot-api": "^0.66.0",
```
Then run: `npm install`
Expected: `node-telegram-bot-api` appears in `node_modules`.

- [ ] **Step 2: Implement the bot session**

`joke-factory/bot.js`:
```js
const DefaultBotApi = require("node-telegram-bot-api");
const { generateBatch } = require("./lib/session");

function keyboardFor(jokes, kept) {
  const rows = jokes.map((j, i) => [{
    text: `${kept.has(i) ? "✅" : "👍"} ${i + 1}`,
    callback_data: `keep:${i}`,
  }]);
  rows.push([
    { text: "🔁 5 more", callback_data: "regen" },
    { text: "🎯 steer", callback_data: "steer" },
  ]);
  rows.push([{ text: "✅ Done", callback_data: "done" }]);
  return { reply_markup: { inline_keyboard: rows } };
}

function renderBatch(category, jokes) {
  const lines = jokes.map((j, i) => `${i + 1}. ${j}`).join("\n");
  return `🎲 Category: *${category}*\n\n${lines || "(no novel jokes this round)"}\n\nTap 👍 to keep, 🔁 for more, 🎯 to steer, ✅ when done.`;
}

function runTelegramSession({
  botToken, chatId, category, existingJokes,
  chat, embed, model, batchSize = 5, threshold = 0.84,
  idleTimeoutMin = 120, BotApi = DefaultBotApi,
}) {
  return new Promise((resolve) => {
    const bot = new BotApi(botToken, { polling: true });
    let jokes = [];
    const kept = new Set();
    let awaitingSteer = false;
    let messageId = null;
    let timer = null;

    const finish = async (result) => {
      clearTimeout(timer);
      try { await bot.stopPolling(); } catch (_) {}
      resolve(result);
    };

    const armTimeout = () => {
      clearTimeout(timer);
      timer = setTimeout(() => finish([]), idleTimeoutMin * 60 * 1000);
    };

    const sendBatch = async (steer = "") => {
      jokes = await generateBatch({
        chat, embed, model, category, existingJokes, count: batchSize, threshold, steer,
      });
      kept.clear();
      const opts = keyboardFor(jokes, kept);
      const msg = await bot.sendMessage(chatId, renderBatch(category, jokes), { parse_mode: "Markdown", ...opts });
      messageId = msg.message_id;
      armTimeout();
    };

    bot.on("callback_query", async (q) => {
      if (String(q.message.chat.id) !== String(chatId)) return;
      armTimeout();
      const data = q.data;
      try {
        if (data === "regen") {
          await bot.answerCallbackQuery(q.id, { text: "Regenerating…" });
          await sendBatch();
        } else if (data === "steer") {
          awaitingSteer = true;
          await bot.answerCallbackQuery(q.id, { text: "Send your steer text" });
          await bot.sendMessage(chatId, "✍️ Reply with how to steer the next batch (e.g. 'make them about traffic').");
        } else if (data.startsWith("keep:")) {
          const i = parseInt(data.split(":")[1], 10);
          if (kept.has(i)) kept.delete(i); else kept.add(i);
          await bot.answerCallbackQuery(q.id, { text: kept.has(i) ? "Kept" : "Removed" });
          await bot.editMessageReplyMarkup(keyboardFor(jokes, kept).reply_markup, {
            chat_id: chatId, message_id: messageId,
          });
        } else if (data === "done") {
          await bot.answerCallbackQuery(q.id, { text: "Saving keepers" });
          const approved = [...kept].sort((a, b) => a - b).map((i) => jokes[i]);
          await bot.sendMessage(chatId, approved.length
            ? `✅ Saving ${approved.length} joke(s) and pushing.`
            : "Nothing kept — nothing committed.");
          await finish(approved);
        }
      } catch (err) {
        await bot.sendMessage(chatId, `⚠️ ${err.message}`);
      }
    });

    bot.on("message", async (m) => {
      if (String(m.chat.id) !== String(chatId)) return;
      if (awaitingSteer && m.text && !m.text.startsWith("/")) {
        awaitingSteer = false;
        armTimeout();
        await bot.sendMessage(chatId, `🎯 Steering: "${m.text}"`);
        await sendBatch(m.text);
      }
    });

    sendBatch().catch((err) => {
      bot.sendMessage(chatId, `⚠️ Generation failed: ${err.message}`).finally(() => finish([]));
    });
  });
}

module.exports = { runTelegramSession, keyboardFor, renderBatch };
```

- [ ] **Step 3: Verify from your phone (i9, real bot token + chat ID)**

Create a temporary runner and exercise the live flow:
```bash
TELEGRAM_BOT_TOKEN=<real> TELEGRAM_CHAT_ID=<real> node -e '
  const { loadConfig } = require("./joke-factory/lib/config");
  const { createOllama } = require("./joke-factory/lib/ollama-client");
  const { runTelegramSession } = require("./joke-factory/bot");
  const { getExistingJokes } = require("./joke-factory/lib/jokes-repo");
  const cfg = loadConfig();
  const o = createOllama(cfg);
  runTelegramSession({
    botToken: cfg.botToken, chatId: cfg.chatId, category: "fat",
    existingJokes: getExistingJokes("fat", cfg.jokesDir),
    chat: o.chat, embed: o.embed, model: cfg.model,
    batchSize: cfg.batchSize, threshold: cfg.threshold, idleTimeoutMin: 5,
  }).then((approved) => { console.log("APPROVED:", approved); process.exit(0); });
'
```
Expected: a batch with buttons arrives in Telegram on your Android phone. Verify: `🔁 5 more` produces a new batch, `🎯 steer` then a text reply steers the next batch, `👍 n` toggles keepers (button shows ✅), `✅ Done` prints the approved list and exits. (Use `idleTimeoutMin: 5` only for this test.)

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json joke-factory/bot.js
git commit -m "feat(joke-factory): Telegram review/regenerate/keeper bot"
```

---

### Task 9: Session entrypoint (run.js)

**Files:**
- Create: `joke-factory/run.js`

**Interfaces:**
- Consumes: every lib module + bot.
- Produces: a runnable `node joke-factory/run.js` that performs exactly one nightly session: pick category → load existing → Telegram review → append + commit/push approved jokes. Exits 0 when done.

This is the top-level glue; verified by a dry run on the i9.

- [ ] **Step 1: Implement the entrypoint**

`joke-factory/run.js`:
```js
const { loadConfig } = require("./lib/config");
const { CATEGORIES, pickDailyCategory } = require("./lib/categories");
const { getExistingJokes, appendJokes } = require("./lib/jokes-repo");
const { createOllama } = require("./lib/ollama-client");
const { runTelegramSession } = require("./bot");
const { commitAndPush } = require("./lib/git");

async function main() {
  const cfg = loadConfig();
  const category = pickDailyCategory(new Date(), CATEGORIES);
  const existing = getExistingJokes(category, cfg.jokesDir);
  const ollama = createOllama(cfg);

  console.log(`[factory] category=${category} existing=${existing.length}`);

  const approved = await runTelegramSession({
    botToken: cfg.botToken, chatId: cfg.chatId, category, existingJokes: existing,
    chat: ollama.chat, embed: ollama.embed, model: cfg.model,
    batchSize: cfg.batchSize, threshold: cfg.threshold, idleTimeoutMin: cfg.idleTimeoutMin,
  });

  if (!approved.length) {
    console.log("[factory] nothing approved; exiting without commit.");
    return;
  }

  const added = appendJokes(category, approved, cfg.jokesDir);
  console.log(`[factory] appended ${added} joke(s) to ${category}.ts`);
  const res = commitAndPush({ message: cfg.commitMessage });
  console.log(res.pushed ? "[factory] pushed." : `[factory] push failed: ${res.error}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Verify a full dry run on the i9**

```bash
cd <repo-on-i9>
git checkout -b factory-test
TELEGRAM_BOT_TOKEN=<real> TELEGRAM_CHAT_ID=<real> IDLE_TIMEOUT_MINUTES=5 node joke-factory/run.js
```
Expected: a batch arrives on your phone; keep ≥1 joke and tap `✅ Done`; the script appends to the category file, commits, and pushes to `factory-test`. Confirm with `git log -1` and `git show --stat HEAD`. Then clean up: `git checkout main && git branch -D factory-test && git push origin --delete factory-test` (if it was pushed).

- [ ] **Step 3: Commit**

```bash
git add joke-factory/run.js
git commit -m "feat(joke-factory): one-shot nightly session entrypoint"
```

---

### Task 10: Wake/sleep loop, systemd service, and setup docs

**Files:**
- Create: `joke-factory/loop.sh`
- Create: `joke-factory/joke-factory.service`
- Create: `joke-factory/README.md`

**Interfaces:**
- Consumes: `joke-factory/run.js`.
- Produces: a self-perpetuating wake→run→suspend loop and its `systemd` unit, plus the one-time setup runbook.

Hardware/OS integration; verified on the i9.

- [ ] **Step 1: Write the loop script**

`joke-factory/loop.sh`:
```bash
#!/usr/bin/env bash
# Self-perpetuating nightly loop: run one session, then suspend until the next
# wake time. Started once; rtcwake re-arms the RTC alarm on every cycle.
set -uo pipefail

REPO_DIR="${REPO_DIR:?set REPO_DIR to the repo path on the i9}"
WAKE_TIME="${WAKE_TIME:-20:00}"          # HH:MM, local time
ENV_FILE="${ENV_FILE:-$REPO_DIR/.joke-factory.env}"

cd "$REPO_DIR"

while true; do
  # Load secrets/config (git-ignored).
  set -a; [ -f "$ENV_FILE" ] && . "$ENV_FILE"; set +a

  # Run one nightly session (generation + Telegram review + commit/push).
  node joke-factory/run.js || echo "[loop] run.js exited non-zero"

  # Compute the next wake epoch (today if still ahead, else tomorrow).
  next_epoch=$(date -d "today $WAKE_TIME" +%s)
  now_epoch=$(date +%s)
  if [ "$next_epoch" -le "$now_epoch" ]; then
    next_epoch=$(date -d "tomorrow $WAKE_TIME" +%s)
  fi
  echo "[loop] next wake: $(date -d "@$next_epoch")"

  # Suspend to RAM; returns when the RTC alarm fires at the next wake time.
  sudo rtcwake -m mem -t "$next_epoch" || { echo "[loop] rtcwake failed; sleeping 1h"; sleep 3600; }
done
```
Make it executable: `chmod +x joke-factory/loop.sh`

- [ ] **Step 2: Write the systemd user service**

`joke-factory/joke-factory.service`:
```ini
[Unit]
Description=Yo-Mama Joke Factory nightly loop
After=network-online.target ollama.service
Wants=network-online.target

[Service]
Type=simple
Environment=REPO_DIR=%h/yo-mama-jokes
Environment=WAKE_TIME=20:00
ExecStart=/usr/bin/env bash %h/yo-mama-jokes/joke-factory/loop.sh
Restart=always
RestartSec=30

[Install]
WantedBy=default.target
```

- [ ] **Step 3: Write the setup runbook**

`joke-factory/README.md` (full content):
````markdown
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
```bash
echo "$USER ALL=(root) NOPASSWD: /usr/sbin/rtcwake" | sudo tee /etc/sudoers.d/joke-factory
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
node --test joke-factory/test/
```
````

- [ ] **Step 4: Add the env file to .gitignore**

Append to `.gitignore` (create if absent):
```
.joke-factory.env
```

- [ ] **Step 5: Verify on the i9**

```bash
chmod +x joke-factory/loop.sh
# Short-wake test (confirms suspend/resume works on this hardware):
sudo rtcwake -m mem -t "$(date -d '+2 minutes' +%s)"
# Then enable the service and watch logs at the next 20:00 (or temporarily set WAKE_TIME close):
systemctl --user status joke-factory.service
journalctl --user -u joke-factory.service -f
```
Expected: machine suspends and resumes on the RTC alarm; at wake, a batch arrives on your phone; approved jokes are pushed; the machine re-arms and suspends.

- [ ] **Step 6: Commit**

```bash
git add joke-factory/loop.sh joke-factory/joke-factory.service joke-factory/README.md .gitignore
git commit -m "feat(joke-factory): rtcwake loop, systemd service, setup runbook"
```

---

## Self-Review

**Spec coverage:**
- Nightly 20:00 wake → Task 10 (`loop.sh` + `rtcwake` + service). ✅
- Local Gemma 4 generation → Tasks 4, 7. ✅
- Context + embedding dedup (0.84) → Tasks 3, 5 (context via prompt in Task 4). ✅
- Random category per night, date-seeded → Task 1. ✅
- Telegram review + regenerate + steer + per-joke keepers → Task 8. ✅
- 2-hour idle timeout → Task 8 (`idleTimeoutMin`, default 120 via Task 1). ✅
- Approve → append + commit + push → Tasks 2, 6, 9. ✅
- Suspend after session → Task 10. ✅
- Fully local, no Pi/email/cloud → no cloud calls anywhere; ✅
- Config/secrets git-ignored → Task 1 + Task 10 step 4. ✅
- Setup prerequisites (Ollama pull, bot, sudo rtcwake, systemd, logind) → Task 10 README. ✅
- Known limitation (only acts during the wake window) → inherent to Task 10 design. ✅

**Placeholder scan:** No TBD/TODO/"handle errors appropriately"; every code step is complete. The only configurable unknown (exact Gemma 4 Ollama tag) is a real default plus a setup step to confirm it. ✅

**Type consistency:** `chat`/`embed` signatures consistent across Tasks 3–9; `generateBatch`, `filterNovel`, `generateJokes`, `getExistingJokes`, `appendJokes`, `commitAndPush`, `runTelegramSession` names/params match between definition and call sites. ✅
