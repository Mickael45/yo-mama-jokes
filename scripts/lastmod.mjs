// Resolve an honest <lastmod> per URL from the committed lastmod.json manifest
// (regenerated from full git history by scripts/gen-lastmod.mjs). The production
// build env clones SHALLOW, so asking git at build time silently stamps HEAD's
// date on every page — the flat-lastmod anti-pattern this replaces. A path
// missing from the manifest resolves undefined and the sitemap omits lastmod
// rather than emitting an untrustworthy date.
import { readFileSync } from "node:fs";

let _manifest;
function manifest() {
  if (_manifest === undefined) {
    try {
      _manifest = JSON.parse(readFileSync(new URL("../lastmod.json", import.meta.url), "utf8"));
    } catch {
      _manifest = {};
    }
  }
  return _manifest;
}

// Pure core (unit-tested): path + manifest -> date | undefined.
export function resolveLastmod(path, m) {
  // Homepage content (daily featured picker) genuinely changes each daily deploy.
  if (path === "/") return new Date().toISOString();
  return m[path];
}

export function lastmodForUrl(url) {
  const p = new URL(url).pathname.replace(/\/$/, "") || "/";
  return resolveLastmod(p, manifest());
}
