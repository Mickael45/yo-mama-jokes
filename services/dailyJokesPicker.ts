import fatMamaJokes from "@/jokes/fat";
import scaryMamaJokes from "@/jokes/scary";
import nastyMamaJokes from "@/jokes/nasty";
import uglyMamaJokes from "@/jokes/ugly";
import dumbMamaJokes from "@/jokes/dumb";
import awfulMamaJokes from "@/jokes/awful";
import dirtyMamaJokes from "@/jokes/dirty";
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
  AWFUL_MAMA_JOKE_CATEGORY,
  BALD_MAMA_JOKE_CATEGORY,
  CLUMSY_MAMA_JOKE_CATEGORY,
  DIRTY_MAMA_JOKE_CATEGORY,
  DUMB_MAMA_JOKE_CATEGORY,
  ENTITLED_MAMA_JOKE_CATEGORY,
  EVIL_MAMA_JOKE_CATEGORY,
  FAT_MAMA_JOKE_CATEGORY,
  GREEDY_MAMA_JOKE_CATEGORY,
  HAIRY_MAMA_JOKE_CATEGORY,
  LAZY_MAMA_JOKE_CATEGORY,
  LOUD_MAMA_JOKE_CATEGORY,
  NASTY_MAMA_JOKE_CATEGORY,
  OLD_MAMA_JOKE_CATEGORY,
  OTHER_MAMA_JOKE_CATEGORY,
  POOR_MAMA_JOKE_CATEGORY,
  SCARY_MAMA_JOKE_CATEGORY,
  SHORT_MAMA_JOKE_CATEGORY,
  SKINNY_MAMA_JOKE_CATEGORY,
  TALL_MAMA_JOKE_CATEGORY,
  UGLY_MAMA_JOKE_CATEGORY,
} from "@/constants";
import { CategoryJoke, CategoryJokes } from "@/types";

const categorizedJokes: CategoryJokes[] = [
  { category: FAT_MAMA_JOKE_CATEGORY, jokes: fatMamaJokes },
  { category: SCARY_MAMA_JOKE_CATEGORY, jokes: scaryMamaJokes },
  { category: NASTY_MAMA_JOKE_CATEGORY, jokes: nastyMamaJokes },
  { category: UGLY_MAMA_JOKE_CATEGORY, jokes: uglyMamaJokes },
  { category: DUMB_MAMA_JOKE_CATEGORY, jokes: dumbMamaJokes },
  { category: AWFUL_MAMA_JOKE_CATEGORY, jokes: awfulMamaJokes },
  { category: DIRTY_MAMA_JOKE_CATEGORY, jokes: dirtyMamaJokes },
  { category: TALL_MAMA_JOKE_CATEGORY, jokes: tallMamaJokes },
  { category: SHORT_MAMA_JOKE_CATEGORY, jokes: shortMamaJokes },
  { category: HAIRY_MAMA_JOKE_CATEGORY, jokes: hairyMamaJokes },
  { category: BALD_MAMA_JOKE_CATEGORY, jokes: baldMamaJokes },
  { category: OLD_MAMA_JOKE_CATEGORY, jokes: oldMamaJokes },
  { category: POOR_MAMA_JOKE_CATEGORY, jokes: poorMamaJokes },
  { category: SKINNY_MAMA_JOKE_CATEGORY, jokes: skinnyMamaJokes },
  { category: CLUMSY_MAMA_JOKE_CATEGORY, jokes: clumsyMamaJokes },
  { category: EVIL_MAMA_JOKE_CATEGORY, jokes: evilMamaJokes },
  { category: GREEDY_MAMA_JOKE_CATEGORY, jokes: greedyMamaJokes },
  { category: LAZY_MAMA_JOKE_CATEGORY, jokes: lazyMamaJokes },
  { category: LOUD_MAMA_JOKE_CATEGORY, jokes: loudMamaJokes },
  { category: ENTITLED_MAMA_JOKE_CATEGORY, jokes: entitledMamaJokes },
  { category: OTHER_MAMA_JOKE_CATEGORY, jokes: otherMamaJokes },
];

function seededRandom(seed: number): () => number {
  let currentSeed = seed;
  return () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
}

function getDailyRandomJokes(): CategoryJoke[] {
  const now = new Date();
  const utcDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const utcDateString = utcDate.toISOString().split("T")[0];
  const seed = parseInt(utcDateString.replace(/-/g, "")); // Create a seed from the date

  const random = seededRandom(seed);
  const selectedCategorizedJokes: CategoryJokes[] = [];
  const result: CategoryJoke[] = [];

  while (selectedCategorizedJokes.length < 5) {
    const randomIndex = Math.floor(random() * categorizedJokes.length);
    const selectedArray = categorizedJokes[randomIndex];

    if (
      !selectedCategorizedJokes
        .map((categorizedJoke) => categorizedJoke.category)
        .includes(selectedArray.category)
    ) {
      selectedCategorizedJokes.push(selectedArray);
    }
  }
  // Select 1 random string from each selected subarray
  selectedCategorizedJokes.forEach((selectedCategorizedJoke) => {
    if (selectedCategorizedJoke.jokes.length > 0) {
      const randomIndex = Math.floor(
        random() * selectedCategorizedJoke.jokes.length
      );
      result.push({
        category: selectedCategorizedJoke.category,
        joke: selectedCategorizedJoke.jokes[randomIndex],
      });
    }
  });

  return result;
}

export default getDailyRandomJokes;
