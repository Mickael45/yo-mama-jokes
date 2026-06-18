import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const root = fileURLToPath(new URL("./", import.meta.url));

// https://astro.build/config
export default defineConfig({
  // Canonical apex domain. Used for absolute URLs, the sitemap, and <Seo>.
  site: "https://yomamajokescentral.com",
  trailingSlash: "never",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // "@/..." -> repo root. Regex-scoped so it never matches "@astrojs/*".
      alias: [{ find: /^@\//, replacement: root }],
    },
  },
});
