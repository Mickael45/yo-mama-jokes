import test from "node:test";
import assert from "node:assert/strict";

import { resolveLastmod } from "./lastmod.mjs";
import { jokeUrl, pageUrl } from "./gen-lastmod.mjs";

test("homepage always stamps now — the featured set rotates each daily deploy", () => {
  const out = resolveLastmod("/", {});
  assert.ok(out && !Number.isNaN(Date.parse(out)));
});

test("known path resolves from the manifest, never from the build env", () => {
  const m = { "/jokes/bald-yo-mama-jokes": "2026-07-31T11:31:54+02:00" };
  assert.equal(resolveLastmod("/jokes/bald-yo-mama-jokes", m), "2026-07-31T11:31:54+02:00");
});

test("path missing from manifest resolves undefined so the sitemap omits lastmod", () => {
  assert.equal(resolveLastmod("/about", {}), undefined);
});

test("jokeUrl maps a jokes/ source file to its page path", () => {
  assert.equal(jokeUrl("bald.ts"), "/jokes/bald-yo-mama-jokes");
  assert.equal(jokeUrl("dirty.ts"), "/jokes/dirty-yo-mama-jokes");
});

test("pageUrl maps a src/pages astro file to its path, skipping non-pages", () => {
  assert.equal(pageUrl("about.astro"), "/about");
  assert.equal(pageUrl("privacy-policy.astro"), "/privacy-policy");
  assert.equal(pageUrl("index.astro"), undefined); // homepage handled separately
  assert.equal(pageUrl("404.astro"), undefined); // never in the sitemap
  assert.equal(pageUrl("[slug].astro"), undefined); // dynamic routes resolved elsewhere
});
