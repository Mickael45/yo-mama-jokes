// Central, single source of truth for site-wide SEO/GEO metadata.
// Canonical host = apex (portfolio doctrine). www (www.yomamajokescentral.com)
// 301-redirects to the apex in production via a Cloudflare dashboard Redirect
// Rule, so the apex is the URL Google should index; canonical/sitemap/OG match it.
export const SITE_URL = "https://yomamajokescentral.com";
export const SITE_NAME = "Yo Mama Jokes Central";
export const SITE_TAGLINE = "Hilarious Yo Mama Jokes for Everyone";
export const SITE_DESCRIPTION =
  "The funniest Yo Mama Jokes online. Get your fix of hilarious insults and witty comebacks, or browse hundreds of jokes across 21 categories.";

// Twitter / X handle (without the @). Update if the brand handle changes.
export const TWITTER_HANDLE = "";

// Default Open Graph image. Pre-rendered branded 1200x630 PNGs live under
// /public/og (one per category + default.png). Pages may override with a
// category-specific image, e.g. /og/fat-yo-mama-jokes.png.
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og/default.png`;

export const CONTACT_EMAIL = "yomamajokescentral.contact@proton.me";

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
