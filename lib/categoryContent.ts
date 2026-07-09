// lib/categoryContent.ts
// Original, human-authored editorial content per category — the E-E-A-T / GEO
// layer that lifts each page above a bare joke list. `directAnswer` is a
// self-contained 40–60 word answer (RAG/AI-citation lever); `body` is original
// prose paragraphs; `citations` are outbound links to authorities.
// `updated` is an ISO date (YYYY-MM-DD) shown as "Last updated" + fed to schema.
//
// All 21 categories now carry authored prose. To add or revise a category,
// mirror the existing entries: one question heading, a tight direct answer,
// 2–4 original paragraphs, and 1–2 real citations, and bump `updated`.
// `hasContent()` gates rendering, so any future entry reset to `body: []`
// simply falls back to the existing lede until rewritten.

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
  [SCARY_MAMA_JOKE_CATEGORY]: {
    question: "What are scary yo mama jokes?",
    directAnswer:
      "Scary yo mama jokes blend insult comedy with horror imagery, comparing a mother to monsters, ghosts, or things so frightening they spook the supernatural itself — \"so scary\" that her own reflection runs away. The laugh comes from cartoonish dread rather than real fear, turning spooky tropes into playful exaggeration.",
    body: [
      "Scary yo mama jokes borrow the furniture of horror — haunted houses, monsters, jump scares — and point it at an over-the-top punchline. Instead of frightening you, the image is so absurd it tips into comedy: a mother who makes zombies take a detour, or whose photo is used to scare crows off a field.",
      "The category thrives around Halloween, when spooky humor is everywhere, but it works year-round because fear and laughter are close cousins — both are reactions to a sudden surprise. A scary yo mama joke sets up dread and then pays it off with silliness, and that whiplash is the joke.",
      "To write a good one, pick a classic horror beat — a mirror, a monster, a graveyard — and exaggerate until even the monster is the one who's scared. The more the supernatural recoils, the funnier the line.",
    ],
    citations: [
      {
        label: "Encyclopædia Britannica — \"the dozens\" (verbal contest tradition)",
        href: "https://www.britannica.com/topic/the-dozens",
      },
    ],
    updated: "2026-06-19",
  },
  [NASTY_MAMA_JOKE_CATEGORY]: {
    question: "What are nasty yo mama jokes?",
    directAnswer:
      "Nasty yo mama jokes push the rude, gross-out end of the format — crude, over-the-top insults built for shock value and big reactions. They lean on exaggeration about hygiene, manners, or attitude rather than explicit content, and are best saved for audiences who enjoy humor that deliberately crosses the line for laughs.",
    body: [
      "Every joke style has a spectrum, and \"nasty\" sits at the rowdy end of yo mama humor. These lines trade politeness for shock, going for the gross-out or the outrageous to get a loud reaction from a crowd that's in on the game.",
      "Because the whole appeal is crossing a line, audience matters more here than almost anywhere else. Among friends who enjoy edgy banter they land hard; in mixed or younger company they fall flat or offend. Reading the room is part of the craft.",
      "The skill is staying clever while being crude — a nasty joke that's only mean isn't funny, but one that's outrageous and unexpected earns the groan-laugh it's after. Keep it playful, keep it absurd, and know when to dial it back.",
    ],
    citations: [
      {
        label: "Wikipedia — Maternal insult (\"yo mama\" jokes)",
        href: "https://en.wikipedia.org/wiki/Maternal_insult",
      },
    ],
    updated: "2026-06-19",
  },
  [UGLY_MAMA_JOKE_CATEGORY]: {
    question: "What are ugly yo mama jokes?",
    directAnswer:
      "Ugly yo mama jokes exaggerate appearance for comic effect — a mother \"so ugly\" she made an onion cry, or scared her own reflection out of the mirror. Like fat jokes, they run on cartoon hyperbole about looks, building a ridiculous mental picture rather than describing anyone real.",
    body: [
      "Appearance-based humor is one of the oldest branches of the format, and the ugly variety leans entirely on the impossible image. The point isn't that anyone is actually unattractive; it's the surreal scene the line conjures — mirrors that crack, cameras that refuse to focus, onions that weep first.",
      "These jokes are close relatives of fat and scary jokes, all sharing the same engine: take a single trait and inflate it to physically impossible proportions. The funniest ugly jokes reach for a fresh image instead of the tired ones, which is why a little originality pays off.",
      "Delivered with a grin they read as a roast; delivered with a sneer they just sound mean. The exaggeration is what signals \"this is a game,\" so commit to the absurdity and keep it light.",
    ],
    citations: [
      {
        label: "Encyclopædia Britannica — \"the dozens\" (verbal contest tradition)",
        href: "https://www.britannica.com/topic/the-dozens",
      },
    ],
    updated: "2026-06-19",
  },
  [AWFUL_MAMA_JOKE_CATEGORY]: {
    question: "What are awful yo mama jokes?",
    directAnswer:
      "Awful yo mama jokes are the \"so bad they're good\" corner of the genre — deliberately groan-worthy, corny, or anti-climactic lines that earn a laugh precisely because they fail as jokes. The humor is in the eye-roll, making them a favorite for fans of dad-joke energy and intentional cringe.",
    body: [
      "Not every joke is trying to be clever. Awful yo mama jokes aim for the opposite: the groan, the eye-roll, the \"that was terrible\" that comes out as a laugh anyway. They're the insult-comedy equivalent of a dad joke.",
      "This works because of shared expectations. When everyone knows the punchline is going to be bad, the badness itself becomes the payoff — anticipating the cringe is half the fun. It's comedy that wins by losing.",
      "If you want to write one, resist the urge to make it good. Go for the obvious, the corny, or the deliberately weak ending. The flatter the landing, the bigger the groan — and the groan is the whole point.",
    ],
    citations: [
      {
        label: "Encyclopædia Britannica — \"the dozens\" (verbal contest tradition)",
        href: "https://www.britannica.com/topic/the-dozens",
      },
    ],
    updated: "2026-06-19",
  },
  [DIRTY_MAMA_JOKE_CATEGORY]: {
    question: "What are dirty yo mama jokes?",
    directAnswer:
      "Dirty yo mama jokes run on grime and gross-out imagery — a mother so filthy she makes mud look clean, or one who fertilizes the lawn by rolling in it. Like nasty jokes, they exaggerate poor hygiene and funk for a big reaction, painting a cartoonish picture of filth rather than describing anyone real.",
    body: [
      "Filth is the whole engine here. These lines pile on the grime — dust bunnies, grease trails, roaches that pack up and leave — until the image is so over-the-top it loops back around to funny. The dirtier and more absurd the picture, the better it lands.",
      "They're close cousins of nasty and awful jokes, all built on inflating a single trait past the point of realism. The point was never that anyone is actually unwashed; it's the ridiculous scene the line paints — a river that turns to mud, bathwater that runs away rather than touch her.",
      "Keep them playful and the grime reads as a roast, not an insult. Reach for a fresh image instead of the tired ones, commit to the absurdity, and the groan-laugh takes care of itself.",
    ],
    citations: [
      {
        label: "Wikipedia — Maternal insult (\"yo mama\" jokes)",
        href: "https://en.wikipedia.org/wiki/Maternal_insult",
      },
    ],
    updated: "2026-06-19",
  },
  [TALL_MAMA_JOKE_CATEGORY]: {
    question: "What are tall yo mama jokes?",
    directAnswer:
      "Tall yo mama jokes exaggerate height to impossible extremes — a mother \"so tall\" she trips over the moon or uses a skyscraper as a footstool. The comedy is purely spatial, building a giant cartoon image, and the category pairs naturally with its opposite, short jokes.",
    body: [
      "Height is a gift to exaggeration because it scales so easily in the imagination. A tall yo mama joke just keeps reaching upward — past the ceiling, the clouds, the atmosphere — until the picture is gloriously impossible.",
      "These jokes are the natural counterpart to short jokes, and the two are often traded back to back in a round of friendly banter. Both rely on the same trick: pick a physical dimension and push it to a cartoonish limit the listener can instantly see.",
      "The best tall jokes find a specific, vivid yardstick — a plane, a satellite, a mountain — rather than just saying \"really tall.\" Concrete images are funnier than vague ones, and they're far easier to picture in a split second.",
    ],
    citations: [
      {
        label: "Encyclopædia Britannica — \"the dozens\" (verbal contest tradition)",
        href: "https://www.britannica.com/topic/the-dozens",
      },
    ],
    updated: "2026-06-19",
  },
  [SHORT_MAMA_JOKE_CATEGORY]: {
    question: "What are short yo mama jokes?",
    directAnswer:
      "Short yo mama jokes exaggerate smallness for laughs — a mother \"so short\" she does backflips under the bed or needs a ladder to reach the bottom shelf. The humor mirrors tall jokes, shrinking the image to a tiny absurd scale instead of stretching it skyward.",
    body: [
      "If tall jokes reach for the clouds, short jokes dig downward into the miniature. The fun is in the impossibly small scene — a mother who uses a hamster wheel as a treadmill, or gets carded buying a balloon.",
      "Smallness invites a particular kind of charm: the images tend to be cute as well as absurd, which makes short jokes feel more affectionate than cutting. They're an easy, crowd-pleasing pick for lighthearted ribbing.",
      "Like all size-based jokes, the trick is a precise comparison the listener can picture instantly. The smaller and more specific the yardstick, the bigger the laugh — and the more it reads as play rather than a put-down.",
    ],
    citations: [
      {
        label: "Encyclopædia Britannica — \"the dozens\" (verbal contest tradition)",
        href: "https://www.britannica.com/topic/the-dozens",
      },
    ],
    updated: "2026-06-19",
  },
  [HAIRY_MAMA_JOKE_CATEGORY]: {
    question: "What are hairy yo mama jokes?",
    directAnswer:
      "Hairy yo mama jokes exaggerate excessive hairiness for comic effect — a mother \"so hairy\" that Bigfoot takes pictures of her, or whose shadow needs a haircut. The humor is visual and absurd, taking a single grooming trait and inflating it into a wild, over-the-top picture.",
    body: [
      "Hairy jokes work the same way fat and ugly jokes do: take one physical feature and push it to a ridiculous extreme. The image — a mother mistaken for a yeti, or whose hairbrush filed a complaint — is the entire payoff.",
      "Part of the appeal is how specific the exaggerations can get: tumbleweeds, gorillas, carpet samples, Sasquatch sightings. The category rewards an unexpected comparison, since the obvious ones wear out fast.",
      "Delivered playfully, these are firmly in roast territory. Reach for a fresh, surprising image rather than recycling the usual ones, and let the absurdity carry it past anything mean-spirited.",
    ],
    citations: [
      {
        label: "Encyclopædia Britannica — \"the dozens\" (verbal contest tradition)",
        href: "https://www.britannica.com/topic/the-dozens",
      },
    ],
    updated: "2026-06-19",
  },
  [BALD_MAMA_JOKE_CATEGORY]: {
    question: "What are bald yo mama jokes?",
    directAnswer:
      "Bald yo mama jokes flip the hairy joke on its head, exaggerating a lack of hair — a mother \"so bald\" you can read what's on her mind, or whose head doubles as a mirror. The comedy plays on shine, smoothness, and reflective scalps for an instantly visual gag.",
    body: [
      "Bald jokes are the natural opposite of hairy ones, and they mine a different set of images: gleaming scalps, reflections, slippery surfaces. The classic shape leans on the shine — a head so polished you can fix your hair in it.",
      "There's a built-in wordplay bonus here, since \"you can see what's on her mind\" and similar lines pun on the literal and figurative at once. That double layer gives bald jokes a slightly wittier edge than the pure-image categories.",
      "As always, the friendly version exaggerates so far past reality that it lands as a joke. Pick a vivid reflective image or a clean pun, keep it quick, and it plays as banter rather than a barb.",
    ],
    citations: [
      {
        label: "Encyclopædia Britannica — \"the dozens\" (verbal contest tradition)",
        href: "https://www.britannica.com/topic/the-dozens",
      },
    ],
    updated: "2026-06-19",
  },
  [OLD_MAMA_JOKE_CATEGORY]: {
    question: "What are old yo mama jokes?",
    directAnswer:
      "Old yo mama jokes exaggerate age to historic extremes — a mother \"so old\" her birth certificate is in Roman numerals, or she knew the Dead Sea when it was only sick. The humor stretches time itself, dropping her into famous moments in history for an easy, good-natured laugh.",
    body: [
      "Age jokes have a wonderful built-in toolkit: all of history. An old yo mama joke can drop her into the Stone Age, the dinosaur era, or the front row of the first-ever movie, and the further back it reaches, the bigger the laugh.",
      "The best of them name a specific historical anchor rather than just saying \"really old.\" \"Her social security number is 1\" lands because the image is precise and instantly datable in the listener's head.",
      "These jokes tend to feel good-natured, since absurd time travel is hard to take personally. Keep the reference vivid and the exaggeration extreme, and old jokes practically write themselves.",
    ],
    citations: [
      {
        label: "Encyclopædia Britannica — \"the dozens\" (verbal contest tradition)",
        href: "https://www.britannica.com/topic/the-dozens",
      },
    ],
    updated: "2026-06-19",
  },
  [POOR_MAMA_JOKE_CATEGORY]: {
    question: "What are poor yo mama jokes?",
    directAnswer:
      "Poor yo mama jokes exaggerate a lack of money for comic effect — a mother \"so poor\" she chases the garbage truck with a shopping list, or whose credit card is a library card. The humor lives in the absurd image, and the category works best when it's kept clearly playful rather than genuinely mean.",
    body: [
      "Poverty jokes are an old part of the format, and they run on the same hyperbole engine as the rest: a single circumstance pushed to a cartoonish, impossible extreme. The picture — paying bills with Monopoly money, or a house so small the welcome mat just says \"wel\" — is the joke.",
      "This is one of the categories where tone does the heavy lifting. Because real hardship isn't funny, the exaggeration has to be wild enough that nobody mistakes it for a comment on anyone real. The goofier the image, the safer and funnier it lands.",
      "Keep these firmly in absurd territory, deliver them with a grin, and read the room. Done right they're playful roasts; done with an edge they just sting — so lean hard into the cartoon.",
    ],
    citations: [
      {
        label: "Wikipedia — Maternal insult (\"yo mama\" jokes)",
        href: "https://en.wikipedia.org/wiki/Maternal_insult",
      },
    ],
    updated: "2026-06-19",
  },
  [SKINNY_MAMA_JOKE_CATEGORY]: {
    question: "What are skinny yo mama jokes?",
    directAnswer:
      "Skinny yo mama jokes exaggerate thinness for laughs — a mother \"so skinny\" she hula-hoops through a Cheerio or turns sideways and disappears. They're the mirror image of fat jokes, shrinking the frame to an impossibly thin cartoon rather than inflating it.",
    body: [
      "Skinny jokes are the slim counterpart to fat jokes, and they reach for images of impossible thinness — slipping through keyholes, using a strand of spaghetti as a belt, vanishing when she turns to the side. The thinner the picture, the better.",
      "Because the exaggeration is so physically absurd, these read as obvious play. The trick, as with all size jokes, is a concrete and surprising comparison the listener can picture in an instant rather than a vague \"really skinny.\"",
      "They pair naturally with fat jokes in a back-and-forth round, since the two are perfect opposites. Keep them light and visual, and skinny jokes stay firmly in friendly-roast territory.",
    ],
    citations: [
      {
        label: "Encyclopædia Britannica — \"the dozens\" (verbal contest tradition)",
        href: "https://www.britannica.com/topic/the-dozens",
      },
    ],
    updated: "2026-06-19",
  },
  [CLUMSY_MAMA_JOKE_CATEGORY]: {
    question: "What are clumsy yo mama jokes?",
    directAnswer:
      "Clumsy yo mama jokes exaggerate a lack of coordination for comic effect — a mother \"so clumsy\" she trips over wireless internet, or falls off the floor. The humor is built on slapstick imagery and impossible accidents, making it one of the goofier, more family-friendly corners of the format.",
    body: [
      "Clumsy jokes are slapstick in one-liner form. They conjure pratfalls and impossible mishaps — tripping over nothing, getting tangled in a cordless phone — and the physical comedy is what carries the laugh.",
      "Part of why they land is that everyone has had a clumsy moment, so the exaggeration starts from something relatable and then sprints past it into the impossible. That mix of familiar and absurd makes them very easy to enjoy.",
      "Because the target is a goofy accident rather than someone's looks or worth, clumsy jokes are gentle and broadly appealing. Reach for the most physically impossible stumble you can picture, and the slapstick does the rest.",
    ],
    citations: [
      {
        label: "Encyclopædia Britannica — \"the dozens\" (verbal contest tradition)",
        href: "https://www.britannica.com/topic/the-dozens",
      },
    ],
    updated: "2026-06-19",
  },
  [EVIL_MAMA_JOKE_CATEGORY]: {
    question: "What are evil yo mama jokes?",
    directAnswer:
      "Evil yo mama jokes cast a mother as a cartoon villain — \"so evil\" she makes onions cry, or her to-do list is just the word \"chaos.\" The humor exaggerates wickedness into supervillain territory, playing on menace and mischief rather than anything genuinely dark.",
    body: [
      "Evil jokes turn the format into a comic-book origin story. The mother becomes a pantomime villain — twirling a mustache, scheming for fun, scaring the devil himself — and the over-the-top menace is played entirely for laughs.",
      "They share DNA with scary jokes but swap dread for mischief: where scary jokes go for the monster, evil jokes go for the mastermind. The funniest ones give her a specific, petty wickedness that's more silly than sinister.",
      "Keep the villainy cartoonish and the tone winking, and evil jokes stay firmly playful. A mother so evil she returns library books a day early lands better than anything that tries to be genuinely menacing.",
    ],
    citations: [
      {
        label: "Encyclopædia Britannica — \"the dozens\" (verbal contest tradition)",
        href: "https://www.britannica.com/topic/the-dozens",
      },
    ],
    updated: "2026-06-19",
  },
  [GREEDY_MAMA_JOKE_CATEGORY]: {
    question: "What are greedy yo mama jokes?",
    directAnswer:
      "Greedy yo mama jokes exaggerate a hunger for money and stuff — a mother \"so greedy\" she keeps all the gravy for herself, or charges rent on the welcome mat. The comedy inflates ordinary stinginess into absurd, cartoonish penny-pinching for an easy, relatable laugh.",
    body: [
      "Greed is a rich vein for comedy because everyone recognizes the tightwad. A greedy yo mama joke takes that familiar figure and exaggerates the penny-pinching to impossible heights — re-gifting birthday cake, or installing a coin slot on the bathroom door.",
      "The humor leans on specific, petty stinginess rather than grand wealth, which is what makes it land. The smaller and more ridiculous the thing she won't share, the funnier the image.",
      "These are good-natured by nature, since cartoon cheapness is hard to take seriously. Pick an everyday item, imagine the stingiest possible behavior around it, and the joke nearly builds itself.",
    ],
    citations: [
      {
        label: "Encyclopædia Britannica — \"the dozens\" (verbal contest tradition)",
        href: "https://www.britannica.com/topic/the-dozens",
      },
    ],
    updated: "2026-06-19",
  },
  [LAZY_MAMA_JOKE_CATEGORY]: {
    question: "What are lazy yo mama jokes?",
    directAnswer:
      "Lazy yo mama jokes exaggerate sloth to absurd extremes — a mother \"so lazy\" she has a remote control for her remote control, or waits for the wind to turn the pages. The humor inflates everyday laziness into heroic levels of doing nothing.",
    body: [
      "Lazy jokes celebrate the art of doing as little as possible. The classic shape takes a small effort-saving habit and stretches it into the impossible — hiring someone to blink for her, or counting rolling over as a full workout.",
      "They land because the exaggeration grows from something universally relatable; everyone has had a lazy day. The joke just keeps escalating the avoidance of effort until it tips into the gloriously ridiculous.",
      "Because the target is harmless and familiar, lazy jokes are an easy, broad crowd-pleaser. Find a tiny everyday task, imagine the most elaborate way to avoid it, and you've got your punchline.",
    ],
    citations: [
      {
        label: "Encyclopædia Britannica — \"the dozens\" (verbal contest tradition)",
        href: "https://www.britannica.com/topic/the-dozens",
      },
    ],
    updated: "2026-06-19",
  },
  [LOUD_MAMA_JOKE_CATEGORY]: {
    question: "What are loud yo mama jokes?",
    directAnswer:
      "Loud yo mama jokes exaggerate noise and volume for laughs — a mother \"so loud\" she gives echoes a headache, or the neighbors three towns over file complaints. The humor turns sound itself into a cartoon, with a voice powerful enough to bend the world around it.",
    body: [
      "Loud jokes make noise the punchline. The mother's voice becomes a force of nature — setting off car alarms, drowning out thunder, registering on seismographs — and the bigger the acoustic chaos, the bigger the laugh.",
      "What makes them work is reaching for a vivid, measurable consequence of all that volume. \"She's loud\" is flat; \"she made the smoke detector ask her to keep it down\" paints a picture you can practically hear.",
      "These are firmly playful, since super-powered volume is pure cartoon. Pick something that shouldn't be affected by sound and have her voice overpower it anyway, and the joke lands.",
    ],
    citations: [
      {
        label: "Encyclopædia Britannica — \"the dozens\" (verbal contest tradition)",
        href: "https://www.britannica.com/topic/the-dozens",
      },
    ],
    updated: "2026-06-19",
  },
  [ENTITLED_MAMA_JOKE_CATEGORY]: {
    question: "What are entitled yo mama jokes?",
    directAnswer:
      "Entitled yo mama jokes exaggerate a demanding, self-important attitude — a mother \"so entitled\" she asks to speak to the manager of the ocean, or expects a standing ovation for showing up. The humor inflates everyday pushiness into world-class diva behavior.",
    body: [
      "Entitled jokes are a more modern flavor of the format, built around the demanding-customer archetype everyone recognizes. The mother expects the world to rearrange itself for her — a reserved parking spot at the beach, a refund on the weather.",
      "The comedy comes from the gap between the tiny situation and the enormous sense of deserving. The more trivial the thing she's demanding special treatment over, the funnier the over-the-top attitude becomes.",
      "Because the target is an attitude rather than a body or a circumstance, entitled jokes feel fresh and observational. Picture the most outrageous demand for an ordinary moment, and you've found the punchline.",
    ],
    citations: [
      {
        label: "Wikipedia — Maternal insult (\"yo mama\" jokes)",
        href: "https://en.wikipedia.org/wiki/Maternal_insult",
      },
    ],
    updated: "2026-06-19",
  },
  [OTHER_MAMA_JOKE_CATEGORY]: {
    question: "What are other yo mama jokes?",
    directAnswer:
      "The \"other\" category is a catch-all for yo mama jokes that don't fit the standard themes — surreal one-liners, oddball wordplay, and creative jokes that defy the usual fat, old, or dumb formulas. It's the home for the genre's wild cards and experiments.",
    body: [
      "Not every great yo mama joke fits a tidy label. The \"other\" category collects the misfits — surreal images, clever wordplay, and jokes that mash up themes or invent their own — so the genre's most creative entries have a home.",
      "This is often where the freshest material lives, precisely because it isn't bound by a formula. A joke that's too weird or too original for the standard buckets can still be the funniest one in the room.",
      "If you're experimenting with your own, this is the sandbox: try an unexpected angle, a strange comparison, or a twist on the classic structure. The only rule here is that there are no rules.",
    ],
    citations: [
      {
        label: "Wikipedia — Maternal insult (\"yo mama\" jokes)",
        href: "https://en.wikipedia.org/wiki/Maternal_insult",
      },
    ],
    updated: "2026-06-19",
  },
};

/** True when a category has authored prose (so the page renders the rich block). */
export function hasContent(c: Category): boolean {
  return categoryContent[c].body.length > 0;
}
