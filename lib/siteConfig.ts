// Central, single source of truth for site-wide SEO/GEO metadata.
// Canonical host = www; the apex (yomamajokescentral.com) 301/308-redirects to
// www in production.

// Canonical host = www (the apex 308-redirects to www in production, so www
// is the URL Google should index; canonical/sitemap/OG must match it).
export const SITE_URL = "https://www.yomamajokescentral.com";
export const SITE_NAME = "Yo Mama Jokes Central";
export const SITE_TAGLINE = "Hilarious Yo Mama Jokes for Everyone";
export const SITE_DESCRIPTION =
  "The funniest Yo Mama Jokes online. Get your daily dose of hilarious insults and witty comebacks, or browse hundreds of jokes across 21 categories.";

// Twitter / X handle (without the @). Update if the brand handle changes.
export const TWITTER_HANDLE = "";

// Default Open Graph image. Pre-rendered branded 1200x630 PNGs live under
// /public/og (one per category + default.png). Pages may override with a
// category-specific image, e.g. /og/fat-yo-mama-jokes.png.
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og/default.png`;

export const CONTACT_EMAIL = "yomamajokescentral.contact@proton.me";

// Google AdSense publisher ID (matches /public/ads.txt). The loader script in
// the Layout enables Auto Ads site-wide once the account/site is approved.
export const ADSENSE_CLIENT = "ca-pub-6421306327536314";

// Master switch for advertising. Keep FALSE until the content bar is met and
// AdSense approves. When false: no loader script, no <ins> units render — but
// AdSlot still reserves layout height so enabling ads causes no CLS shift.
export const ADS_ENABLED = false;

// Categories excluded from ad rendering even when ADS_ENABLED is true. The
// site is kept AdSense-safe (no adult/explicit content), so nothing is flagged
// today — this list is retained as a lever for any future risky category.
export const ADULT_CATEGORIES: string[] = [];

// Square brand logo (≥112×112) for Organization schema + header. SVG is an
// accepted Google-Images format (cookbook X2); a raster 512 PNG also exists.
export const LOGO_URL = `${SITE_URL}/logo.svg`;

// Off-site profiles for Organization.sameAs (entity disambiguation / GEO).
// Populate as social accounts are created; emitted only when non-empty.
export const SAME_AS: string[] = [];

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
