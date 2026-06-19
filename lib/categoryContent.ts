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
