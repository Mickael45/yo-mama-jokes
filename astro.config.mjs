import { defineConfig, fontProviders } from "astro/config";
import { fileURLToPath } from "node:url";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import pwa from "./scripts/pwa.mjs";

const root = fileURLToPath(new URL("./", import.meta.url));

// https://astro.build/config
export default defineConfig({
  // Canonical host = apex (www 301-redirects here via a Cloudflare Redirect
  // Rule). Used for absolute URLs, the sitemap, and <Seo>.
  site: "https://yomamajokescentral.com",
  trailingSlash: "never",
  // Self-host Anton (display) + Outfit (body) via Astro's Fonts API: removes
  // the render-blocking third-party Google Fonts request, adds preload +
  // size-matched fallbacks (better LCP/CLS), and keeps visitor IPs off Google.
  fonts: [
    {
      name: "Anton",
      cssVariable: "--font-anton",
      provider: fontProviders.google(),
      weights: [400], // Anton ships a single weight
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      name: "Outfit",
      cssVariable: "--font-outfit",
      provider: fontProviders.google(),
      weights: [400, 600, 700, 800],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "sans-serif"],
    },
  ],
  integrations: [
    sitemap(),
    // Generates sw.js (full-offline precache) on build. See scripts/pwa.mjs.
    pwa(),
  ],
  vite: {
    // Tailwind v4 runs via its official Vite plugin (rolldown-vite in Astro 7
    // resolves `@import "tailwindcss"` before a PostCSS plugin could intercept).
    plugins: [tailwindcss()],
    resolve: {
      // "@/..." -> repo root. Regex-scoped so it never matches "@astrojs/*".
      alias: [{ find: /^@\//, replacement: root }],
    },
  },
});
