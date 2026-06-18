// Central, single source of truth for site-wide SEO/GEO metadata.
// Canonical host is the bare apex domain (www should 301-redirect here).

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
export const ADSENSE_CLIENT = "ca-pub-3950888851778991";

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
