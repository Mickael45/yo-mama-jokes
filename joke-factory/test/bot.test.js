const { test } = require("node:test");
const assert = require("node:assert");
const { keyboardFor, renderBatch } = require("../bot");

const JOKES = ["Yo mama joke one.", "Yo mama joke two.", "Yo mama joke three."];

test("keyboardFor produces one row per joke plus regen/steer and Done rows", () => {
  const rows = keyboardFor(JOKES, new Set()).reply_markup.inline_keyboard;
  // 3 joke rows + 1 regen/steer row + 1 Done row = 5 rows
  assert.equal(rows.length, JOKES.length + 2);

  // Per-joke rows: single button each, callback keep:<i>, default 👍 marker.
  JOKES.forEach((_, i) => {
    assert.equal(rows[i].length, 1);
    assert.equal(rows[i][0].callback_data, `keep:${i}`);
    assert.equal(rows[i][0].text, `👍 ${i + 1}`);
  });

  // Regen/steer row.
  const regenRow = rows[JOKES.length];
  assert.equal(regenRow.length, 2);
  assert.equal(regenRow[0].callback_data, "regen");
  assert.equal(regenRow[0].text, "🔁 5 more");
  assert.equal(regenRow[1].callback_data, "steer");
  assert.equal(regenRow[1].text, "🎯 steer");

  // Done row.
  const doneRow = rows[JOKES.length + 1];
  assert.equal(doneRow.length, 1);
  assert.equal(doneRow[0].callback_data, "done");
  assert.equal(doneRow[0].text, "✅ Done");
});

test("keyboardFor marks kept indices with ✅ and leaves others as 👍", () => {
  const kept = new Set([1]);
  const rows = keyboardFor(JOKES, kept).reply_markup.inline_keyboard;
  assert.equal(rows[0][0].text, "👍 1");
  assert.equal(rows[1][0].text, "✅ 2");
  assert.equal(rows[2][0].text, "👍 3");
});

test("keyboardFor with no jokes still has regen/steer and Done rows", () => {
  const rows = keyboardFor([], new Set()).reply_markup.inline_keyboard;
  assert.equal(rows.length, 2);
  assert.equal(rows[0][0].callback_data, "regen");
  assert.equal(rows[1][0].callback_data, "done");
});

test("renderBatch includes the category and numbered jokes", () => {
  const text = renderBatch("fat", JOKES);
  assert.ok(text.includes("Category: FAT"), "should show the category as plain text");
  JOKES.forEach((j, i) => {
    assert.ok(text.includes(`${i + 1}. ${j}`), `should number joke ${i + 1}`);
  });
  // Instruction footer present.
  assert.ok(text.includes("👍 to keep"));
  assert.ok(text.includes("✅ when done"));
});

test("renderBatch shows a placeholder when there are no jokes", () => {
  const text = renderBatch("fat", []);
  assert.ok(text.includes("Category: FAT"));
  assert.ok(text.includes("(no novel jokes this round)"));
});
