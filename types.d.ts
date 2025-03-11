import { FAT_MAMA_JOKE_CATEGORY } from "./constants";

export type Category =
    typeof FAT_MAMA_JOKE_CATEGORY |
    typeof SCARY_MAMA_JOKE_CATEGORY |
    typeof NASTY_MAMA_JOKE_CATEGORY |
    typeof UGLY_MAMA_JOKE_CATEGORY |
    typeof DUMB_MAMA_JOKE_CATEGORY |
    typeof AWFUL_MAMA_JOKE_CATEGORY |
    typeof DIRTY_MAMA_JOKE_CATEGORY |
    typeof TALL_MAMA_JOKE_CATEGORY |
    typeof SHORT_MAMA_JOKE_CATEGORY |
    typeof HAIRY_MAMA_JOKE_CATEGORY |
    typeof BALD_MAMA_JOKE_CATEGORY |
    typeof OLD_MAMA_JOKE_CATEGORY |
    typeof POOR_MAMA_JOKE_CATEGORY |
    typeof SKINNY_MAMA_JOKE_CATEGORY |
    typeof CLUMSY_MAMA_JOKE_CATEGORY |
    typeof EVIL_MAMA_JOKE_CATEGORY |
    typeof GREEDY_MAMA_JOKE_CATEGORY |
    typeof LAZY_MAMA_JOKE_CATEGORY |
    typeof LOUD_MAMA_JOKE_CATEGORY |
    typeof ENTITLED_MAMA_JOKE_CATEGORY |
    typeof OTHER_MAMA_JOKE_CATEGORY;

export type CategoryJokes = { category: Category, jokes: string[] };
export type CategoryJoke = { category: Category, joke: string };