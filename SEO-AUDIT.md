# SEO-AUDIT — Yo Mama Jokes Central

Derived SEO guide + resume point for the next audit. Per-run findings live in the
dated run reports under `audits/seo/`, **not** here. This doc carries the durable
layer and the standing items re-checked every audit.

- **Site:** https://yomamajokescentral.com — `yo-mama-jokes`
- **Stack:** Astro 6 static SSG → Cloudflare Workers (static assets + thin Telegram-webhook Worker at `/api/webhook`)
- **Canonical host:** **apex** (`yomamajokescentral.com`). `www` 301→apex via a Cloudflare dashboard Redirect Rule. Set in `lib/siteConfig.ts` (`SITE_URL`) and `astro.config.mjs` (`site`).
- **Renderer:** fully server-rendered HTML (all joke + editorial content in raw HTML — no JS gating).
- **Locales:** single-language `en-US`.
- **Monetization:** **ad-free** — AdSense + GA4 + cookie banner removed (`edbb8f8`). Ad-network + consent scopes N/A until/unless re-added.
- **Build doctrine reference:** `SEO_COOKBOOK.md` (how the site is built; not a run log).

## Latest run

- **2026-07-18** → `audits/seo/2026-07-18-report.md` (sidecar `audits/seo/latest.json`).
  0 open findings; 3 fixed (fake "daily" freshness copy, short `/about` title,
  prod Bing placeholder token) + 1 doc-comment fix. Validator: pass.

## Standing items (re-check every audit + zone onboarding)

### AI-crawler access — verified 2026-07-18
`robots.txt` explicitly `Allow`s GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot,
ClaudeBot, Google-Extended. Prod robots byte-identical to repo; crawler-UA curl shows
**no** CDN-injected managed/Content-Signals block. Retrieval + agent crawlers stay
allowed. Re-verify against current Cloudflare AI Crawl Control defaults each run.

### Cloudflare zone checklist
- apex + www both bound as custom domains (`wrangler.jsonc`); both resolve A + AAAA externally (verified 2026-07-18 via @1.1.1.1 and @8.8.8.8).
- `www → apex` Redirect Rule: **dashboard-only** — confirm it exists on each zone review (verified live 2026-07-18: `https://www` → 301 apex).
- `html_handling: drop-trailing-slash`, `not_found_handling: 404-page` (real 404s) — set in `wrangler.jsonc`.
- Security headers (`public/_headers`): HSTS preload, nosniff, referrer-policy — live 2026-07-18.
- **Telegram webhook** is registered to the **apex** URL (must precede any www-scoped rule; Telegram won't follow 301s).

### Ad-config / publisher-ID correctness
**N/A — ad-free.** If ads are ever re-added: verify real AdSense publisher ID (no placeholder), valid `ads.txt`, ≥1 rendered unit, certified CMP + region-scoped Consent Mode v2, and manage-cookies footer link. Re-open the `ads`/`consent` scopes.

### Freshness honesty
Featured jokes are **build-time date-seeded** (`services/dailyJokesPicker.ts`). There is
**no scheduled rebuild** — the daily-rebuild workflow was dropped (`a1727ea`); rebuilds
fire only on comedy-bot commits (human-approved via Telegram, irregular). Copy therefore
must **not** promise a "daily" cadence. Fixed 2026-07-18 to "rotating / regularly refreshed".
If a true daily cadence is wanted, add a scheduled Cloudflare Deploy Hook (needs
`CLOUDFLARE_DEPLOY_HOOK_URL` secret) — then honest "daily" copy may return.

### Fast-movers to re-verify next run
- AI-crawler UA list + Cloudflare AI Crawl Control defaults (`references/geo-ai.md`).
- Google/Bing structured-data support status (validate JSON-LD with validator.schema.org, not the deprecated Rich Results Test).

### Active suppressions
None.

## Open handover (human/time-only)
- Field CWV (~28d CrUX/GSC post-change).
- AI-citation movement (monthly fixed-prompt GEO audit).
- Bing verification token (`layouts/Layout.astro`) — add real `msvalidate.01` after verifying.
- `SAME_AS` social profiles empty in `lib/siteConfig.ts` — populate as accounts are created.
