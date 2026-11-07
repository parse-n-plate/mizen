export const SUNSET_NOTE_ID = "note";
export const SUNSET_NOTE_HREF = `/#${SUNSET_NOTE_ID}`;

export type SunsetNoteSegment =
  | string
  | { text: string; href: string; emphasis?: true }
  | { text: string; emphasis: true };

const NEGI_STUDIO_URL = "https://negi.studio/";

export const SUNSET_NOTE: SunsetNoteSegment[][] = [
  [
    "Mizen started to improve our frustrations with the online recipe experience, which has devolved into intentionally long reads to allow cooks to be bombarded with pop-up ads.",
  ],
  [
    "We set out to create a better cooking experience for home cooks. The name comes from ",
    { text: "mise en place", href: "https://en.wikipedia.org/wiki/Mise_en_place", emphasis: true },
    " and ",
    { text: "zen", href: "https://en.wikipedia.org/wiki/Zen", emphasis: true },
    ", which pretty much sums up how we wanted cooking at home to feel. From prep to plate, we hope Mizen made cooking calm, organized, and playful.",
  ],
  [
    "We couldn\u2019t have done it without the help of many friends and family who tested and contributed to the build, as well as Negi\u2019s first-ever project.",
  ],
  [
    "The project is sunsetting. Now, ",
    { text: "Negi", href: NEGI_STUDIO_URL },
    " will continue building projects that we hope will help people to continue doing what they love.",
  ],
  ["Until then, keep cooking \u{1F9D1}\u{1F3FC}\u200D\u{1F373}!"],
];

export const SUNSET_NOTE_SIGNATURE: SunsetNoteSegment[] = [
  { text: "Gage", href: "https://gageminamoto.com/" },
  " & ",
  { text: "Michelle", href: "https://www.michellesunnyside.com/" },
];

export const SUNSET_SHUTDOWN_DATE = "the end of March 2027";

export const SUNSET_COPY = {
  heading: "Mizen is sunsetting",
  whatHappensNowHeading: "What happens now",
  whatHappensNow: [
    "Mizen is no longer accepting new signups or waitlist requests.",
    "If you\u2019re in the beta, sign in and save the recipes you want to keep. Each recipe has Copy and Print buttons.",
    `Mizen will shut down at ${SUNSET_SHUTDOWN_DATE}. Please save your recipes before then.`,
  ],
  scrollCue: "Read Announcement",
  homepageSub: "One place for every recipe you find online. Clean ingredients, clear steps.",
} as const;

export const SIGNUPS_CLOSED_MESSAGE = "Mizen is no longer accepting signups.";
