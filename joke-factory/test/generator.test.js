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

test("parseJokes keeps 'Yo momma' and smart-quoted lines", () => {
  const text = [
    "Yo momma so fat she has her own moon.",
    "“Yo mamma so old her birth certificate is in Roman numerals.”",
  ].join("\n");
  const out = parseJokes(text);
  assert.ok(out.includes("Yo momma so fat she has her own moon."));
  assert.ok(out.some((j) => /^Yo mamma so old/.test(j)));
});

test("generateJokes parses the chat response content", async () => {
  const fakeChat = async () => ({ message: { content: "Yo mama joke one.\nYo mama joke two." } });
  const out = await generateJokes({ chat: fakeChat, model: "m", category: "fat", existingJokes: [], count: 2 });
  assert.deepEqual(out, ["Yo mama joke one.", "Yo mama joke two."]);
});
