# SEO / GEO + AdSense-Readiness Sweep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maximize organic + AI-answer-engine visibility and make the site technically AdSense-ready, with ads gated OFF behind a flag until the content bar is met.

**Architecture:** Astro 6 static site built to `dist/` and deployed on Vercel. Changes are content scaffolding (a new per-category content module), structural template fixes, an inert ad layer behind `ADS_ENABLED`, identity/manifest assets, a nightly Deploy-Hook rebuild, and measurement hedges. No live ads ship.

**Tech Stack:** Astro 6, TypeScript, Tailwind v4 (via PostCSS), `@astrojs/sitemap`, Vercel hosting, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-06-19-seo-geo-adsense-readiness-design.md`

## Global Constraints

- This repo has **no unit-test runner**. Verification per task = `npx astro check` (clean) + `npx astro build` (succeeds) + `grep` assertions against the built `dist/` HTML. Do not add a test framework.
- Canonical host is `https://www.yomamajokescentral.com` (`SITE_URL` in `lib/siteConfig.ts`); never hardcode the apex.
- `trailingSlash: "never"` — internal links have no trailing slash.
- Category slugs are full strings like `fat-yo-mama-jokes` (`constants.ts`); the matching joke data file is `jokes/<short>.ts` where `<short> = slug.replace("-yo-mama-jokes", "")`.
- Ads stay OFF: `ADS_ENABLED` defaults to `false`; no `adsbygoogle` script or `<ins>` may appear in `dist/` until it is flipped true.
- Import alias `@/` → repo root (e.g. `@/lib/siteConfig`).
- Path aliases: components in `/components`, libs in `/lib`, pages in `/src/pages`.
- Commit after every task with a Conventional Commit message; end each commit body with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

### Task 1: Per-category content model (`lib/categoryContent.ts`)

**Files:**
- Create: `lib/categoryContent.ts`

**Interfaces:**
- Produces: `export type CategoryContent = { question: string; directAnswer: string; body: string[]; citations: { label: string; href: string }[]; updated: string }` and `export const categoryContent: Record<Category, CategoryContent>` and `export function hasContent(c: Category): boolean`.
- Consumes: `Category` from `@/types`; category constants from `@/constants`.

- [ ] **Step 1: Create the module with the type, a helper, 2 fully-written examples, and empty scaffolds for the other 19.**

```typescript
// lib/categoryContent.ts
// Original, human-authored editorial content per category — the E-E-A-T / GEO
// layer that lifts each page above a bare joke list. `directAnswer` is a
// self-contained 40–60 word answer (RAG/AI-citation lever); `body` is original
// prose paragraphs; `citations` are outbound links to authorities.
// `updated` is an ISO date (YYYY-MM-DD) shown as "Last updated" + fed to schema.
//
// OWNER TODO: fill in the 19 entries currently marked `body: []`. Mirror the
// Fat and Dumb examples: one question heading, a tight direct answer, 2–4
// original paragraphs, and 1–2 real citations. `hasContent()` gates rendering
// so empty entries simply fall back to the existing lede until written.

import type { Category } from "@/types";
import {
  FAT_MAMA_JOKE_CATEGORY, SCARY_MAMA_JOKE_CATEGORY, NASTY_MAMA_JOKE_CATEGORY,
  UGLY_MAMA_JOKE_CATEGORY, DUMB_MAMA_JOKE_CATEGORY, AWFUL_MAMA_JOKE_CATEGORY,
  DIRTY_MAMA_JOKE_CATEGORY, TALL_MAMA_JOKE_CATEGORY, SHORT_MAMA_JOKE_CATEGORY,
  HAIRY_MAMA_JOKE_CATEGORY, BALD_MAMA_JOKE_CATEGORY, OLD_MAMA_JOKE_CATEGORY,
  POOR_MAMA_JOKE_CATEGORY, SKINNY_MAMA_JOKE_CATEGORY, CLUMSY_MAMA_JOKE_CATEGORY,
  EVIL_MAMA_JOKE_CATEGORY, GREEDY_MAMA_JOKE_CATEGORY, LAZY_MAMA_JOKE_CATEGORY,
  LOUD_MAMA_JOKE_CATEGORY, ENTITLED_MAMA_JOKE_CATEGORY, OTHER_MAMA_JOKE_CATEGORY,
} from "@/constants";

export type CategoryContent = {
  /** Question-style H2 the direct answer sits under (GEO). */
  question: string;
  /** Self-contained 40–60 word answer. Empty string = not written yet. */
  directAnswer: string;
  /** Original prose paragraphs. Empty array = not written yet. */
  body: string[];
  /** Outbound citations to authorities. */
  citations: { label: string; href: string }[];
  /** ISO date (YYYY-MM-DD) of last meaningful edit. */
  updated: string;
};

const EMPTY: CategoryContent = {
  question: "",
  directAnswer: "",
  body: [],
  citations: [],
  updated: "2026-06-19",
};

export const categoryContent: Record<Category, CategoryContent> = {
  [FAT_MAMA_JOKE_CATEGORY]: {
    question: "What are fat yo mama jokes?",
    directAnswer:
      "Fat yo mama jokes are exaggeration-based one-liners that comically inflate a mother's size for absurd effect — \"so fat\" she has her own gravitational pull or postal code. The humor comes from hyperbole pushed past realism, not genuine cruelty, which is why they read as playful banter rather than insults.",
    body: [
      "The \"so fat\" formula is the most recognizable branch of yo mama jokes, and it works through pure hyperbole. A good one doesn't just say someone is large — it builds a tiny absurd image you can picture instantly, like a mother who shows up on satellite weather maps. The exaggeration is so far past reality that nobody mistakes it for a real description, which is exactly what keeps it in the realm of friendly ribbing.",
      "This style traces back to \"the dozens,\" an African-American oral tradition of competitive, rhyming insult-trading documented by folklorists throughout the 20th century. The goal was never to wound; it was to show wit and stay composed under fire. Fat jokes survived into modern yo mama humor because size is an easy, universal target for visual exaggeration.",
      "Delivery matters more than the line. Keep it quick, commit to the image, and land it with a smile so it reads as a roast among friends rather than a real dig. The best fat yo mama jokes are the ones so over-the-top that the person being teased laughs first.",
    ],
    citations: [
      {
        label: "Encyclopædia Britannica — \"the dozens\" (verbal contest tradition)",
        href: "https://www.britannica.com/topic/the-dozens",
      },
    ],
    updated: "2026-06-19",
  },
  [DUMB_MAMA_JOKE_CATEGORY]: {
    question: "What are dumb yo mama jokes?",
    directAnswer:
      "Dumb yo mama jokes build their punchline around comical stupidity — a mother who studies for a blood test or returns a puzzle because a piece was missing from a soup can. The humor is gentle and absurd rather than mean, relying on surprising leaps of illogic that make the listener picture the silly scenario.",
    body: [
      "Dumb yo mama jokes are some of the most family-friendly in the format because their target is a goofy situation, not a person's looks or worth. The classic shape sets up an everyday task and then resolves it with a wonderfully wrong conclusion — studying for a blood test, or staring at a juice box because it said \"concentrate.\"",
      "What makes them land is the logic gap. Your brain expects a sensible ending and instead gets a cheerful non-sequitur, and that surprise is the laugh. Because the joke lives entirely in wordplay and absurd reasoning, it travels well across ages and audiences, which is why dumb jokes are a safe pick when you're not sure who's listening.",
      "If you're writing your own, anchor it to something ordinary and familiar, then break the logic in a way the listener can instantly visualize. The shorter the trip from setup to absurd payoff, the better it lands.",
    ],
    citations: [
      {
        label: "Encyclopædia Britannica — \"the dozens\" (verbal contest tradition)",
        href: "https://www.britannica.com/topic/the-dozens",
      },
    ],
    updated: "2026-06-19",
  },
  [SCARY_MAMA_JOKE_CATEGORY]: EMPTY,
  [NASTY_MAMA_JOKE_CATEGORY]: EMPTY,
  [UGLY_MAMA_JOKE_CATEGORY]: EMPTY,
  [AWFUL_MAMA_JOKE_CATEGORY]: EMPTY,
  [DIRTY_MAMA_JOKE_CATEGORY]: EMPTY,
  [TALL_MAMA_JOKE_CATEGORY]: EMPTY,
  [SHORT_MAMA_JOKE_CATEGORY]: EMPTY,
  [HAIRY_MAMA_JOKE_CATEGORY]: EMPTY,
  [BALD_MAMA_JOKE_CATEGORY]: EMPTY,
  [OLD_MAMA_JOKE_CATEGORY]: EMPTY,
  [POOR_MAMA_JOKE_CATEGORY]: EMPTY,
  [SKINNY_MAMA_JOKE_CATEGORY]: EMPTY,
  [CLUMSY_MAMA_JOKE_CATEGORY]: EMPTY,
  [EVIL_MAMA_JOKE_CATEGORY]: EMPTY,
  [GREEDY_MAMA_JOKE_CATEGORY]: EMPTY,
  [LAZY_MAMA_JOKE_CATEGORY]: EMPTY,
  [LOUD_MAMA_JOKE_CATEGORY]: EMPTY,
  [ENTITLED_MAMA_JOKE_CATEGORY]: EMPTY,
  [OTHER_MAMA_JOKE_CATEGORY]: EMPTY,
};

/** True when a category has authored prose (so the page renders the rich block). */
export function hasContent(c: Category): boolean {
  return categoryContent[c].body.length > 0;
}
```

- [ ] **Step 2: Typecheck.**

Run: `npx astro check`
Expected: 0 errors (the `Record<Category, …>` is exhaustive — a missing slug would error here).

- [ ] **Step 3: Commit.**

```bash
git add lib/categoryContent.ts
git commit -m "feat(content): add per-category editorial content model + 2 examples"
```

---

### Task 2: Render content block + "Last updated" + dateModified on category pages

**Files:**
- Modify: `src/pages/jokes/[category].astro`
- Modify: `lib/jsonld.ts` (extend `jokeCollectionSchema` with optional `dateModified`)

**Interfaces:**
- Consumes: `categoryContent`, `hasContent` from Task 1.
- Produces: `jokeCollectionSchema` gains an optional `dateModified?: string` field that, when set, emits `dateModified` on the `CollectionPage`.

- [ ] **Step 1: Extend `jokeCollectionSchema` to accept `dateModified`.**

In `lib/jsonld.ts`, change the `jokeCollectionSchema` signature and body:

```typescript
export function jokeCollectionSchema(opts: {
  name: string;
  description: string;
  path: string;
  jokes: string[];
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    isPartOf: { "@id": `${SITE_URL}/#website` },
    primaryImageOfPage: DEFAULT_OG_IMAGE,
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: opts.jokes.length,
      itemListElement: opts.jokes.map((joke, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "CreativeWork",
          "@id": `${absoluteUrl(opts.path)}#joke-${i + 1}`,
          name: `${opts.name} #${i + 1}`,
          text: joke,
          genre: "Yo Mama Joke",
        },
      })),
    },
  };
}
```

- [ ] **Step 2: Wire content into `[category].astro`.** Add imports and render the rich block + last-updated. Replace the frontmatter import block and the `jsonLd` / template as shown.

Add to the imports at the top of the frontmatter:

```typescript
import { categoryContent, hasContent } from "@/lib/categoryContent";
```

After the existing `const ogImage = ...` line add:

```typescript
const content = categoryContent[cat];
const showContent = hasContent(cat);
const lastUpdated = new Date(content.updated + "T00:00:00Z").toLocaleDateString(
  "en-US",
  { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" },
);
```

In the `jokeCollectionSchema({ ... })` call, add `dateModified: content.updated,` after the `jokes,` line.

In the template, replace the block from `<p class="site-lede">{pageDescription}</p>` down to just before `<div class="site-feed">` with:

```astro
      <p class="site-lede">{pageDescription}</p>

      {
        showContent && (
          <section class="site-prose site-answer">
            <h2>{content.question}</h2>
            <p class="site-answer__lead">{content.directAnswer}</p>
            {content.body.map((para) => (
              <p>{para}</p>
            ))}
            {content.citations.length > 0 && (
              <p class="site-citations">
                Sources:{" "}
                {content.citations.map((c, i) => (
                  <>
                    {i > 0 && ", "}
                    <a href={c.href} target="_blank" rel="noopener noreferrer">
                      {c.label}
                    </a>
                  </>
                ))}
              </p>
            )}
            <p class="site-updated">Last updated: {lastUpdated}</p>
          </section>
        )
      }
```

- [ ] **Step 3: Typecheck + build.**

Run: `npx astro check && npx astro build`
Expected: clean; build succeeds.

- [ ] **Step 4: Verify the written categories render the block and others don't.**

Run: `grep -c "site-answer" dist/jokes/fat-yo-mama-jokes/index.html && grep -c "site-answer" dist/jokes/old-yo-mama-jokes/index.html || true`
Expected: `1` for fat (written), `0` for old (empty scaffold).

Run: `grep -o "dateModified" dist/jokes/fat-yo-mama-jokes/index.html | head -1`
Expected: `dateModified` present.

- [ ] **Step 5: Commit.**

```bash
git add src/pages/jokes/[category].astro lib/jsonld.ts
git commit -m "feat(content): render answer-first content block + dateModified on category pages"
```

---

### Task 3: About, Contact, Terms pages + nav/footer links

**Files:**
- Create: `src/pages/about.astro`
- Create: `src/pages/contact.astro`
- Create: `src/pages/terms.astro`
- Modify: `layouts/Layout.astro` (header nav + footer nav links)

**Interfaces:**
- Consumes: `Layout`, `SITE_NAME`, `CONTACT_EMAIL` from `@/lib/siteConfig`.

- [ ] **Step 1: Create `src/pages/about.astro`.**

```astro
---
import Layout from "@/layouts/Layout.astro";
import { SITE_NAME } from "@/lib/siteConfig";

const title = `About | ${SITE_NAME}`;
const description =
  "About Yo Mama Jokes Central — who we are, how we curate our jokes, and the comedy tradition behind them.";
---

<Layout title={title} description={description} path="/about">
  <div class="site-page container mx-auto px-4 py-8">
    <div class="site-inner site-prose">
      <h1 class="site-title">About Yo Mama Jokes Central</h1>
      <p>
        Yo Mama Jokes Central is a curated home for the classic insult-comedy
        one-liner known as the "yo mama" joke. Every joke in our collection is
        hand-reviewed and sorted into one of 21 themed categories so you can
        always find the right comeback for the moment.
      </p>
      <h2>How we curate</h2>
      <p>
        We read every joke before it goes live. We keep the lighthearted ones
        front and center, label adult material clearly, and refresh a featured
        set of five jokes every single day. Our goal is simple: the funniest,
        cleanest-organized yo mama jokes on the web.
      </p>
      <h2>The tradition behind the jokes</h2>
      <p>
        Yo mama jokes grew out of "the dozens," a centuries-old game of
        competitive, witty insult-trading. The point was never cruelty — it was
        quick thinking, wordplay, and staying cool under pressure. We carry that
        spirit forward: playful exaggeration meant to make everyone, including
        the target, laugh.
      </p>
      <p>
        Questions or suggestions? Visit our <a href="/contact">contact page</a>.
      </p>
    </div>
  </div>
</Layout>
```

- [ ] **Step 2: Create `src/pages/contact.astro`.**

```astro
---
import Layout from "@/layouts/Layout.astro";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/siteConfig";

const title = `Contact | ${SITE_NAME}`;
const description =
  "Get in touch with Yo Mama Jokes Central — joke submissions, corrections, and general questions.";
---

<Layout title={title} description={description} path="/contact">
  <div class="site-page container mx-auto px-4 py-8">
    <div class="site-inner site-prose">
      <h1 class="site-title">Contact Us</h1>
      <p>
        We'd love to hear from you — whether you've got a joke to submit, spotted
        something that needs fixing, or just want to say hello.
      </p>
      <p>
        Email us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We read every
        message and aim to reply within a few business days.
      </p>
      <p>
        For how we handle your data, see our{" "}
        <a href="/privacy-policy">Privacy Policy</a>.
      </p>
    </div>
  </div>
</Layout>
```

- [ ] **Step 3: Create `src/pages/terms.astro`.**

```astro
---
import Layout from "@/layouts/Layout.astro";
import { SITE_NAME } from "@/lib/siteConfig";

const title = `Terms of Use | ${SITE_NAME}`;
const description =
  "The terms governing your use of Yo Mama Jokes Central.";
const year = new Date().getFullYear();
---

<Layout title={title} description={description} path="/terms">
  <div class="site-page container mx-auto px-4 py-8">
    <div class="site-inner site-prose">
      <h1 class="site-title">Terms of Use</h1>
      <p>Last updated: January 1, {year}.</p>
      <h2>Acceptance</h2>
      <p>
        By using Yo Mama Jokes Central ("the site"), you agree to these terms. If
        you do not agree, please do not use the site.
      </p>
      <h2>Content and intended use</h2>
      <p>
        All content is provided for entertainment purposes only. Yo mama jokes
        are playful exaggerations and are not statements of fact about any real
        person. Some categories contain adult humor and are labelled as such;
        you are responsible for choosing what you read.
      </p>
      <h2>Intellectual property</h2>
      <p>
        The site's design, branding, and original written content are owned by
        Yo Mama Jokes Central. You may share individual jokes; you may not
        scrape or republish the collection wholesale.
      </p>
      <h2>Disclaimer</h2>
      <p>
        The site is provided "as is" without warranties of any kind. We are not
        liable for any damages arising from your use of the site.
      </p>
      <h2>Changes</h2>
      <p>
        We may update these terms from time to time. Continued use after a change
        constitutes acceptance of the revised terms.
      </p>
    </div>
  </div>
</Layout>
```

- [ ] **Step 4: Add links in `layouts/Layout.astro`.** In the header `<nav>` add an About link before Contact; in the footer `<nav>` add About and Terms. Replace the header nav block:

```astro
          <nav class="site-nav space-x-6">
            <a href="/" class="site-nav-link">Home</a>
            <a href="/categories" class="site-nav-link">Categories</a>
            <a href="/about" class="site-nav-link">About</a>
            <a href="/contact" class="site-nav-link">Contact</a>
          </nav>
```

And replace the footer `<nav>` block:

```astro
        <nav class="site-nav space-x-6 mb-3">
          <a href="/categories" class="site-nav-link">Categories</a>
          <a href="/about" class="site-nav-link">About</a>
          <a href="/contact" class="site-nav-link">Contact</a>
          <a href="/privacy-policy" class="site-nav-link">Privacy Policy</a>
          <a href="/terms" class="site-nav-link">Terms</a>
        </nav>
```

Note: the header Contact link changes from a `mailto:` to the `/contact` page (the contact page itself surfaces the email).

- [ ] **Step 5: Build + verify pages exist and are linked.**

Run: `npx astro build && ls dist/about/index.html dist/contact/index.html dist/terms/index.html`
Expected: all three exist.

Run: `grep -c 'href="/about"' dist/index.html`
Expected: `≥1`.

- [ ] **Step 6: Commit.**

```bash
git add src/pages/about.astro src/pages/contact.astro src/pages/terms.astro layouts/Layout.astro
git commit -m "feat(trust): add About, Contact, Terms pages + nav/footer links"
```

---

### Task 4: Fix the duplicate-`<h2>` bug in `JokeCard`

**Files:**
- Modify: `components/JokeCard.astro`
- Modify: `src/pages/index.astro` (pass `showCategoryLabel`)

**Interfaces:**
- Produces: `JokeCard` gains an optional prop `showCategoryLabel?: boolean` (default `false`). When true it renders the category as a non-heading `<span>` link; when false it renders no category label.

- [ ] **Step 1: Rewrite `components/JokeCard.astro` to drop the `<h2>`.**

```astro
---
import SocialShareButtons from "@/components/SocialShareButtons.astro";
import { SITE_URL } from "@/lib/siteConfig";

interface Props {
  jokeText: string;
  categorySlug: string;
  categoryName?: string;
  /** Show the category as a small label (used on the mixed homepage feed). */
  showCategoryLabel?: boolean;
}

const {
  jokeText,
  categorySlug,
  categoryName,
  showCategoryLabel = false,
} = Astro.props;

const baseUrl = import.meta.env.PUBLIC_WEBSITE_URL || SITE_URL;
const jokeUrl = `${baseUrl}/jokes/${categorySlug}`;
const displayCategoryName =
  categoryName || categorySlug.replace(/-yo-mama-jokes$/, "").replace(/-/g, " ");
---

<div class="joke-card">
  <div class="joke-card__body">
    {
      showCategoryLabel && (
        <span class="joke-card__category capitalize">
          <a href={`/jokes/${categorySlug}`}>{displayCategoryName}</a>
        </span>
      )
    }
    <p class="joke-card__text">{jokeText}</p>
  </div>
  <div class="joke-card__footer">
    <SocialShareButtons jokeText={jokeText} jokeUrl={jokeUrl} />
  </div>
</div>
```

- [ ] **Step 2: On the homepage, opt into the label.** In `src/pages/index.astro`, change the JokeCard usage:

```astro
          featuredJokes.map(({ category, joke }) => (
            <JokeCard jokeText={joke} categorySlug={category} showCategoryLabel />
          ))
```

(The `[category].astro` usage stays as-is — no label, since the `<h1>` already names the category.)

- [ ] **Step 3: Add minimal styling for the new label.** In `styles/globals.css`, append:

```css
.joke-card__category {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.7;
  margin-bottom: 0.5rem;
}
.joke-card__category a {
  color: inherit;
  text-decoration: none;
}
.joke-card__category a:hover {
  text-decoration: underline;
}
```

- [ ] **Step 4: Build + verify no stray `<h2>` on a category page.**

Run: `npx astro build && grep -o "<h2" dist/jokes/fat-yo-mama-jokes/index.html | wc -l`
Expected: `2` — the answer-block question heading (Task 2) + the single FAQ heading from `Faq.astro`. The dozens of `JokeCard` `<h2>`s are gone. (`Faq.astro` emits exactly one `<h2>`; FAQ questions are `<summary>`, not headings.) For an empty-content category: `grep -o "<h2" dist/jokes/old-yo-mama-jokes/index.html | wc -l` → `1` (no content block, no card headings — just the FAQ heading). The pass condition is "small and intentional," not the dozens that existed before.

Run: `grep -c "joke-card__category" dist/index.html`
Expected: `≥1` (homepage shows labels).

- [ ] **Step 5: Commit.**

```bash
git add components/JokeCard.astro src/pages/index.astro styles/globals.css
git commit -m "fix(seo): demote per-card category H2 to a label; keep one H1 per category page"
```

---

### Task 5: Visible breadcrumb on category pages

**Files:**
- Create: `components/Breadcrumb.astro`
- Modify: `src/pages/jokes/[category].astro`

**Interfaces:**
- Produces: `Breadcrumb` component with prop `items: { name: string; href?: string }[]`; the last item is rendered as plain text (current page), earlier items as links. The order/labels must match the `breadcrumbSchema([...])` already emitted on the page.

- [ ] **Step 1: Create `components/Breadcrumb.astro`.**

```astro
---
interface Props {
  items: { name: string; href?: string }[];
}
const { items } = Astro.props;
---

<nav class="site-breadcrumb" aria-label="Breadcrumb">
  <ol>
    {
      items.map((item, i) => (
        <li>
          {item.href && i < items.length - 1 ? (
            <a href={item.href}>{item.name}</a>
          ) : (
            <span aria-current="page">{item.name}</span>
          )}
          {i < items.length - 1 && <span class="site-breadcrumb__sep">/</span>}
        </li>
      ))
    }
  </ol>
</nav>
```

- [ ] **Step 2: Add breadcrumb styles.** Append to `styles/globals.css`:

```css
.site-breadcrumb ol {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
  font-size: 0.85rem;
  opacity: 0.8;
}
.site-breadcrumb li {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}
.site-breadcrumb__sep {
  opacity: 0.5;
}
```

- [ ] **Step 3: Render it in `[category].astro`.** Add the import:

```typescript
import Breadcrumb from "@/components/Breadcrumb.astro";
```

In the template, immediately inside `<div class="site-inner site-inner--center">` (before the `<h1>`), add:

```astro
      <Breadcrumb
        items={[
          { name: "Home", href: "/" },
          { name: "Categories", href: "/categories" },
          { name: pageTitle },
        ]}
      />
```

- [ ] **Step 4: Build + verify the visible trail matches the schema.**

Run: `npx astro build && grep -c "site-breadcrumb" dist/jokes/fat-yo-mama-jokes/index.html`
Expected: `≥1`.

Run: `grep -o "BreadcrumbList" dist/jokes/fat-yo-mama-jokes/index.html | head -1`
Expected: `BreadcrumbList` (schema still present; labels Home/Categories/<title> now have a matching visible trail).

- [ ] **Step 5: Commit.**

```bash
git add components/Breadcrumb.astro src/pages/jokes/[category].astro styles/globals.css
git commit -m "feat(seo): add visible breadcrumb matching BreadcrumbList schema on category pages"
```

---

### Task 6: Honest per-page sitemap `lastmod`

**Files:**
- Create: `scripts/lastmod.mjs`
- Modify: `astro.config.mjs`

**Interfaces:**
- Produces: `scripts/lastmod.mjs` exports `export function lastmodForUrl(url)` returning an ISO datetime string or `undefined`. Maps a built URL to the git commit date of its source file. Used by `@astrojs/sitemap`'s `serialize`.

- [ ] **Step 1: Create `scripts/lastmod.mjs`.**

```javascript
// Resolve an honest <lastmod> per URL from git history, so we never stamp a
// single flat build date across every page (Google distrusts uniform lastmods).
// - /jokes/<slug>           -> git mtime of jokes/<short>.ts (when jokes changed)
// - /, /categories, /about… -> git mtime of the page's .astro source
// - homepage "/"            -> today (the daily featured set genuinely rotates)
import { execSync } from "node:child_process";

const SITE = "https://www.yomamajokescentral.com";

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
```

- [ ] **Step 2: Wire `serialize` into the sitemap integration in `astro.config.mjs`.** Add the import near the top:

```javascript
import { lastmodForUrl } from "./scripts/lastmod.mjs";
```

Replace `integrations: [sitemap()],` with:

```javascript
  integrations: [
    sitemap({
      serialize(item) {
        const lastmod = lastmodForUrl(item.url);
        if (lastmod) item.lastmod = lastmod;
        else delete item.lastmod; // omit rather than emit a flat/untrustworthy date
        return item;
      },
    }),
  ],
```

- [ ] **Step 3: Build + verify lastmods differ per page.**

Run: `npx astro build && grep -o "<lastmod>[^<]*</lastmod>" dist/sitemap-0.xml | sort -u | wc -l`
Expected: `≥2` (more than one distinct date — not a single flat value). If it's `1`, the git dates aren't resolving; check that the build runs inside the git repo.

- [ ] **Step 4: Commit.**

```bash
git add scripts/lastmod.mjs astro.config.mjs
git commit -m "fix(seo): emit honest per-page sitemap lastmod from git history"
```

---

### Task 7: Security headers, cache-control, host redirect (`vercel.json`)

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Replace `vercel.json` with headers + immutable asset cache + apex→www redirect.**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "astro",
  "buildCommand": "astro build",
  "outputDirectory": "dist",
  "redirects": [
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "yomamajokescentral.com" }],
      "destination": "https://www.yomamajokescentral.com/:path*",
      "permanent": true
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/_astro/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

Note: no `Content-Security-Policy` here — the cookbook (§11) says author CSP *last*, once CMP + AdSense + GA origins are final; an over-strict CSP silently breaks ads. Deferred to ad-launch.

- [ ] **Step 2: Validate JSON.**

Run: `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 3: Commit.**

```bash
git add vercel.json
git commit -m "feat(seo): add security headers, immutable asset cache, apex->www 301"
```

---

### Task 8: Inert ad layer behind `ADS_ENABLED`

**Files:**
- Modify: `lib/siteConfig.ts` (add `ADS_ENABLED`, `ADULT_CATEGORIES`)
- Create: `components/AdSlot.astro`
- Modify: `layouts/Layout.astro` (gate loader on the flag)
- Modify: `src/pages/jokes/[category].astro` (place a slot + adult flag)

**Interfaces:**
- Produces: `export const ADS_ENABLED = false`, `export const ADULT_CATEGORIES: string[]` in `siteConfig`. `AdSlot.astro` props: `{ slot?: string; minHeight?: number; adult?: boolean }` — always reserves height; emits the `<ins>` only when `ADS_ENABLED && !adult`.

- [ ] **Step 1: Add flags to `lib/siteConfig.ts`.** Append:

```typescript
// Master switch for advertising. Keep FALSE until the content bar is met and
// AdSense approves. When false: no loader script, no <ins> units render — but
// AdSlot still reserves layout height so enabling ads causes no CLS shift.
export const ADS_ENABLED = false;

// Adult-flagged categories excluded from ad rendering even when ADS_ENABLED is
// true (AdSense policy risk — see MASTER_SEO_COOKBOOK §9 / §17.3).
export const ADULT_CATEGORIES = ["dirty-yo-mama-jokes", "nasty-yo-mama-jokes"];
```

- [ ] **Step 2: Create `components/AdSlot.astro`.**

```astro
---
import { ADS_ENABLED, ADSENSE_CLIENT } from "@/lib/siteConfig";

interface Props {
  /** AdSense ad-unit slot id (set when you create the unit). */
  slot?: string;
  /** Reserved height in px to prevent CLS. */
  minHeight?: number;
  /** When true, never render an ad here (adult category). */
  adult?: boolean;
}

const { slot = "", minHeight = 280, adult = false } = Astro.props;
const renderAd = ADS_ENABLED && !adult;
---

<div
  class="ad-slot"
  style={`min-height:${minHeight}px`}
  aria-hidden="true"
  data-ad-placeholder={renderAd ? undefined : "true"}
>
  {
    renderAd && (
      <ins
        class="adsbygoogle"
        style="display:block"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    )
  }
</div>
```

- [ ] **Step 3: Gate the AdSense loader in `layouts/Layout.astro`.** Add the import to the frontmatter:

```typescript
import { ADSENSE_CLIENT, ADS_ENABLED } from "@/lib/siteConfig";
```

Change the loader condition from `import.meta.env.PROD && (` to:

```astro
      import.meta.env.PROD && ADS_ENABLED && (
```

- [ ] **Step 4: Place one slot on category pages + pass the adult flag.** In `src/pages/jokes/[category].astro` add the imports:

```typescript
import AdSlot from "@/components/AdSlot.astro";
import { ADULT_CATEGORIES } from "@/lib/siteConfig";
```

After `const showContent = ...` add:

```typescript
const isAdult = ADULT_CATEGORIES.includes(cat);
```

In the template, between the `<Faq … />` and the closing `</div>` of `site-inner`, add:

```astro
      <AdSlot adult={isAdult} minHeight={280} />
```

- [ ] **Step 5: Build + verify NO ad code ships while disabled.**

Run: `npx astro build`
Run: `grep -rc "adsbygoogle" dist/ | grep -v ':0' || echo "NO ADSBYGOOGLE — correct"`
Expected: `NO ADSBYGOOGLE — correct` (loader gated off, `<ins>` not rendered).

Run: `grep -c "ad-slot" dist/jokes/fat-yo-mama-jokes/index.html`
Expected: `≥1` (reserved height present).

- [ ] **Step 6: Commit.**

```bash
git add lib/siteConfig.ts components/AdSlot.astro layouts/Layout.astro src/pages/jokes/[category].astro
git commit -m "feat(ads): add inert ad layer behind ADS_ENABLED with adult-category exclusion"
```

---

### Task 9: Real logo + favicon/manifest set + Organization schema enrichment

**Files:**
- Create: `public/logo.svg`
- Create: `public/favicon.svg`
- Create: `public/og/logo-512.png` (generated)
- Create: `public/apple-touch-icon.png` (180×180, generated)
- Create: `public/site.webmanifest`
- Modify: `lib/siteConfig.ts` (add `LOGO_URL`, `SAME_AS`)
- Modify: `lib/jsonld.ts` (logo as ImageObject + contactPoint + sameAs)
- Modify: `layouts/Layout.astro` (header img + icon links + manifest)

**Interfaces:**
- Produces: `export const LOGO_URL = \`${SITE_URL}/logo.svg\``, `export const SAME_AS: string[] = []` in `siteConfig`. `organizationSchema()` emits `logo` as `ImageObject` (≥112×112), `contactPoint`, and `sameAs` (omitted when empty).

- [ ] **Step 1: Create `public/logo.svg` (square, ≥112×112, simple brand mark).**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="Yo Mama Jokes Central">
  <rect width="512" height="512" rx="96" fill="#259be2"/>
  <text x="256" y="210" font-family="Fredoka, system-ui, sans-serif" font-size="150" font-weight="700" fill="#ffffff" text-anchor="middle">YO</text>
  <text x="256" y="350" font-family="Fredoka, system-ui, sans-serif" font-size="150" font-weight="700" fill="#ffd23f" text-anchor="middle">MAMA</text>
  <text x="256" y="450" font-family="Fredoka, system-ui, sans-serif" font-size="58" font-weight="600" fill="#ffffff" text-anchor="middle" letter-spacing="6">JOKES</text>
</svg>
```

- [ ] **Step 2: Create `public/favicon.svg`** (compact mark for tabs):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="YMJ">
  <rect width="64" height="64" rx="14" fill="#259be2"/>
  <text x="32" y="44" font-family="system-ui, sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">Y</text>
</svg>
```

- [ ] **Step 3: Rasterize the PNGs from `logo.svg`.** Use one-off `npx` (no new dependency added to package.json):

```bash
npx --yes sharp-cli@latest -i public/logo.svg -o public/og/logo-512.png resize 512 512
npx --yes sharp-cli@latest -i public/logo.svg -o public/apple-touch-icon.png resize 180 180
```

Expected: both PNGs created. Verify: `ls -l public/og/logo-512.png public/apple-touch-icon.png` → non-zero sizes. (If `sharp-cli` is unavailable offline, fall back to: open `logo.svg` in any tool and export 512×512 and 180×180 PNGs to those paths.)

- [ ] **Step 4: Create `public/site.webmanifest`.**

```json
{
  "name": "Yo Mama Jokes Central",
  "short_name": "Yo Mama Jokes",
  "description": "The funniest Yo Mama Jokes online, across 21 categories.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#259be2",
  "icons": [
    { "src": "/og/logo-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/og/logo-512.png", "sizes": "192x192", "type": "image/png" },
    {
      "src": "/og/logo-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

- [ ] **Step 5: Add `LOGO_URL` + `SAME_AS` to `lib/siteConfig.ts`.** Append:

```typescript
// Square brand logo (≥112×112) for Organization schema + header. SVG is an
// accepted Google-Images format (cookbook X2); a raster 512 PNG also exists.
export const LOGO_URL = `${SITE_URL}/logo.svg`;

// Off-site profiles for Organization.sameAs (entity disambiguation / GEO).
// Populate as social accounts are created; emitted only when non-empty.
export const SAME_AS: string[] = [];
```

- [ ] **Step 6: Enrich `organizationSchema()` in `lib/jsonld.ts`.** Update the import line and the function:

```typescript
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  LOGO_URL,
  SAME_AS,
  CONTACT_EMAIL,
  absoluteUrl,
} from "./siteConfig";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: LOGO_URL,
      width: 512,
      height: 512,
    },
    description: SITE_DESCRIPTION,
    contactPoint: {
      "@type": "ContactPoint",
      email: CONTACT_EMAIL,
      contactType: "customer support",
    },
    ...(SAME_AS.length ? { sameAs: SAME_AS } : {}),
  };
}
```

- [ ] **Step 7: Update header img + icon links in `layouts/Layout.astro`.** Replace the two icon `<link>`s:

```astro
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
```

Replace the header logo `<img>`:

```astro
            <img
              src="/logo.svg"
              alt="Yo Mama Jokes Central"
              class="w-[70px] h-[70px]"
              width="70"
              height="70"
            />
```

- [ ] **Step 8: Build + verify.**

Run: `npx astro check && npx astro build`
Run: `grep -o '"logo":{"@type":"ImageObject"' dist/index.html | head -1`
Expected: present (logo is now an ImageObject, not `favicon.ico`).

Run: `ls dist/logo.svg dist/favicon.svg dist/apple-touch-icon.png dist/site.webmanifest`
Expected: all present.

- [ ] **Step 9: Commit.**

```bash
git add public/logo.svg public/favicon.svg public/og/logo-512.png public/apple-touch-icon.png public/site.webmanifest lib/siteConfig.ts lib/jsonld.ts layouts/Layout.astro
git commit -m "feat(seo): real logo + favicon/manifest set + richer Organization schema"
```

---

### Task 10: Fix share buttons (drop no-op IG/TikTok, add Copy link)

**Files:**
- Modify: `components/SocialShareButtons.astro`
- Modify: `src/pages/index.astro` (the HOME_FAQ answer mentioning Instagram/TikTok)

**Interfaces:**
- Produces: share row with working Facebook + X links and a "Copy link" button (Clipboard API). No Instagram/TikTok web-share links (they are no-ops).

- [ ] **Step 1: Rewrite `components/SocialShareButtons.astro`.** Keep the Facebook and X anchors exactly as they are; remove the Instagram and TikTok anchors; add a copy-link button after the X anchor and a small inline script.

Replace the whole file:

```astro
---
interface Props {
  jokeText: string;
  jokeUrl: string;
}

const { jokeText, jokeUrl } = Astro.props;

const text = encodeURIComponent(jokeText);
const url = encodeURIComponent(jokeUrl);

const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
const twitterShareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
---

<div class="w-full content-between space-x-3">
  <a
    href={facebookShareUrl}
    target="_blank"
    rel="noopener noreferrer"
    class="social-icon-button facebook-button text-blue-700 hover:text-blue-900 transition-colors duration-200"
  >
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"></path>
    </svg>
    <span class="sr-only">Share on Facebook</span>
  </a>

  <a
    href={twitterShareUrl}
    target="_blank"
    rel="noopener noreferrer"
    class="social-icon-button twitter-button text-neutral-800 hover:text-black transition-colors duration-200"
  >
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
    </svg>
    <span class="sr-only">Share on X (Twitter)</span>
  </a>

  <button
    type="button"
    class="social-icon-button copy-link-button text-neutral-700 hover:text-neutral-900 transition-colors duration-200"
    data-copy-url={jokeUrl}
  >
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
    <span class="sr-only">Copy link</span>
  </button>
</div>

<script is:inline>
  document.querySelectorAll(".copy-link-button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var u = btn.getAttribute("data-copy-url");
      if (navigator.clipboard && u) {
        navigator.clipboard.writeText(u).then(function () {
          btn.classList.add("copied");
          setTimeout(function () {
            btn.classList.remove("copied");
          }, 1200);
        });
      }
    });
  });
</script>
```

- [ ] **Step 2: Fix the stale homepage FAQ answer.** In `src/pages/index.astro`, change the share-FAQ `answer` (the one mentioning "Instagram, and TikTok") to:

```typescript
    answer:
      "Yes! Every joke card includes one-click buttons to share on Facebook and X (Twitter), plus a copy-link button so you can paste a joke anywhere.",
```

- [ ] **Step 3: Build + verify the no-ops are gone.**

Run: `npx astro build`
Run: `grep -c "tiktok.com/upload\|instagram.com/?url" dist/jokes/fat-yo-mama-jokes/index.html || echo 0`
Expected: `0`.

Run: `grep -c "copy-link-button" dist/jokes/fat-yo-mama-jokes/index.html`
Expected: `≥1`.

- [ ] **Step 4: Commit.**

```bash
git add components/SocialShareButtons.astro src/pages/index.astro
git commit -m "fix(share): drop no-op Instagram/TikTok web-share; add copy-link"
```

---

### Task 11: Preconnect to ad/analytics origins

**Files:**
- Modify: `layouts/Layout.astro`

- [ ] **Step 1: Add preconnect/dns-prefetch hints in `<head>`.** Immediately after the `<meta name="theme-color" …>` line in `layouts/Layout.astro`, add:

```astro
    <link rel="preconnect" href="https://www.googletagmanager.com" />
    <link rel="preconnect" href="https://www.google-analytics.com" />
    <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
    <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
```

- [ ] **Step 2: Build + verify.**

Run: `npx astro build && grep -c "preconnect" dist/index.html`
Expected: `≥3`.

- [ ] **Step 3: Commit.**

```bash
git add layouts/Layout.astro
git commit -m "perf(seo): preconnect to analytics/ad origins"
```

---

### Task 12: Nightly Deploy-Hook rebuild (makes "daily" real)

**Files:**
- Create: `.github/workflows/daily-rebuild.yml`
- Modify: `README.md` (document the Deploy Hook secret setup)

**Interfaces:**
- Consumes: a repo secret `VERCEL_DEPLOY_HOOK_URL` (a Vercel Deploy Hook URL the owner creates).

- [ ] **Step 1: Create `.github/workflows/daily-rebuild.yml`.**

```yaml
name: Daily rebuild

# Triggers a Vercel deploy once a day so the date-seeded "joke of the day"
# picker rotates and sitemap lastmod for "/" advances. Vercel rebuilds the
# static site; no serverless function is needed.
on:
  schedule:
    - cron: "10 5 * * *" # 05:10 UTC daily
  workflow_dispatch: {}

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Vercel Deploy Hook
        run: |
          if [ -z "${{ secrets.VERCEL_DEPLOY_HOOK_URL }}" ]; then
            echo "VERCEL_DEPLOY_HOOK_URL secret is not set" >&2
            exit 1
          fi
          curl -fsS -X POST "${{ secrets.VERCEL_DEPLOY_HOOK_URL }}"
```

- [ ] **Step 2: Document the setup in `README.md`.** Append a section:

```markdown
## Daily rebuild (Vercel Deploy Hook)

The "joke of the day" rotates by UTC date at build time, so the site must
rebuild daily. A GitHub Actions workflow (`.github/workflows/daily-rebuild.yml`)
POSTs a Vercel Deploy Hook every morning.

Setup (one time):
1. Vercel → Project → Settings → Git → **Deploy Hooks** → create a hook on the
   production branch. Copy the URL.
2. GitHub → repo → Settings → Secrets and variables → Actions → **New secret**
   named `VERCEL_DEPLOY_HOOK_URL`, paste the URL.
3. Optionally run the workflow once via **Actions → Daily rebuild → Run workflow**
   to confirm it triggers a deploy.
```

- [ ] **Step 3: Validate the workflow YAML.**

Run: `node -e "const y=require('fs').readFileSync('.github/workflows/daily-rebuild.yml','utf8'); if(!y.includes('VERCEL_DEPLOY_HOOK_URL')) throw new Error('missing secret ref'); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 4: Commit.**

```bash
git add .github/workflows/daily-rebuild.yml README.md
git commit -m "feat(ops): nightly Vercel deploy-hook rebuild for daily joke rotation"
```

---

### Task 13: Measurement hedges — Bing verification, IndexNow, GEO docs

**Files:**
- Modify: `layouts/Layout.astro` (Bing verification meta — placeholder)
- Create: `public/indexnow.txt` (key file — placeholder content)
- Create: `docs/seo/measurement.md`

**Interfaces:**
- Produces: documented, low-priority hedges. The Bing token and IndexNow key are owner-supplied; placeholders are clearly marked so they are not mistaken for live values.

- [ ] **Step 1: Add a Bing verification meta placeholder in `layouts/Layout.astro`.** After the existing `google-site-verification` meta, add:

```astro
    {/* Bing Webmaster Tools — replace REPLACE_WITH_BING_TOKEN after verifying
        the site at https://www.bing.com/webmasters (gateway to Copilot). */}
    <meta name="msvalidate.01" content="REPLACE_WITH_BING_TOKEN" />
```

- [ ] **Step 2: Create `public/indexnow.txt`.** The filename must equal the key once issued; placeholder for now:

```text
REPLACE_WITH_INDEXNOW_KEY
```

- [ ] **Step 3: Create `docs/seo/measurement.md`.**

```markdown
# Measurement & GEO tracking

## Search consoles
- Google Search Console: verified via `google-site-verification` meta in Layout.
  Submit `https://www.yomamajokescentral.com/sitemap-index.xml`.
- Bing Webmaster Tools: verify the site, paste the token into the
  `msvalidate.01` meta in `layouts/Layout.astro`. Bing feeds Microsoft Copilot.

## IndexNow (Bing/Yandex/Seznam/Naver/Yep/IA/Amazon — NOT Google)
1. Generate a key at https://www.indexnow.org, rename `public/indexnow.txt` to
   `<key>.txt` and put the key as its contents (and update the placeholder).
2. On deploy, POST changed URLs:
   `curl "https://api.indexnow.org/indexnow?url=<URL>&key=<KEY>"`.
   Low priority for this static site; the daily rebuild is enough for now.

## GA4 — AI referral segmentation (GEO)
In GA4, create a segment / exploration filtered by session source containing
`chatgpt`, `perplexity`, or `gemini` to track AI-answer-engine referrals.

## Monthly citation audit
Once a month, run these fixed prompts in ChatGPT / Perplexity / Gemini and note
whether yomamajokescentral.com is cited:
- "best yo mama jokes website"
- "funny fat yo mama jokes"
- "what is a yo mama joke"
Record date + which engines cited us. This is the only way GEO progress is
visible.
```

- [ ] **Step 4: Build + verify (placeholders must NOT look live).**

Run: `npx astro build && grep -c "msvalidate.01" dist/index.html`
Expected: `1`.

Run: `grep -c "REPLACE_WITH" dist/index.html public/indexnow.txt`
Expected: both show the placeholder is present (a reminder it still needs the real token/key before it does anything).

- [ ] **Step 5: Commit.**

```bash
git add layouts/Layout.astro public/indexnow.txt docs/seo/measurement.md
git commit -m "docs(seo): add Bing/IndexNow placeholders + GEO measurement guide"
```

---

## Final verification (after all tasks)

- [ ] `npx astro check` — 0 errors.
- [ ] `npx astro build` — succeeds.
- [ ] `grep -rc "adsbygoogle" dist/ | grep -v ':0'` — **no matches** (ads stay off).
- [ ] Each category page: exactly one `<h1>`; no per-card `<h2>` category labels.
- [ ] Sitemap `lastmod` values are not all identical.
- [ ] About / Contact / Terms reachable and linked from the footer.
- [ ] JSON-LD validates at https://validator.schema.org (paste a category page's `<script type="application/ld+json">` blocks).
- [ ] Confirm the owner's follow-ups are recorded: (1) write the 19 remaining category bodies in `lib/categoryContent.ts`; (2) create the Vercel Deploy Hook + `VERCEL_DEPLOY_HOOK_URL` secret; (3) supply Bing token + IndexNow key; (4) at ad-launch, set `ADS_ENABLED = true`, create AdSense ad units (real `slot` ids), and switch the consent banner to Google's certified "Privacy & messaging" CMP.

## Self-review notes (coverage vs spec)

- Spec A (content model + 2 examples, render, last-updated, dateModified, About/Contact/Terms) → Tasks 1, 2, 3. ✅
- Spec B (h2 fix, breadcrumb, honest lastmod, vercel headers) → Tasks 4, 5, 6, 7. ✅
- Spec C (daily cron) → Task 12. ✅
- Spec D (ADS_ENABLED, AdSlot, loader gate, adult exclusion, CMP doc) → Task 8 (+ CMP swap in final checklist). ✅
- Spec E (logo/favicon/manifest, Organization enrich, share fix, preconnect) → Tasks 9, 10, 11. ✅
- Spec F (Bing, IndexNow, measurement docs) → Task 13. ✅
