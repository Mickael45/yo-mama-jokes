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
