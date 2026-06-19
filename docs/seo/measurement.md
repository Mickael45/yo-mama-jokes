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
