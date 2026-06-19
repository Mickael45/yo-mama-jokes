# PWA Migration — Design

**Date:** 2026-06-19
**Status:** Approved
**Scope:** Turn the static Astro site into an installable, fully-offline PWA.

## Context

`yo-mama-jokes` is a static Astro 6.4.8 site (rolldown-based Vite 8) deployed on
Vercel. It already ships most PWA prerequisites:

- Valid `public/site.webmanifest` (name, short_name, start_url, `display: standalone`,
  192/512/maskable icons, theme/background colors), linked in `<head>`.
- `apple-touch-icon`, `theme-color` meta, favicons.

The only missing PWA requirement is a **service worker** with a fetch handler
(what makes the browser offer "Install" and enables offline browsing).

## Decisions

- **Offline scope:** Full offline — precache all pages + assets at build time.
- **Install UX:** Browser-default install affordance (no custom button).
- **Implementation:** Hand-rolled, Astro-6-native service worker. `@vite-pwa/astro`
  (latest 1.2.0) caps its peer dependency at Astro 5 and is untested against
  Astro 6 + rolldown-vite, so we avoid it. A small inline integration gives the
  same full-offline result with zero third-party PWA dependency and code we
  control.

## Architecture

Three changes, no new runtime dependencies.

### 1. Inline Astro integration in `astro.config.mjs`

A `pwa()` integration hooking `astro:build:done`:

- Receives emitted `pages` and the output `dir`.
- Builds a **precache manifest**:
  - Every page route URL, normalized to `trailingSlash: "never"` (`''` → `/`,
    `about/` → `/about`).
  - Every hashed asset under `dist/_astro/**` (css, js, woff2) — content-addressed,
    safe to cache-first forever.
  - Site-wide icons/manifest: `/site.webmanifest`, `/favicon.svg`, `/favicon.ico`,
    `/apple-touch-icon.png`, `/og/logo-192.png`, `/og/logo-512.png`.
- Computes a **cache version** = short SHA-256 of the sorted precache list, so the
  cache name changes only when content changes (drives auto-update + old-cache cleanup).
- Writes `dist/sw.js` from a template with the precache list + version baked in.

### 2. Service worker (`dist/sw.js`) behavior

- **install:** `cache.addAll(PRECACHE)` then `skipWaiting()`.
- **activate:** delete caches whose name ≠ current version, then `clients.claim()`.
- **fetch** (GET + same-origin only; everything else — ads, GTM, analytics — falls
  straight through to network):
  - Hashed `/_astro/*` assets → **cache-first** (immutable).
  - Navigations (`request.mode === "navigate"`) → **network-first**, fall back to
    cached page, then to cached `/` as last resort. Keeps content fresh online,
    works offline.
  - Other same-origin GETs → **stale-while-revalidate**.

### 3. Registration + manifest fix

- `Layout.astro`: inject a registration snippet that registers `/sw.js`, **production
  only** (`import.meta.env.PROD`), guarded by `"serviceWorker" in navigator`.
- `public/site.webmanifest`: `theme_color` `#259be2` → `#0c0a13` (match head
  `theme-color`); `background_color` `#ffffff` → `#0c0a13` (no white splash flash).
- `vercel.json`: confirm `/_astro` immutable cache rule doesn't catch `sw.js` (it
  doesn't — `sw.js` is at root). Service worker is served from root with default
  (non-immutable) caching so updates propagate.

## Verification

- `astro build` succeeds.
- `dist/sw.js` exists and contains a non-empty precache list + version.
- Registration snippet present in built HTML.
- Manual: serve `dist/`, confirm SW registers, app is installable, and pages load
  with network disabled.

## Out of scope

Custom install button, push notifications, background sync, periodic sync.
