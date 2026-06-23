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

test("generateBatch retries past a transient generation error", async () => {
  let call = 0;
  // First attempt throws (e.g. a transient ollama 500); second succeeds.
  const chat = async () => {
    call++;
    if (call === 1) throw new Error("ollama 500");
    return { message: { content: "Yo mama one.\nYo mama two." } };
  };
  const vectors = { "Yo mama one.": [1, 0, 0], "Yo mama two.": [0, 1, 0] };
  const embed = async (t) => vectors[t] || [0.5, 0.5, 0.5];
  const out = await generateBatch({
    chat, embed, model: "m", category: "fat", existingJokes: [], count: 2, threshold: 0.84,
  });
  assert.equal(out.length, 2, "a transient error on one attempt must not abort the session");
});

test("generateBatch streams each productive attempt's novel jokes via onNovel", async () => {
  let call = 0;
  const chat = async () => {
    call++;
    if (call === 1) return { message: { content: "Yo mama one." } };
    if (call === 2) return { message: { content: "" } }; // a dud attempt: no jokes
    return { message: { content: "Yo mama two.\nYo mama three." } };
  };
  const vectors = {
    "Yo mama one.": [1, 0, 0],
    "Yo mama two.": [0, 1, 0],
    "Yo mama three.": [0, 0, 1],
  };
  const embed = async (t) => vectors[t] || [0.5, 0.5, 0.5];

  const streamed = [];
  const out = await generateBatch({
    chat, embed, model: "m", category: "fat", existingJokes: [], count: 3, threshold: 0.84,
    onNovel: (jokes) => streamed.push(jokes),
  });
  assert.equal(out.length, 3);
  assert.equal(streamed.length, 2, "onNovel fires once per attempt that yields novel jokes, not for duds");
  assert.deepEqual(streamed[0], ["Yo mama one."]);
  assert.deepEqual(streamed[1], ["Yo mama two.", "Yo mama three."]);
});

test("generateBatch never streams or returns more than count", async () => {
  // One attempt yields 3 novel jokes but the budget is 2.
  const chat = async () => ({
    message: { content: "Yo mama joke A.\nYo mama joke B.\nYo mama joke C." },
  });
  let n = 0;
  const seen = {};
  const embed = async (t) => (seen[t] = seen[t] || [n++, 0, 0]); // distinct -> all novel
  const streamed = [];
  const out = await generateBatch({
    chat, embed, model: "m", category: "fat", existingJokes: [], count: 2, threshold: 0.84,
    onNovel: (jokes) => streamed.push(jokes),
  });
  assert.equal(out.length, 2);
  assert.equal(streamed.flat().length, 2, "must not stream past the count budget");
});

test("generateBatch stops at maxAttempts", async () => {
  const chat = async () => ({ message: { content: "" } }); // never produces jokes
  const embed = async () => [1, 0, 0];
  const out = await generateBatch({
    chat, embed, model: "m", category: "fat", existingJokes: [], count: 5, threshold: 0.84, maxAttempts: 3,
  });
  assert.equal(out.length, 0);
});
