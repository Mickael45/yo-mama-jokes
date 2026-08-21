// Single source of truth for category metadata, joke data, and SEO copy.
// Consolidates what used to be spread across the Next pages.

import fatMamaJokes from "@/jokes/fat";
import scaryMamaJokes from "@/jokes/scary";
import uglyMamaJokes from "@/jokes/ugly";
import dumbMamaJokes from "@/jokes/dumb";
import awfulMamaJokes from "@/jokes/awful";
import tallMamaJokes from "@/jokes/tall";
import shortMamaJokes from "@/jokes/short";
import hairyMamaJokes from "@/jokes/hairy";
import baldMamaJokes from "@/jokes/bald";
import oldMamaJokes from "@/jokes/old";
import poorMamaJokes from "@/jokes/poor";
import skinnyMamaJokes from "@/jokes/skinny";
import clumsyMamaJokes from "@/jokes/clumsy";
import evilMamaJokes from "@/jokes/evil";
import greedyMamaJokes from "@/jokes/greedy";
import lazyMamaJokes from "@/jokes/lazy";
import loudMamaJokes from "@/jokes/loud";
import entitledMamaJokes from "@/jokes/entitled";
import otherMamaJokes from "@/jokes/other";
import {
  FAT_MAMA_JOKE_CATEGORY,
  SCARY_MAMA_JOKE_CATEGORY,
  UGLY_MAMA_JOKE_CATEGORY,
  DUMB_MAMA_JOKE_CATEGORY,
  AWFUL_MAMA_JOKE_CATEGORY,
  TALL_MAMA_JOKE_CATEGORY,
  SHORT_MAMA_JOKE_CATEGORY,
  HAIRY_MAMA_JOKE_CATEGORY,
  BALD_MAMA_JOKE_CATEGORY,
  OLD_MAMA_JOKE_CATEGORY,
  POOR_MAMA_JOKE_CATEGORY,
  SKINNY_MAMA_JOKE_CATEGORY,
  CLUMSY_MAMA_JOKE_CATEGORY,
  EVIL_MAMA_JOKE_CATEGORY,
  GREEDY_MAMA_JOKE_CATEGORY,
  LAZY_MAMA_JOKE_CATEGORY,
  LOUD_MAMA_JOKE_CATEGORY,
  ENTITLED_MAMA_JOKE_CATEGORY,
  OTHER_MAMA_JOKE_CATEGORY,
} from "@/constants";
import type { Category } from "@/types";

export const categories: { name: string; slug: Category }[] = [
  { name: "Fat", slug: FAT_MAMA_JOKE_CATEGORY },
  { name: "Scary", slug: SCARY_MAMA_JOKE_CATEGORY },
  { name: "Ugly", slug: UGLY_MAMA_JOKE_CATEGORY },
  { name: "Dumb", slug: DUMB_MAMA_JOKE_CATEGORY },
  { name: "Awful", slug: AWFUL_MAMA_JOKE_CATEGORY },
  { name: "Tall", slug: TALL_MAMA_JOKE_CATEGORY },
  { name: "Short", slug: SHORT_MAMA_JOKE_CATEGORY },
  { name: "Hairy", slug: HAIRY_MAMA_JOKE_CATEGORY },
  { name: "Bald", slug: BALD_MAMA_JOKE_CATEGORY },
  { name: "Old", slug: OLD_MAMA_JOKE_CATEGORY },
  { name: "Poor", slug: POOR_MAMA_JOKE_CATEGORY },
  { name: "Skinny", slug: SKINNY_MAMA_JOKE_CATEGORY },
  { name: "Clumsy", slug: CLUMSY_MAMA_JOKE_CATEGORY },
  { name: "Evil", slug: EVIL_MAMA_JOKE_CATEGORY },
  { name: "Greedy", slug: GREEDY_MAMA_JOKE_CATEGORY },
  { name: "Lazy", slug: LAZY_MAMA_JOKE_CATEGORY },
  { name: "Loud", slug: LOUD_MAMA_JOKE_CATEGORY },
  { name: "Entitled", slug: ENTITLED_MAMA_JOKE_CATEGORY },
  { name: "Other", slug: OTHER_MAMA_JOKE_CATEGORY },
];

export const jokesByCategory: Record<Category, string[]> = {
  [FAT_MAMA_JOKE_CATEGORY]: fatMamaJokes,
  [SCARY_MAMA_JOKE_CATEGORY]: scaryMamaJokes,
  [UGLY_MAMA_JOKE_CATEGORY]: uglyMamaJokes,
  [DUMB_MAMA_JOKE_CATEGORY]: dumbMamaJokes,
  [AWFUL_MAMA_JOKE_CATEGORY]: awfulMamaJokes,
  [TALL_MAMA_JOKE_CATEGORY]: tallMamaJokes,
  [SHORT_MAMA_JOKE_CATEGORY]: shortMamaJokes,
  [HAIRY_MAMA_JOKE_CATEGORY]: hairyMamaJokes,
  [BALD_MAMA_JOKE_CATEGORY]: baldMamaJokes,
  [OLD_MAMA_JOKE_CATEGORY]: oldMamaJokes,
  [POOR_MAMA_JOKE_CATEGORY]: poorMamaJokes,
  [SKINNY_MAMA_JOKE_CATEGORY]: skinnyMamaJokes,
  [CLUMSY_MAMA_JOKE_CATEGORY]: clumsyMamaJokes,
  [EVIL_MAMA_JOKE_CATEGORY]: evilMamaJokes,
  [GREEDY_MAMA_JOKE_CATEGORY]: greedyMamaJokes,
  [LAZY_MAMA_JOKE_CATEGORY]: lazyMamaJokes,
  [LOUD_MAMA_JOKE_CATEGORY]: loudMamaJokes,
  [ENTITLED_MAMA_JOKE_CATEGORY]: entitledMamaJokes,
  [OTHER_MAMA_JOKE_CATEGORY]: otherMamaJokes,
};

export type CategoryPageData = {
  metadata: { title: string; description: string };
  page: { title: string; description: string };
};

export const categoryMeta: Record<Category, CategoryPageData> = {
  [FAT_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Fat Yo Mama Jokes - Hilarious & Insulting | Yo Mama Jokes Central",
      description: "Get ready for the funniest Fat Yo Mama Jokes online!  Tons of hilarious insults about weight and size. Browse our collection and share the laughs!",
    },
    page: {
      title: "Fat Yo Mama Jokes",
      description: "Dive into our collection of Fat Yo Mama Jokes!  Find tons of side-splittingly funny jokes about weight, size, and eating habits.  Perfect for sharing a laugh (or a playful roast) with friends.",
    },
  },
  [SCARY_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Scary Yo Mama Jokes - Spooky & Funny | Yo Mama Jokes Central",
      description: "Dare to laugh with Scary Yo Mama Jokes!  Dark humor and spooky insults that are guaranteed to get a reaction. Browse our collection and share the scares (and laughs)!",
    },
    page: {
      title: "Scary Yo Mama Jokes",
      description: "Enter the realm of Scary Yo Mama Jokes!  If you like your humor with a touch of the macabre and spooky, you've come to the right place.  Explore our collection of dark and funny jokes, but be warned – they might just send a chill down your spine (from laughter)!",
    },
  },
  [UGLY_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Ugly Yo Mama Jokes - Hilariously Insulting | Yo Mama Jokes Central",
      description: "Laugh at Ugly Yo Mama Jokes!  Our collection of jokes about appearance and less-than-flattering looks.  Browse and share these funny (but maybe a little mean) insults!",
    },
    page: {
      title: "Ugly Yo Mama Jokes",
      description: "Get ready for Ugly Yo Mama Jokes!  This category is packed with jokes that playfully (or not so playfully) poke fun at appearances.  If you're ready for some laughs at the expense of \"Yo Mama's\" looks, dive into this collection!",
    },
  },
  [DUMB_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Dumb Yo Mama Jokes - Silly & Hilarious | Yo Mama Jokes Central",
      description: "Laugh at Dumb Yo Mama Jokes!  Our collection of silly, nonsensical, and hilariously stupid insults.  Browse and share these jokes for some lighthearted fun!",
    },
    page: {
      title: "Dumb Yo Mama Jokes",
      description: "Prepare for Dumb Yo Mama Jokes!  This category is all about silly, nonsensical, and just plain dumb humor.  If you enjoy jokes that are more goofy than clever, explore our collection of hilariously stupid insults!",
    },
  },
  [AWFUL_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Awful Yo Mama Jokes -  Terribly Funny | Yo Mama Jokes Central",
      description: "Awful Yo Mama Jokes - so bad they're good!  Explore our collection of intentionally terrible and hilariously cringe-worthy insults. Browse now and share the awfulness!",
    },
    page: {
      title: "Awful Yo Mama Jokes",
      description: "Delight in the Awful Yo Mama Jokes!  This category celebrates jokes that are intentionally terrible, cringe-worthy, and yet, somehow, still funny.  Explore our collection of truly awful (but hilariously bad) insults!",
    },
  },
  [TALL_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Tall Yo Mama Jokes - Jokes About Height | Yo Mama Jokes Central",
      description: "Laugh at Tall Yo Mama Jokes!  Our collection of jokes that poke fun at extreme height. Browse and share these funny jokes about very tall \"Yo Mamas\"!",
    },
    page: {
      title: "Tall Yo Mama Jokes",
      description: "Reach new heights of humor with Tall Yo Mama Jokes!  This category is dedicated to jokes that playfully exaggerate \"Yo Mama's\" height.  If you're ready for jokes about towering figures and comical vertical challenges, explore this collection!",
    },
  },
  [SHORT_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Short Yo Mama Jokes - Jokes About Being Small | Yo Mama Jokes Central",
      description: "Funny Short Yo Mama Jokes!  Our collection of jokes that poke fun at being vertically challenged. Browse and share these hilarious jokes about short \"Yo Mamas\"!",
    },
    page: {
      title: "Short Yo Mama Jokes",
      description: "Get down to the humor with Short Yo Mama Jokes!  This category is all about jokes that playfully exaggerate \"Yo Mama's\" lack of height.  If you're ready for jokes about comical shortness and pint-sized problems, explore this collection!",
    },
  },
  [HAIRY_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Hairy Yo Mama Jokes - Jokes About Hairiness | Yo Mama Jokes Central",
      description: "Hairy Yo Mama Jokes - for hairy situations!  Our collection of jokes that poke fun at excessive hairiness. Browse and share these funny and furry insults!",
    },
    page: {
      title: "Hairy Yo Mama Jokes",
      description: "Get hairy with Hairy Yo Mama Jokes!  This category is dedicated to jokes that playfully exaggerate \"Yo Mama's\" hairiness (or lack thereof in unexpected places!).  If you're ready for jokes about comical furriness and wild manes, explore this collection!",
    },
  },
  [BALD_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Bald Yo Mama Jokes - Jokes About Being Bald | Yo Mama Jokes Central",
      description: "Bald Yo Mama Jokes - hair today, gone tomorrow!  Our collection of jokes that poke fun at baldness. Browse and share these funny and follicle-challenged insults!",
    },
    page: {
      title: "Bald Yo Mama Jokes",
      description: "Go baldly into humor with Bald Yo Mama Jokes!  This category is dedicated to jokes that playfully exaggerate \"Yo Mama's\" lack of hair on top.  If you're ready for jokes about shiny heads and comical hair loss, explore this collection!",
    },
  },
  [OLD_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Old Yo Mama Jokes - Jokes About Age | Yo Mama Jokes Central",
      description: "Old Yo Mama Jokes - classic insults for the ages!  Our collection of jokes that poke fun at old age. Browse and share these funny jokes about \"Yo Mama's\" senior status!",
    },
    page: {
      title: "Old Yo Mama Jokes",
      description: "Turn back time with Old Yo Mama Jokes!  This category is dedicated to jokes that playfully exaggerate \"Yo Mama's\" advanced age.  If you're ready for jokes about wrinkles, rocking chairs, and comical senior moments, explore this collection!",
    },
  },
  [POOR_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Poor Yo Mama Jokes - Jokes About Poverty | Yo Mama Jokes Central",
      description: "Poor Yo Mama Jokes - hilariously broke!  Our collection of jokes that poke fun at poverty and lack of resources. Browse and share these funny (but maybe a little insensitive) insults!",
    },
    page: {
      title: "Poor Yo Mama Jokes",
      description: "Laugh (or maybe wince) at Poor Yo Mama Jokes!  This category is dedicated to jokes that playfully exaggerate \"Yo Mama's\" lack of wealth and resources.  If you're ready for jokes that are a bit edgy and poke fun at poverty, explore this collection (with a grain of salt)!",
    },
  },
  [SKINNY_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Skinny Yo Mama Jokes - Jokes About Being Thin | Yo Mama Jokes Central",
      description: "Skinny Yo Mama Jokes - hilariously thin!  Our collection of jokes that poke fun at being underweight. Browse and share these funny jokes about skinny \"Yo Mamas\"!",
    },
    page: {
      title: "Skinny Yo Mama Jokes",
      description: "Get lean with Skinny Yo Mama Jokes!  This category is dedicated to jokes that playfully exaggerate \"Yo Mama's\" thin physique.  If you're ready for jokes about comical skinniness and bony figures, explore this collection!",
    },
  },
  [CLUMSY_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Clumsy Yo Mama Jokes - Jokes About Clumsiness | Yo Mama Jokes Central",
      description: "Clumsy Yo Mama Jokes - hilariously awkward!  Our collection of jokes that poke fun at clumsiness and lack of coordination. Browse and share these funny and fumble-filled insults!",
    },
    page: {
      title: "Clumsy Yo Mama Jokes",
      description: "Stumble into humor with Clumsy Yo Mama Jokes!  This category is dedicated to jokes that playfully exaggerate \"Yo Mama's\" lack of grace and coordination.  If you're ready for jokes about comical mishaps, tripping, and general awkwardness, explore this collection!",
    },
  },
  [EVIL_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Evil Yo Mama Jokes - Jokes About Being Wicked | Yo Mama Jokes Central",
      description: "Evil Yo Mama Jokes - wickedly funny!  Our collection of jokes that poke fun at evil and villainy. Browse and share these dark and devilishly hilarious insults!",
    },
    page: {
      title: "Evil Yo Mama Jokes",
      description: "Embrace the dark side with Evil Yo Mama Jokes!  This category is dedicated to jokes that playfully exaggerate \"Yo Mama's\" wickedness and villainous nature.  If you're ready for jokes that are a bit sinister and celebrate comical evil, explore this collection!",
    },
  },
  [GREEDY_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Greedy Yo Mama Jokes - Jokes About Greed | Yo Mama Jokes Central",
      description: "Greedy Yo Mama Jokes - hilariously money-hungry!  Our collection of jokes that poke fun at greed and excessive desire for wealth. Browse and share these funny and financially-focused insults!",
    },
    page: {
      title: "Greedy Yo Mama Jokes",
      description: "Get rich with laughter with Greedy Yo Mama Jokes!  This category is dedicated to jokes that playfully exaggerate \"Yo Mama's\" insatiable greed and love of money.  If you're ready for jokes about comical avarice and financial fixations, explore this collection!",
    },
  },
  [LAZY_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Lazy Yo Mama Jokes - Jokes About Laziness | Yo Mama Jokes Central",
      description: "Lazy Yo Mama Jokes - hilariously unmotivated!  Our collection of jokes that poke fun at laziness and lack of energy. Browse and share these funny and lethargic insults!",
    },
    page: {
      title: "Lazy Yo Mama Jokes",
      description: "Take it easy with Lazy Yo Mama Jokes!  This category is dedicated to jokes that playfully exaggerate \"Yo Mama's\" extreme laziness and lack of motivation.  If you're ready for jokes about comical sloth and epic procrastination, explore this collection!",
    },
  },
  [LOUD_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Loud Yo Mama Jokes - Jokes About Being Noisy | Yo Mama Jokes Central",
      description: "Loud Yo Mama Jokes - hilariously noisy!  Our collection of jokes that poke fun at being loud and disruptive. Browse and share these funny and ear-splitting insults!",
    },
    page: {
      title: "Loud Yo Mama Jokes",
      description: "Turn up the volume with Loud Yo Mama Jokes!  This category is dedicated to jokes that playfully exaggerate \"Yo Mama's\" extreme loudness and booming voice.  If you're ready for jokes about comical noise pollution and ear-drum shattering insults, explore this collection!",
    },
  },
  [ENTITLED_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Entitled Yo Mama Jokes - Jokes About Entitlement | Yo Mama Jokes Central",
      description: "Entitled Yo Mama Jokes - hilariously demanding!  Our collection of jokes that poke fun at entitlement and demanding behavior. Browse and share these funny and self-important insults!",
    },
    page: {
      title: "Entitled Yo Mama Jokes",
      description: "Demand to be amused with Entitled Yo Mama Jokes!  This category is dedicated to jokes that playfully exaggerate \"Yo Mama's\" sense of entitlement and demanding nature.  If you're ready for jokes about comical self-importance and outrageous demands, explore this collection!",
    },
  },
  [OTHER_MAMA_JOKE_CATEGORY]: {
    metadata: {
      title: "Other Yo Mama Jokes -  Funny & Miscellaneous | Yo Mama Jokes Central",
      description: "Other Yo Mama Jokes - for everything else!  Explore our miscellaneous collection of jokes that don't fit neatly into other categories. Browse and share these funny and varied insults!",
    },
    page: {
      title: "Other Yo Mama Jokes",
      description: "Welcome to the \"Other\" Yo Mama Jokes category!  This is our catch-all for jokes that are hilarious but don't quite fit into our other specific categories.  If you're looking for a bit of everything or just want to explore some unique and varied insults, this is the place to be!",
    },
  },
};
