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
