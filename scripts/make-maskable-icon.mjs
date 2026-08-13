// One-off: render public/og/logo-maskable-512.png from the brand logo.
// Re-run if the logo changes:  node scripts/make-maskable-icon.mjs
//
// A maskable icon is drawn full-bleed and then cut by the OS mask (circle on
// Android, squircle on Samsung/One UI), so every visible pixel must sit inside
// the safe zone: the centred circle whose diameter is 80% of the canvas. The
// manifest used to point its "maskable" entry at /og/logo-512.png — the same
// edge-to-edge tile it uses for "any" — which reaches 49% past the safe radius,
// so the mask cut the frame and the outer letters of "MAMA" off on install.
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const file = (name) => fileURLToPath(new URL(`public/og/${name}`, root));

const BG = "#0c0a13"; // == site.webmanifest background_color / theme_color
const LOGO_BOX = 320; // longest side of the logo tile, of a 512 canvas (safe zone = 410)

const logo = await sharp(file("logo-512.png"))
  .trim({ threshold: 10 }) // drop the transparent border, centre the tile itself
  .resize({ width: LOGO_BOX, height: LOGO_BOX, fit: "inside" })
  .png()
  .toBuffer();

const buf = await sharp({ create: { width: 512, height: 512, channels: 4, background: BG } })
  .composite([{ input: logo, gravity: "centre" }])
  .png()
  .toBuffer();

await sharp(buf).toFile(file("logo-maskable-512.png"));
console.log(`icon → public/og/logo-maskable-512.png (${(buf.length / 1024).toFixed(1)} KB)`);
