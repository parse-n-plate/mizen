/**
 * Copy for the Mizen sunset notice on the signed-out homepage (`/`). The first screen shows the
 * hero; the note sits just below the fold on a light-blue gradient. Everything it says lives here.
 */
export const SUNSET_NOTE_ID = "note";
export const SUNSET_NOTE_HREF = `/#${SUNSET_NOTE_ID}`;

/** A piece of the note: plain text, or text that links somewhere. */
export type SunsetNoteSegment = string | { text: string; href: string };

const MICHELLE_URL = "https://www.linkedin.com/in/michelle-tran-a48a14203/";
const NEGI_STUDIO_URL = "https://negi.studio/";

/** Gage's sunset note, one array per paragraph. */
export const SUNSET_NOTE: SunsetNoteSegment[][] = [
  [
    "Mizen started with a simple desire to work on a side project together and continue our amazing team dynamic.",
  ],
  [
    "It didn\u2019t take long for us to uncover ",
    { text: "Michelle", href: MICHELLE_URL },
    "\u2019s frustration with the online recipe experience, which had devolved into reading an author\u2019s life story while being bombarded with pop-up ads.",
  ],
  [
    "We set out to create a better cooking experience for home cooks. The name comes from ",
    { text: "mise en place", href: "https://en.wikipedia.org/wiki/Mise_en_place" },
    " and zen, which pretty much sums up how I wanted cooking at home to feel. From prep to plate, we hope Mizen made cooking calm, organized, and playful.",
  ],
  [
    "We couldn\u2019t have done it without the help of many friends and family members who tested and contributed to the build.",
  ],
  [
    "The code will live on as open source, but at ",
    { text: "Negi Studio", href: NEGI_STUDIO_URL },
    ", we\u2019ll continue working on new projects that we hope will help people spend more time doing what they love.",
  ],
  ["Until then, keep cooking \u{1F9D1}\u{1F3FC}\u200D\u{1F373}!"],
];

export const SUNSET_NOTE_SIGNATURE = "Gage";

export const SUNSET_COPY = {
  heading: "Mizen is sunsetting",
  whatHappensNowHeading: "What happens now",
  whatHappensNow: [
    "Mizen is no longer accepting new signups or waitlist requests.",
    "If you\u2019re in the beta, sign in and save the recipes you want to keep. Each recipe has Copy and Print buttons.",
    "The site may go offline, and we can\u2019t promise how long it will stay up.",
  ],
  homepageSub: "One place for every recipe you find online. Clean ingredients, clear steps.",
} as const;

/** Shown wherever someone tries to sign up or join the waitlist. */
export const SIGNUPS_CLOSED_MESSAGE = "Mizen is no longer accepting signups.";
