# SEO / GEO Cookbook — Yo Mama Jokes Central

> # ⛔ SUPERSEDED — see [`../MASTER_SEO_COOKBOOK.md`](../MASTER_SEO_COOKBOOK.md)
> **Kept for history. Do not action the flagged claims below.** A cross-reference sweep across all
> five sibling cookbooks on **2026-06-19** re-verified every claim against primary sources. The
> following claims in THIS file were found **wrong or stale** and are left in place for the record:
> - **[X1] "INP is the metric most sites actually fail" (§5, §10 deprecation) — ❌ FALSE.** Per CrUX, **LCP** is the most-failed Core Web Vital; INP passes ~77% on mobile. Watch INP after ads, but it is not the top failure.
> - **[X4] "~76% of AI citations come from top-10" (§4 note, §8) — ⏳ STALE.** Down to **~38%** in 2026 (Ahrefs, 863K kw; partly improved citation parsing). Strong ranking still helps but is no longer the dominant gateway.
> - **[X2] "`Organization.logo` is a real raster ≥112×112 (PNG/JPG)" (§3) — ⚠️ OVERSTATED.** Google requires only **≥112×112 + a Google-Images-supported format**, and **SVG is supported**; raster/square are not requirements.
> - **[X3] Princeton GEO figures (§8) are imprecise** (metric mix-up). Exact per-method numbers are in the master §6/§7.
>
> Everything else in this file was re-confirmed as correct.

> The complete checklist of everything this site should have to be **maximally
> visible** in Google + AI search engines and **monetizable** with AdSense.
> Verified against live 2026 sources (links at the bottom). This is the
> single source of truth — update the status columns as you ship.

**Last verified:** 2026-06-19 · **Site:** https://www.yomamajokescentral.com · **Stack:** Astro 6 (static) on Vercel

> **Revision note (2026-06-19 sweep):** this edition cross-references the four sibling
> cookbooks in `../wordify-number`, `../decimal-to-hexadecimal-converter`, `../My-Pokedex`
> and `../LinkedIn-JobLens-AI`, and re-verifies every contested claim against authoritative
> 2026 sources (web.dev, Google Search Central, IAB Europe, Coalition for Better Ads, the
> Princeton GEO paper). **One correction was made:** the earlier "LCP tightened to ~2.0s in
> 2026" line was a myth — web.dev still defines the *good* LCP threshold as **2.5s**. The old
> text is kept (struck through) in §5/§10 for history. New material harvested from the siblings
> is tagged **🆕 (added 2026-06-19)**.

---

## How to read this

| Symbol | Meaning |
|--------|---------|
| ✅ | **Done** — already implemented correctly in this repo |
| ⚠️ | **Partial / at risk** — present but incomplete, fragile, or only half-correct |
| ❌ | **Missing** — not implemented; worth adding |
| ➖ | **Optional / N-A** — nice-to-have or doesn't apply to this site type |
| 🚫 | **Deprecated** — do NOT implement; Google retired it (kept here so nobody "adds it back") |

Priority tags: 🔴 critical (blocks approval/ranking) · 🟠 high · 🟡 medium · 🟢 low.

---

## 0. Executive summary — what the deep sweep found

The site is in the **top ~10%** for technical SEO/GEO hygiene. The work that
remains is **not** plumbing — it's three things that decide whether you get
**approved, ranked, and paid**:

1. 🔴 **Certified CMP (IAB TCF v2.3).** Your hand-rolled `ConsentBanner.astro`
   drives Consent Mode v2 signals but is **not a Google-certified CMP**. Since
   Jan 16 2024 (EEA/UK) and Jul 31 2024 (CH), AdSense **requires a certified CMP
   integrated with the IAB TCF** to serve *personalized* ads in those regions.
   Without it you're limited to non-personalized/limited ads at best — a direct
   revenue + compliance hit. **This was the biggest miss.**
2. 🔴 **Thin + duplicated content.** Category pages are a lede + a list of
   widely-copied one-liners + 2 auto FAQ. This is the #1 AdSense rejection
   reason in 2026 ("low-value content" / "scaled content abuse") and caps
   ranking. Needs original editorial depth.
3. 🔴 **"Daily" freshness is not actually running.** `dailyJokesPicker.ts` is
   seeded by date but executes at **build time** on a static site, and there is
   **no cron/Action** anywhere. The featured set never changes in production
   until you redeploy, and `lastmod` is frozen.

Everything else below is incremental. The good news: your structured-data and
meta layer is already aligned with what Google *still* supports in 2026 (you
correctly avoid the deprecated FAQ/HowTo/searchbox traps — see §10).

---

## 1. Crawlability & indexing

| Item | Status | Notes / where |
|------|--------|---------------|
| `robots.txt` present, allows crawl | ✅ | `public/robots.txt` |
| AI crawler bots explicitly allowed (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended) | ✅ | `public/robots.txt` — strong GEO move |
| XML sitemap, referenced from robots | ✅ | `@astrojs/sitemap`, `sitemap-index.xml` |
| `sitemap` `lastmod` reflects real change dates | ⚠️ 🟠 | Integration on defaults → no meaningful `lastmod`. Add `serialize` once a real build/modified date exists (ties to §4 freshness). |
| `changefreq` / `priority` in sitemap | 🚫 | Google **ignores** these. Don't bother adding them. |
| Canonical host consolidated (apex → www, one canonical) | ✅ | `siteConfig.ts`, `astro.config.mjs` `trailingSlash: "never"` |
| Self-referencing `<link rel="canonical">` on every page | ✅ | `Seo.astro` |
| `noindex` on 404 / utility pages | ✅ | `src/pages/404.astro` |
| Google Search Console verification | ✅ | meta in `Layout.astro` |
| Bing Webmaster Tools verification | ❌ 🟡 | Not present. Bing feeds ChatGPT Search + Copilot + DuckDuckGo — worth claiming. |
| `robots` meta with `max-image-preview:large` | ✅ | `Seo.astro` — correct, helps image/Discover surfaces |
| HTTPS + HSTS | ✅ | Vercel default |
| Image sitemap | ➖ 🟢 | Low value here (OG images aren't content images). Skip unless you add real in-content imagery. |

---

## 2. On-page metadata

| Item | Status | Notes / where |
|------|--------|---------------|
| Unique `<title>` per page | ✅ | `Seo.astro` + `categoryMeta` |
| Unique meta description per page | ✅ | per-category in `categories.ts` |
| One `<h1>` per page | ✅ | each page template |
| Logical heading hierarchy (no duplicate/spam headings) | ⚠️ 🟠 | `JokeCard` renders the category name as `<h2>` on **every** card → on a category page that's dozens of identical `<h2>FAT</h2>` under the `<h1>`. Demote per-card title to a styled `<p>`/`<span>` on category pages. |
| `<meta name="keywords">` | 🚫 | Obsolete since ~2009. Correctly **absent** — keep it that way. |
| Open Graph tags (type, title, desc, url, image, site_name, locale) | ✅ | `Seo.astro` |
| `og:image` 1200×630 + `og:image:width/height/alt` | ✅ | `Seo.astro`; per-category PNGs in `public/og/` |
| Twitter/X card (`summary_large_image`) | ✅ | `Seo.astro` |
| `twitter:site` / `@handle` | ⚠️ 🟢 | `TWITTER_HANDLE` is empty → tag never emits. Fill in if you own a handle. |
| `lang` attribute on `<html>` | ✅ | `Layout.astro` `lang="en"` |
| Viewport / charset / theme-color | ✅ | `Layout.astro` |
| Favicon + apple-touch-icon | ⚠️ 🟡 | Only `favicon.ico`. Add PNG `icon-192/512` + `apple-touch-icon.png` (180×180) and a `site.webmanifest` for cleaner mobile/Discover presentation. |
| Breadcrumb **visible UI** (matching the JSON-LD) | ❌ 🟡 | Breadcrumb schema exists but there's no on-page breadcrumb trail. Google prefers the visible trail to match markup. |

---

## 3. Structured data (schema.org / JSON-LD)

| Item | Status | Notes / where |
|------|--------|---------------|
| `Organization` (publisher identity) | ✅ | `lib/jsonld.ts` |
| `Organization.logo` is a real raster ≥112×112 (PNG/JPG) | ⚠️ 🟡 | Currently points at `favicon.ico`. Google's logo guidelines want a crawlable raster image; supply a proper PNG logo. |
| `Organization.sameAs` (social/entity links) | ❌ 🟡 | Missing. Add your FB/X/TikTok/Instagram URLs — feeds the Knowledge Graph / entity recognition. |
| `WebSite` | ✅ | `lib/jsonld.ts` |
| `WebSite` + `SearchAction` (sitelinks searchbox) | 🚫 | **Deprecated Nov 21 2024.** Do NOT add `potentialAction`/SearchAction. Plain `WebSite` is fine and is what you have. |
| `BreadcrumbList` | ✅ | category, categories, privacy pages |
| `CollectionPage` + `ItemList` for joke lists | ✅ | `jokeCollectionSchema()` |
| `FAQPage` | ✅ (correctly framed) | Kept for **AI/GEO parsing only** — see note. FAQ **rich results were dropped May 7 2026**; the markup is still valid and Google still parses it. Your code comments already say this. ✔️ |
| `HowTo` | 🚫 | Removed by Google (2023–24). Correctly **absent**. |
| `CreativeWork` per joke (inside ItemList) | ✅ | good GEO signal; jokes are individually addressable via `#joke-N` |
| `dateModified` / `datePublished` on collection pages | ❌ 🟠 | Missing. Add once a real build date exists — a freshness signal for both classic SEO and AI engines. |
| Validate with a schema.org linter (not Google's deprecated Rich Results Test for FAQ) | ✅ note | Already documented in `lib/jsonld.ts` |

---

## 4. Content depth, freshness & E-E-A-T  🔴 (the real gate)

| Item | Status | Notes |
|------|--------|-------|
| Substantial **original** prose per category (≈150–300 words: origin of "the dozens," delivery tips, etiquette) | ❌ 🔴 | Today: one lede sentence + list. This is the #1 AdSense "low-value content" rejection trigger in 2026 and caps rankings (jokes are mass-duplicated across the web). |
| Original/curated jokes vs. scraped duplicates | ⚠️ 🔴 | Aggregated one-liners = duplicate content. Differentiate (rewrite, add original sets, add commentary). 🆕 Google's **scaled content abuse** policy (last updated 2026-05-15) targets mass-produced low-value pages **"no matter how it's created"** (AI or human) — and the **Helpful Content system has been folded into core ranking since Mar 2024**, so helpfulness is judged in every core update, not as a separate filter. |
| Visible "Last updated" date + actually changing content | ❌ 🔴 | The "refreshed daily" claim is currently **false in prod** — no scheduled rebuild exists. Add a **Vercel Cron / GitHub Action daily redeploy** so the date-seeded picker actually rotates and `lastmod`/`dateModified` advance. |
| About page (E-E-A-T: who runs this, why) | ❌ 🟠 | No About page. AdSense reviewers and E-E-A-T both reward a clear publisher identity. |
| Author/editorial signal | ➖ 🟢 | Low priority for humor content, but a named editor + "how we pick jokes" blurb helps E-E-A-T. |
| Privacy Policy | ✅ | `privacy-policy.astro` (covers AdSense + analytics + EEA/UK/CA) |
| Contact method | ✅ | header/footer mailto |
| Terms / disclaimer page | ➖ 🟡 | Optional but reviewers like a complete "trust" set (Privacy + Contact + About + Terms). |
| Sufficient page count / not "under construction" | ✅ | 21 categories + home + categories index = enough surface |

> **E-E-A-T + GEO note:** Google's May 2026 generative-AI guidance states
> "optimizing for generative AI search is still SEO." ~76% of AI citations come
> from URLs already in Google's top-10. So the content work above is *also* your
> GEO strategy — there is no separate AI track.

---

## 5. Performance / Core Web Vitals (2026 thresholds)

Targets at p75: **LCP < 2.5s**, **INP < 200ms** (now a primary signal; FID is gone since Mar 2024), **CLS < 0.1**. Evaluated on real field data, mobile + desktop.

> 🆕 **Correction (2026-06-19):** ~~Google tightened LCP guidance toward ~2.0s in 2026~~ — **this
> was wrong** (a claim circulating in SEO blogs, and repeated in two sibling cookbooks). web.dev's
> official "good" LCP threshold is still **2.5s** and has not changed. Aim low for headroom, but the
> pass/fail bar is 2.5s. INP is the metric most sites actually fail in 2026. (Verified: web.dev/articles/vitals.)

| Item | Status | Notes |
|------|--------|-------|
| Static HTML, minimal JS (Astro islands) | ✅ | inherently good INP/LCP |
| Self-hosted fonts + `preload` + size-matched fallback | ✅ | `astro.config.mjs` Fonts API + `Layout.astro` `<Font preload>` — excellent for LCP/CLS |
| No render-blocking third-party font request | ✅ | removed Google Fonts CDN |
| Images sized with width/height (no CLS) | ✅ (current set) | logo has explicit dims |
| **Ad layout shift reserved** (Auto Ads CLS risk) | ❌ 🔴 | AdSense Auto Ads inject elements post-load → CLS/LCP damage + lower viewability/RPM. Reserve space with `min-height` containers or move to **manual ad units** in fixed slots. |
| `loading="lazy"` on below-the-fold images | ➖ | Few content images today; apply if you add any. |
| **`preconnect` to ad/analytics origins** 🆕 | ❌ 🟡 | Once Auto Ads/GA fire, add `<link rel="preconnect">` for `pagead2.googlesyndication.com`, `www.googletagmanager.com`, `www.google-analytics.com` to cut connection latency and protect LCP. (Harvested from sibling cookbooks.) |
| **Lazy-load below-the-fold ad units** 🆕 | ❌ 🟢 | Improves LCP and RPM/viewability. Pairs with the reserved-height fix above. |
| Field-data monitoring (CrUX / Search Console CWV report) | ❌ 🟡 | Watch real-world INP/CLS after ads go live — only ~56% of origins pass all three in 2026, and INP is the most-failed. |

---

## 6. Monetization & ad compliance  🔴

| Item | Status | Notes |
|------|--------|-------|
| `ads.txt` present & matches publisher ID | ✅ | `public/ads.txt` → `pub-3950888851778991` |
| AdSense loader script (prod-only) | ✅ | `Layout.astro`, gated on `import.meta.env.PROD` |
| **Google-certified CMP (IAB TCF v2.3)** for EEA/UK/CH | ❌ 🔴 | **Custom `ConsentBanner.astro` is NOT certified.** Required since 2024, still enforced 2026. Without it, EEA/UK/CH traffic is capped to non-personalized/limited ads. **Fix:** enable AdSense's free **Privacy & messaging → GDPR message** (Google's own certified CMP) or adopt a certified CMP (Cookiebot, CookieHub, Usercentrics). Then retire or downgrade the custom banner to non-EEA only. 🆕 **TCF v2.3 timeline (verified):** IAB Europe released v2.3 on 19 Jun 2025; Google has accepted v2.3 strings since 17 Oct 2025; **full support was mandatory by 28 Feb 2026** and from **1 Mar 2026** any new consent string must be v2.3 or vendors treat traffic as **"Limited Ads."** Pick a CMP already certified for v2.3 — a certified CMP migrates the version for you with no forced re-consent. (Sibling cookbooks still said "v2.2" — outdated; v2.3 is current.) |
| Consent Mode v2 default state (denied in EEA/UK/CH, wait_for_update) | ✅ | `Layout.astro` — correct *signaling*, but signaling ≠ certified CMP (above) |
| Consent choice persisted & re-applied | ✅ | `localStorage` + `ConsentBanner.astro` |
| Ad placement that won't trigger "valid clicks" / policy issues | ⚠️ 🟡 | Auto Ads near the daily-joke CTA can cause accidental clicks; review placement when you wire real units. |
| Content policy compliance (Dirty/Nasty categories) | ⚠️ 🟠 | AdSense may serve limited/no ads on adult-flagged pages. Keep the "adult" labelling (you do in `llms.txt`), and consider `data-ad` exclusions or page-level ad controls on `dirty`/`nasty`. |
| **Better Ads Standards compliance** 🆕 | ➖ 🟡 | The Coalition for Better Ads updated its desktop + mobile standards; **compliance is assessed no earlier than 14 May 2026.** Core rule: on mobile, **no ad type may exceed ~30% of the main-content vertical height** ("ad density overload"); no pop-ups, auto-playing-sound, or large stickies. Violations can make **Chrome block all ads** on the site. You have no ads yet, so you're compliant — keep density sane when you wire units. |
| **Ad-network options as traffic grows** 🆕 | ➖ 🟢 | Bare AdSense pays the least. Higher-RPM alternatives by traffic tier: **Ezoic** (no minimum), **Mediavine Journey** (~10k sessions), **Raptive** (~25k pageviews). Note: a higher-RPM network won't fix thin content (§4) — it amplifies an already-working site. |
| Original content sufficient for approval | ❌ 🔴 | See §4 — the actual approval gate. |
| CMP recertification awareness (every 12 months) | ➖ note | If you adopt a third-party CMP, certification must renew annually. |

---

## 7. Internal linking & site architecture

| Item | Status | Notes |
|------|--------|-------|
| Global nav (Home, Categories, Contact) | ✅ | `Layout.astro` header/footer |
| Categories index linking to all 21 categories | ✅ | `categories.astro` |
| **Cross-links between category pages** ("related categories") | ❌ 🟠 | Category pages only escape via global nav. Add a related-categories block → better crawl depth, PageRank flow, dwell time. |
| Contextual in-content links | ⚠️ 🟢 | Home has a few (`/jokes/fat…` etc.). Category pages have none — add 2–3 contextual links in the new intro prose (§4). |
| Visible breadcrumbs | ❌ 🟡 | See §2. |
| Individual joke permalink pages | ➖ 🟡 | Deliberately **not** built. Pro: long-tail + unique share URLs. Con: thin-content/index-bloat — collides with §4. **Defer** until category content depth is fixed, then test as a measured experiment. |
| Flat, shallow URL depth | ✅ | `/jokes/<category>` is 1 level |
| Descriptive, keyword-rich slugs | ✅ | `fat-yo-mama-jokes`, etc. |

---

## 8. GEO / AI search optimization

> 🆕 **Framing (verified 2026):** Google published its **first official generative-AI optimization
> guide (May 2026)** and its core message is *"optimizing for generative AI search is still SEO"* —
> AEO/GEO run on the **same ranking systems** as classic Search. Google explicitly says you **do NOT
> need** `llms.txt`, AI-specific files, special markup, or content "chunking" to appear in AI Overviews/AI
> Mode. So GEO is an **additive layer on solid SEO (§4)**, not a separate track.
>
> The genuinely GEO-specific, **measured** levers come from the peer-reviewed **Princeton GEO study**
> (KDD 2024, 10k queries, 9 methods): up to **+40%** AI visibility overall. The top additions are
> **statistics (~+40%)**, **citing authoritative sources (~+40%)**, and **expert quotations (~+28%)** —
> keyword stuffing does *nothing*. Separately, **brand mentions correlate ~3× more strongly with AI
> citation than backlinks (0.66 vs 0.22, Ahrefs)**, and a page with a visible "Last updated" date beats
> a stale one on the same topic.

| Item | Status | Notes |
|------|--------|-------|
| `llms.txt` | ✅ (low value) | `public/llms.txt` — clean, lists all categories. 🆕 **Reality check:** Google (May 2026) gives it **no special treatment**, and Ahrefs found **~97% of `llms.txt` files get zero crawler fetches**. Keep it (cheap, doubles as a human link-map) but **do not invest further** — it is not a citation lever. |
| AI bots allowed in robots | ✅ | §1 — the search/retrieval bots that actually feed citations (`OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`, `Googlebot`, `Bingbot`) are allowed. |
| Server-rendered content (AI crawlers don't run JS) 🆕 | ✅ | **Highest-impact GEO fact.** GPTBot/ClaudeBot/PerplexityBot don't execute JS; your static Astro HTML means they read the full page. Already done — keep all content in HTML, never JS-gated. |
| `FAQPage` retained for AI extraction | ✅ | §3 |
| Direct-answer blocks / definitions ("A Yo Mama joke is…") | ✅ | home + llms.txt define the entity well |
| **Statistics + citations + quotations in prose** 🆕 | ❌ 🟠 | The three top Princeton citation drivers. Add sourced facts (origin of "the dozens," dated cultural context), cite an authority (e.g. a folklore/etymology source), and you become the easy citation. Ships with the §4 editorial work. |
| **Reference tables / structured lists** 🆕 | ⚠️ 🟢 | Table/list structures are among the most-cited formats for AI answers. A "21 categories at a glance" table or "types of yo-mama joke" definition list is cheap and extractable. |
| Entity-led, well-structured headings & lists | ⚠️ 🟠 | Improves with the §4 editorial depth (dated facts, named context, original framing = what AI engines cite). |
| **Off-site brand presence (Reddit / social / mentions)** 🆕 | ❌ 🟡 | Brand mentions are the strongest *measured* correlate of AI inclusion (> backlinks). Genuine presence + consistent brand name across the web feeds it. Ties to §3 `sameAs` and §9 social profiles. |
| Already-ranking pages (prerequisite for AI citation) | ⚠️ | ~76% of AI citations are top-10 URLs → classic SEO (§4) is the lever. |
| `dateModified` / freshness for AI recency | ❌ 🟠 | §3/§4. AI engines weight recency; a visible "Last updated" + `dateModified` is a measured citation signal. |
| Structured original data/stats (highly citable) | ➖ 🟢 | e.g., "21 categories, N jokes, updated daily" stat block — cheap GEO win once freshness is real. |
| **Measure AI referrals** 🆕 | ❌ 🟢 | Segment GA4 by source for `chatgpt` / `perplexity` / `gemini` referrals, and run a monthly fixed-prompt citation audit ("best yo mama jokes site") to track whether AI engines cite you. Otherwise GEO progress is invisible. |

---

## 9. Distribution, indexing speed & measurement

| Item | Status | Notes |
|------|--------|-------|
| Google Analytics (GA4) with Consent Mode | ✅ | `Layout.astro` (`G-L8P7J1TJSY`) |
| Google Search Console | ✅ | verified |
| Bing Webmaster Tools | ❌ 🟡 | §1 — feeds ChatGPT Search/Copilot/DuckDuckGo |
| **IndexNow** (instant Bing/Yandex/Naver/Seznam indexing) | ❌ 🟡 | Google does **not** support IndexNow (2026), but Bing & co. do (~5B URLs/day), and that index feeds AI search. Cheap to add: host the key file + ping on deploy. |
| RSS / Atom feed (daily jokes) | ❌ 🟢 | Easy in Astro; adds a distribution + freshness/crawl signal. |
| Social profiles (for `sameAs` + referral) | ❌ 🟡 | Create + link (also unlocks §3 `sameAs` and §2 `twitter:site`). |
| Social share buttons | ✅ | `SocialShareButtons.astro` |
| Share buttons point to a meaningful URL | ⚠️ 🟢 | All point to the category URL (no per-joke URL). FB/X work; **Instagram/TikTok web "share" URLs are effectively no-ops** (those platforms have no web share intent) — consider replacing with copy-link or removing. |

---

## 9b. 🔒 Security, headers & caching (minor SEO / trust signal) 🆕

Harvested from the sibling cookbooks. None of these are ranking blockers, but they're cheap
trust/perf wins and reviewers/AI engines reward a clean, well-configured origin. Add via
`vercel.json` `headers`.

| Item | Status | Notes |
|------|--------|-------|
| Security headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy`, CSP) | ❌ 🟢 | Add in `vercel.json`. Tighten/author the **CSP last**, once the CMP + AdSense + GA script origins are known (an over-strict CSP will silently break ads). |
| `Strict-Transport-Security` (HSTS) | ✅ | Vercel default (§1). |
| Long-cache hashed assets (`Cache-Control: immutable` for `/_astro/*`) | ❌ 🟢 | Astro content-hashes asset filenames, so they're safe to cache forever — set `immutable` to cut repeat-visit load. |
| `www` 301 enforced (apex/http → canonical host) | ✅ | §1 — verify it stays enforced at Vercel/DNS so signals don't split. |

---

## 9c. ☁️ Cloudflare migration state (2026-07-08) 🆕

Migrated off Vercel to **Cloudflare Workers static assets**, deployed via **Cloudflare Git
integration (Workers Builds)** — every push to `main` auto-builds (`npm run build` → `dist/`) and
deploys. The daily comedy-bot commit is itself a push, so it rebuilds the site (rotating the
date-seeded "joke of the day" + advancing "/" `lastmod`) with no separate cron. No CI deploy
secrets needed. Canonical host stays **www** (`astro.config.mjs` `site:` + apex→www 301). See MASTER §14.

**Config-as-code (committed, verified via `wrangler deploy --dry-run` + `npm run build`):**

| Item | Status | Where |
|------|--------|-------|
| Wrangler config — `dist/` assets, `drop-trailing-slash`, `404-page` (real HTTP 404) | ✅ | `wrangler.jsonc` |
| **www** custom-domain route (canonical host) | ✅ | `wrangler.jsonc` → `routes` |
| Response headers (HSTS, `nosniff`, `Referrer-Policy`, immutable `/_astro/*`) | ✅ | `public/_headers` (was `vercel.json`) |
| `.well-known/security.txt` (RFC 9116) | ✅ | `public/.well-known/security.txt` |
| Deploy on push (incl. daily bot commit) | ✅ | Cloudflare Git integration — no cron, no CI secrets |
| Retired Vercel config | ✅ | `vercel.json` + `public/vercel.svg` deleted |
| Path-level `_redirects` | ➖ | none needed yet (host redirect is dashboard, below) |

**Dashboard-only — NOT version-controlled. Re-verify at every audit + every new zone (MASTER §6.1/§14):**

| Setting | Target state | Prio |
|---------|--------------|------|
| apex → www **301 Redirect Rule** | enforced at the edge (was `vercel.json`) | 🔴 |
| **AI Crawl Control** | allow **Search + Agent**; **no** blanket Training block (sweeps in Googlebot/Bingbot/Applebot). Deadline **15 Sep 2026** | 🔴 |
| **Rocket Loader** | **OFF** (breaks AdSense/CMP/analytics) | 🔴 |
| Always Use HTTPS + **HSTS** | ON | 🟠 |
| Bot Fight Mode | prefer off; if on, watch Security→Events for blocked verified bots | 🟠 |
| **Crawler Hints** (free IndexNow) | ON — makes hand-rolled `public/indexnow.txt` redundant | 🟡 |
| Early Hints (HTTP 103) | ON | 🟡 |
| Don't stack optimizers (Mirage/Polish/minify) | OFF on static output | 🟢 |
| **Workers Builds** connected to the GitHub repo | build `npm run build`, output `dist`, deploy on push to `main` | 🔴 |

**CI secrets:** none needed (Git integration deploys server-side). The old `VERCEL_DEPLOY_HOOK_URL` secret can be removed.

---

## 10. 🚫 Deprecated — do NOT implement (verified 2026)

These are common "best practices" that are now retired. Listed so they never get
added back. **Your repo correctly avoids all of these already.**

| Thing | Status | Verified |
|-------|--------|----------|
| FAQ **rich results** | 🚫 dropped **May 7 2026** | Markup still valid for parsing/AI; just won't show in SERP. (You keep it for GEO — correct.) |
| HowTo rich results | 🚫 removed 2023–24 | Don't add HowTo schema. |
| Sitelinks searchbox / `WebSite` `SearchAction` | 🚫 retired **Nov 21 2024** | Don't add `potentialAction`. |
| `<meta name="keywords">` | 🚫 ignored since ~2009 | Never add. |
| Sitemap `<changefreq>` / `<priority>` | 🚫 ignored by Google | Don't bother. |
| FID (First Input Delay) | 🚫 replaced by **INP** Mar 2024 | Optimize INP, not FID. |
| Relying on Google's Rich Results Test for FAQ | 🚫 support removed | Use a generic schema.org/JSON-LD validator. |
| "LCP must be **under 2.0s** in 2026" 🆕 | 🚫 **myth** | web.dev's *good* LCP threshold is still **2.5s** — unchanged. Aim low, but the bar is 2.5s. (This was a wrong line in earlier versions of this file — see §5.) |
| `google.com/ping` sitemap submission 🆕 | 🚫 endpoint removed 2023 | Don't ping it. Declare the sitemap in `robots.txt` (done) and submit via Search Console. |
| "Chunk content into tiny pieces for AI" 🆕 | 🚫 debunked by Google (May 2026) | Google's systems extract the relevant passage from normal multi-topic pages. Write well-structured normal pages. |
| "`llms.txt` gets you cited by AI" 🆕 | 🚫 no proven benefit | Google gives it no special treatment; ~97% of `llms.txt` files are never fetched. Keep it as a cheap hedge only (§8). |
| 7 more schema types (Book/Course/ClaimReview/Salary/LearningVideo/SpecialAnnouncement/VehicleListing) 🆕 | 🚫 rich results retired Jun 2025 | Don't invest in these — same reasoning as FAQ/HowTo. |

---

## 11. Prioritized action plan

### 🔴 Do first — gates approval, ranking & revenue
1. **Adopt a Google-certified CMP** (AdSense Privacy & messaging GDPR message, free) — replaces/augments the custom banner for EEA/UK/CH. *(§6)*
2. **Add original per-category prose** (150–300 words) + an **About page**. *(§4)*
3. **Reserve ad slots** (min-height containers or manual units) to protect CLS/INP. *(§5)*
4. **Schedule a daily rebuild** (Vercel Cron / GitHub Action) so "daily" is true and `lastmod`/`dateModified` advance. *(§4)*

### 🟠 High — mechanical ranking/crawl gains
5. Kill the duplicate `<h2>` on category cards. *(§2)*
6. Add related-categories block + visible breadcrumbs. *(§7, §2)*
7. Add `dateModified`/`datePublished` to schema + sitemap `lastmod`. *(§3, §1)*
8. Page-level ad controls / labelling on `dirty`/`nasty`. *(§6)*

### 🟡 Medium — entity, indexing & distribution
9. Proper PNG logo + `Organization.sameAs` + fill `twitter:site`. *(§2, §3)*
10. Bing Webmaster Tools + IndexNow ping on deploy. *(§1, §9)*
11. Real icon set + `site.webmanifest`. *(§2)*
12. 🆕 GA4 AI-referral segments (`chatgpt`/`perplexity`/`gemini`) + monthly fixed-prompt citation audit. *(§8)*
13. 🆕 Build off-site brand presence (consistent name + a few real profiles/mentions) — strongest measured AI-citation correlate. *(§8)*

### 🟢 Low — incremental
14. RSS feed; original stat block + reference table for GEO; fix/replace IG+TikTok share links. *(§8, §9)*
15. 🆕 `vercel.json` security headers + `Cache-Control: immutable` on `/_astro/*`. *(§9b)*
16. 🆕 When ads go live: `preconnect` to ad/analytics origins, lazy-load below-fold units, keep mobile ad density ≤30% (Better Ads). *(§5, §6)*

---

## Sources (verified 2026-06-19)

**AdSense / monetization / content policy**
- Google AdSense approval & low-value/scaled-content (2026): https://webtimizesolutions.com/blog/google-adsense-approval-2026/ · https://hikewebsolutions.com/details/fix-google-adsense-low-value-content-error-2026
- Google expands rules on low-value/scaled content (SEMrush): https://www.semrush.com/blog/google-expands-rules-on-low-value-content
- AdSense AI content policy 2026: https://thehumanizeai.pro/articles/google-adsense-ai-content-policy-2026

**Consent / CMP (critical finding)**
- Google certified-CMP requirement for EEA/UK/CH (official AdSense Help): https://support.google.com/adsense/answer/13554116 · https://support.google.com/adsense/answer/13554020
- AdSense certified CMP overview: https://secureprivacy.ai/blog/adsense-certified-cmp
- Consent Mode v2 setup (2026): https://www.cookiehub.com/blog/google-consent-mode-v2-setup-gtm-guide

**Structured data status**
- FAQ rich results dropped May 7 2026 (Search Engine Journal): https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/ · context: https://www.thehoth.com/blog/google-faq-rich-results-deprecated/
- Sitelinks searchbox deprecation (Google Search Central): https://developers.google.com/search/blog/2024/10/sitelinks-search-box

**Core Web Vitals (2026)** — *re-verified 2026-06-19; LCP is **2.5s**, the "2.0s" claim is a myth*
- **Official thresholds (web.dev):** https://web.dev/articles/vitals · https://web.dev/articles/defining-core-web-vitals-thresholds
- Benchmarks/pass-rates: https://www.corewebvitals.io/core-web-vitals · https://www.digitalapplied.com/blog/core-web-vitals-benchmarks-2026-pass-rate-reference

**GEO / AI search** — *re-verified 2026-06-19*
- **Google's official generative-AI optimization guide (May 2026, "still SEO"):** https://developers.google.com/search/docs/fundamentals/ai-optimization-guide · https://developers.google.com/search/blog/2026/05/a-new-resource-for-optimizing
- "Google's new AI search guide calls AEO/GEO still SEO" (SEJ): https://www.searchenginejournal.com/googles-new-ai-search-guide-calls-aeo-and-geo-still-seo/575026/
- **Princeton GEO study** (KDD 2024; +40% visibility; stats/citations/quotations drivers): https://arxiv.org/abs/2311.09735
- GEO statistics roundup (brand mentions 0.66 vs backlinks 0.22): https://www.omnibound.ai/blog/generative-engine-optimization-statistics
- llms.txt reality (~97% uncrawled, Ahrefs): https://www.searchenginejournal.com/97-of-llms-txt-files-got-no-requests-ahrefs-data-shows/579478

**Consent / TCF v2.3** — *re-verified 2026-06-19*
- Google mandates TCF v2.3 by 28 Feb 2026: https://ppc.land/google-mandates-tcf-v2-3-migration-by-february-2026/ · https://www.clym.io/blog/tcf-v23-deadline-what-publishers-must-do-before-february-28-2026
- IAB Europe transition to TCF v2.3: https://iabeurope.eu/all-you-need-to-know-about-the-transition-to-tcf-v2-3/

**Better Ads Standards (2026)** — *re-verified 2026-06-19*
- Coalition updates for desktop + mobile web (assessed no earlier than 14 May 2026): https://www.betterads.org/press-releases/updated-standards-desktop-mobile-web · https://www.betterads.org/mobile-ad-density-higher-than-30/

**Indexing / IndexNow / Bing**
- Google does not support IndexNow (2026): https://pressonify.ai/blog/indexnow-instant-indexing-press-releases-2026
- Bing Webmaster Tools + IndexNow setup: https://jetfuel.agency/how-to-set-up-bing-webmaster-tools-for-your-site-step-by-step-guide/
- Image SEO (Google Search Central): https://developers.google.com/search/docs/appearance/google-images
