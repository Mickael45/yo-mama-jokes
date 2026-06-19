// Resolve an honest <lastmod> per URL from git history, so we never stamp a
// single flat build date across every page (Google distrusts uniform lastmods).
// - /jokes/<slug>           -> git mtime of jokes/<short>.ts (when jokes changed)
// - /, /categories, /about… -> git mtime of the page's .astro source
// - homepage "/"            -> today (the daily featured set genuinely rotates)
import { execSync } from "node:child_process";

function gitDate(file) {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${file}"`, {
      encoding: "utf8",
    }).trim();
    return out || undefined;
  } catch {
    return undefined;
  }
}

function pathOf(url) {
  return new URL(url).pathname.replace(/\/$/, "") || "/";
}

export function lastmodForUrl(url) {
  const p = pathOf(url);
  // Homepage content (daily picker) genuinely changes each rebuild.
  if (p === "/") return new Date().toISOString();

  const m = p.match(/^\/jokes\/(.+)$/);
  if (m) {
    const short = m[1].replace(/-yo-mama-jokes$/, "");
    return gitDate(`jokes/${short}.ts`);
  }

  // Static pages: map /foo -> src/pages/foo.astro
  const astro = `src/pages${p}.astro`;
  return gitDate(astro);
}
