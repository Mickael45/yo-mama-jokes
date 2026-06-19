import { defineConfig, fontProviders } from "astro/config";
import { fileURLToPath } from "node:url";
import sitemap from "@astrojs/sitemap";
import { lastmodForUrl } from "./scripts/lastmod.mjs";

const root = fileURLToPath(new URL("./", import.meta.url));

// https://astro.build/config
export default defineConfig({
  // Canonical host = www (apex 308-redirects here). Used for absolute URLs,
  // the sitemap, and <Seo>.
  site: "https://www.yomamajokescentral.com",
  trailingSlash: "never",
  // Self-host Fredoka (display) + Nunito (body) via Astro's Fonts API: removes
  // the render-blocking third-party Google Fonts request, adds preload +
  // size-matched fallbacks (better LCP/CLS), and keeps visitor IPs off Google.
  fonts: [
    {
      name: "Fredoka",
      cssVariable: "--font-fredoka",
      provider: fontProviders.google(),
      weights: [400, 600],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      name: "Nunito",
      cssVariable: "--font-nunito",
      provider: fontProviders.google(),
      weights: [400, 600],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "sans-serif"],
    },
  ],
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
  vite: {
    // Tailwind v4 runs via PostCSS (postcss.config.mjs) for compatibility with
    // Astro 6's rolldown bundler.
    resolve: {
      // "@/..." -> repo root. Regex-scoped so it never matches "@astrojs/*".
      alias: [{ find: /^@\//, replacement: root }],
    },
  },
});
