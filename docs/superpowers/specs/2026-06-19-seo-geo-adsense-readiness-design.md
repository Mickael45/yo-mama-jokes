# SEO / GEO + AdSense-Readiness Sweep — Design

**Date:** 2026-06-19
**Site:** `yo-mama-jokes` — yomamajokescentral.com (Astro 6 static + Vercel)
**Source of truth:** `../MASTER_SEO_COOKBOOK.md` (§14 priority snapshot, §17.3 per-site appendix)

## Goal

Maximize organic + AI-answer-engine visibility so the site can carry ads later, and make
the site **technically AdSense-ready without enabling ads yet**. Ads ship behind a flag
(`ADS_ENABLED = false`) and are flipped on only after the content bar is met.

## Non-goals

- Enabling live AdSense units now.
- Writing the prose body for all 21 categories (the owner writes 19; this work scaffolds
  the structure and ships 2 fully-written examples).
- Internationalization / hreflang (future lever, out of scope).

## Current state (already done — do not redo)

Astro 6 static + Vercel · absolute self-referencing canonical (`Seo.astro`) ·
`@astrojs/sitemap` + `robots.txt` with `Sitemap:` and AI bots allowed ·
`max-image-preview:large` · Consent Mode v2 default-denied for EEA/UK/CH (`Layout.astro`) ·
per-category 1200×630 OG PNGs with `og:image:width/height/alt` + `twitter:summary_large_image` ·
Organization / WebSite / BreadcrumbList / CollectionPage+ItemList / FAQPage JSON-LD (`lib/jsonld.ts`) ·
self-hosted fonts with preload (`astro.config.mjs`) · GA4 with consent gating · `ads.txt` ·
`privacy-policy` page · `404.astro`.

## Key decisions

| Decision | Choice | Rationale |
|---|---|---|
| Category prose | Owner writes 19; this work scaffolds the model + writes 2 example categories | Content is the owner's voice; structure + examples de-risk it. |
| About / Contact / Terms | This work drafts them | Boilerplate/legal, not creative voice. Gates AdSense + feeds E-E-A-T. |
| "Daily" rotation | GitHub Actions cron → Vercel Deploy Hook nightly rebuild | Pure-static site; avoids adding a serverless function just for Vercel Cron. |
| Ad units | `AdSlot.astro` with reserved height, gated behind `ADS_ENABLED` (default `false`) | Reserves CLS space and proves placement without serving ads. |
| Certified CMP | Keep current banner while ads off; document one-step swap to Google "Privacy & messaging" at launch | Certified CMP only bites when serving personalized ads; Consent Mode v2 tags already present. |
| Org logo | Generate real PNG + SVG ≥112×112; replace `favicon.ico` as logo | Cookbook X2: ≥112×112, Google-Images format; a `.ico` is a weak choice. |

## Workstreams

### A. Content & E-E-A-T 🔴
- New `lib/categoryContent.ts` content model, one entry per category:
  - `directAnswer` — a self-contained 40–60-word answer under a question-style heading (GEO/RAG lever).
  - `body` — original prose (origin of the "yo mama" format / how to deliver / why it lands).
  - `citations` — 1–2 outbound links to authorities (e.g. style/comedy/etymology references).
- Wire into `src/pages/jokes/[category].astro`: render the question heading + direct answer
  above the joke feed, the prose body and citations below, ahead of the FAQ.
- Placeholders for all 21 categories; **2 categories fully written** as copy-paste templates.
- Visible "Last updated" date on category pages + real `dateModified` in the page schema.
- New pages: `about`, `contact` (real page, not just `mailto:`), `terms`. Linked from footer + nav.

### B. Structural / crawl fixes 🟠
- `JokeCard.astro`: stop emitting the category name as `<h2>` on every card. Add a
  `showCategoryLabel` prop — render a styled non-heading label on the mixed homepage feed,
  omit it on single-category pages (redundant with the `<h1>`).
- Visible breadcrumb UI on category pages matching the existing `BreadcrumbList` schema.
- Honest `lastmod`: set it per-page from git mtime via the `@astrojs/sitemap` `serialize` hook;
  omit where unknown rather than stamping a flat build date.
- `vercel.json`: add `headers` — `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`; `Cache-Control: public, max-age=31536000, immutable`
  on `/_astro/*`; confirm apex→www 308 redirect.

### C. Make "daily" real 🔴
- `.github/workflows/daily-rebuild.yml`: scheduled (cron) job that POSTs a Vercel **Deploy Hook**
  (URL stored as a repo secret), so the date-seeded `dailyJokesPicker` rotates and `lastmod` moves.
- Document the Deploy Hook setup step in the PR / README.

### D. Ad-readiness — built but inert 🔴
- `ADS_ENABLED` flag in `lib/siteConfig.ts` (default `false`).
- `components/AdSlot.astro`: reserves `min-height` to prevent CLS; renders nothing (no `<ins>`,
  no loader) until `ADS_ENABLED` is true. Place at standard positions (e.g. below-fold on
  category/home).
- Gate the AdSense loader in `Layout.astro` on `ADS_ENABLED` in addition to `import.meta.env.PROD`.
- Mark adult categories (`dirty`, `nasty`) for page-level ad exclusion; add a code comment noting
  the AdSense adult-content policy risk.
- Document the launch swap to Google "Privacy & messaging" (Funding Choices) certified CMP.

### E. Identity & polish 🟡
- Generate a real logo: `logo.svg` + `logo-512.png` (≥112×112). Replace `favicon.ico` references:
  `Organization.logo` in `lib/jsonld.ts`, header `<img>` in `Layout.astro`. Add `apple-touch-icon.png`
  (180×180), `favicon.svg`, and `site.webmanifest` (192 + 512 + maskable 512) per cookbook §8.
- Enrich `Organization` schema: add `contactPoint` (uses `CONTACT_EMAIL`) and `sameAs[]`
  (placeholder array, populated when social accounts exist).
- `SocialShareButtons.astro`: remove the no-op Instagram/TikTok web-share links; add a
  "Copy link" button (Clipboard API). Keep working Facebook + X.
- `preconnect` to `pagead2.googlesyndication.com`, `www.googletagmanager.com`,
  `www.google-analytics.com` in `Layout.astro`.

### F. Measurement & GEO hedges 🟢
- Bing Webmaster Tools verification meta tag.
- IndexNow: host the key file under `public/`; POST changed URLs on deploy (script or workflow step).
- Documentation (README or `docs/`): GA4 AI-referral segmentation (chatgpt/perplexity/gemini) +
  a monthly fixed-prompt citation audit checklist.

## Risks / honest caveats

- **AdSense approval is content-gated.** Workstreams B–F make the site technically ready and
  grow organic/AI traffic, but approval waits until the owner fills in the remaining 19 category
  bodies using the scaffolding + 2 examples.
- Adult categories (`dirty`, `nasty`) may conflict with AdSense policy even with exclusions —
  flagged, not resolved, here.
- A flat sitemap `lastmod` is worse than none (Google distrusts all of them); the git-mtime
  approach must be verified to produce genuinely per-page dates.

## Testing / verification

- `astro build` succeeds; `astro check` clean.
- Each category page renders exactly one `<h1>` and zero stray `<h2>` category labels (grep the
  built HTML).
- JSON-LD validates at validator.schema.org (not Google's deprecated Rich Results Test for FAQ).
- With `ADS_ENABLED = false`: no `adsbygoogle` script and no `<ins>` in built output; AdSlot
  reserves height. Flipping the flag renders them.
- Sitemap `lastmod` values differ per page (not a single flat date).
- 404 page returns HTTP 404 and carries `noindex`.

## Sequencing

A (content model + pages) → B (structural fixes) → D (ad-readiness flag/component) →
E (identity/polish) → C (daily cron) → F (measurement). A and B unblock the AdSense content gate;
the rest is independent and parallelizable.
