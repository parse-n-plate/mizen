/**
 * Copy for the Mizen sunset notice on the signed-out homepage (`/`). The first screen shows the
 * hero and an announcement card; the note sits just below the fold. Everything it says lives here.
 */
export const SUNSET_NOTE_ID = "note";
export const SUNSET_NOTE_HREF = `/#${SUNSET_NOTE_ID}`;

export const SUNSET_COPY = {
  heading: "Mizen is sunsetting",
  // TODO(gage): replace with your sunset note
  note: "GAGE'S NOTE GOES HERE",
  whatHappensNowHeading: "What happens now",
  whatHappensNow: [
    "Mizen is no longer accepting new signups or waitlist requests.",
    "If you’re already in the beta, you can still sign in to view your recipes.",
  ],
  thanks: "Thank you for cooking with Mizen.",
  signInLabel: "Sign in to your recipes",
  announcementEyebrow: "Read announcement",
  homepageSub: "One place for every recipe you find online. Clean ingredients, clear steps.",
} as const;

/** Shown wherever someone tries to sign up or join the waitlist. */
export const SIGNUPS_CLOSED_MESSAGE = "Mizen is no longer accepting signups.";
