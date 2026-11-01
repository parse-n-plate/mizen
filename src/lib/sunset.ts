/**
 * Copy for the Mizen sunset notice shown on the homepage (`/` and `/homepage`).
 * Everything the sunset page says lives here so it can be edited in one place.
 */
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
} as const;

/** Shown wherever someone tries to sign up or join the waitlist. */
export const SIGNUPS_CLOSED_MESSAGE = "Mizen is no longer accepting signups.";
