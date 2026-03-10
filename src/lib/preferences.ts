const PREFERENCES_EVENT = "mizen-preferences-changed";

const ROUND_AMOUNTS_KEY = "round-amounts";
const DEFAULT_SERVINGS_KEY = "default-servings";
const UNIT_SYSTEM_KEY = "unit-system";
const TEMPERATURE_UNIT_KEY = "temperature-unit";
const DIETARY_PROFILE_KEY = "dietary-profile";
const MY_SUBSTITUTIONS_KEY = "my-substitutions";

const DEFAULT_SERVINGS_FALLBACK = 4;

export type PreferenceKey =
  | typeof ROUND_AMOUNTS_KEY
  | typeof DEFAULT_SERVINGS_KEY
  | typeof UNIT_SYSTEM_KEY
  | typeof TEMPERATURE_UNIT_KEY
  | typeof DIETARY_PROFILE_KEY
  | typeof MY_SUBSTITUTIONS_KEY;

function emitPreferenceChange(key: PreferenceKey) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PREFERENCES_EVENT, { detail: { key } }));
}

export function subscribePreferences(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => callback();

  window.addEventListener(PREFERENCES_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(PREFERENCES_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function getRoundAmounts(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ROUND_AMOUNTS_KEY) === "true";
}

export function setRoundAmounts(enabled: boolean) {
  if (typeof window === "undefined") return;

  if (enabled) {
    localStorage.setItem(ROUND_AMOUNTS_KEY, "true");
  } else {
    localStorage.removeItem(ROUND_AMOUNTS_KEY);
  }

  emitPreferenceChange(ROUND_AMOUNTS_KEY);
}

export function getDefaultServings(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DEFAULT_SERVINGS_KEY);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 && n <= 99 ? n : null;
}

export function clearDefaultServings() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEFAULT_SERVINGS_KEY);
  emitPreferenceChange(DEFAULT_SERVINGS_KEY);
}

export function setDefaultServings(n: number) {
  if (typeof window === "undefined") return;
  const clamped = Math.max(1, Math.min(99, Math.round(n)));
  localStorage.setItem(DEFAULT_SERVINGS_KEY, String(clamped));
  emitPreferenceChange(DEFAULT_SERVINGS_KEY);
}

/* ─── Unit System ─────────────────────────────────────────────────────────── */

export type UnitSystem = "original" | "metric" | "imperial";

export function getUnitSystem(): UnitSystem {
  if (typeof window === "undefined") return "original";
  const raw = localStorage.getItem(UNIT_SYSTEM_KEY);
  if (raw === "metric" || raw === "imperial") return raw;
  return "original";
}

export function setUnitSystem(unit: UnitSystem) {
  if (typeof window === "undefined") return;

  if (unit === "original") {
    localStorage.removeItem(UNIT_SYSTEM_KEY);
  } else {
    localStorage.setItem(UNIT_SYSTEM_KEY, unit);
  }

  emitPreferenceChange(UNIT_SYSTEM_KEY);
}

/* ─── Temperature ─────────────────────────────────────────────────────────── */

export type TemperatureUnit = "f" | "c";

export function getTemperatureUnit(): TemperatureUnit {
  if (typeof window === "undefined") return "f";
  return localStorage.getItem(TEMPERATURE_UNIT_KEY) === "c" ? "c" : "f";
}

export function setTemperatureUnit(unit: TemperatureUnit) {
  if (typeof window === "undefined") return;

  if (unit === "f") {
    localStorage.removeItem(TEMPERATURE_UNIT_KEY);
  } else {
    localStorage.setItem(TEMPERATURE_UNIT_KEY, unit);
  }

  emitPreferenceChange(TEMPERATURE_UNIT_KEY);
}

/* ─── Dietary Profile ─────────────────────────────────────────────────────── */

export const DIETARY_OPTIONS = [
  "Dairy-free",
  "Gluten-free",
  "Vegetarian",
  "Vegan",
  "Nut-free",
  "Low-sodium",
  "Shellfish-free",
] as const;

export type DietaryOption = (typeof DIETARY_OPTIONS)[number];

const EMPTY_DIETARY: DietaryOption[] = [];
let _dietaryCache: { raw: string | null; result: DietaryOption[] } = {
  raw: null,
  result: EMPTY_DIETARY,
};

export function getDietaryProfile(): DietaryOption[] {
  if (typeof window === "undefined") return EMPTY_DIETARY;
  const raw = localStorage.getItem(DIETARY_PROFILE_KEY);
  if (raw === _dietaryCache.raw) return _dietaryCache.result;
  try {
    if (!raw) {
      _dietaryCache = { raw, result: EMPTY_DIETARY };
      return EMPTY_DIETARY;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      _dietaryCache = { raw, result: EMPTY_DIETARY };
      return EMPTY_DIETARY;
    }
    const result = parsed.filter((v: unknown) =>
      (DIETARY_OPTIONS as readonly string[]).includes(v as string)
    ) as DietaryOption[];
    _dietaryCache = { raw, result };
    return result;
  } catch {
    _dietaryCache = { raw, result: EMPTY_DIETARY };
    return EMPTY_DIETARY;
  }
}

export function setDietaryProfile(profile: DietaryOption[]) {
  if (typeof window === "undefined") return;

  if (profile.length === 0) {
    localStorage.removeItem(DIETARY_PROFILE_KEY);
  } else {
    localStorage.setItem(DIETARY_PROFILE_KEY, JSON.stringify(profile));
  }

  emitPreferenceChange(DIETARY_PROFILE_KEY);
}

/* ─── My Substitutions ────────────────────────────────────────────────────── */

export interface Substitution {
  from: string;
  to: string;
}

const EMPTY_SUBS: Substitution[] = [];
let _subsCache: { raw: string | null; result: Substitution[] } = {
  raw: null,
  result: EMPTY_SUBS,
};

export function getSubstitutions(): Substitution[] {
  if (typeof window === "undefined") return EMPTY_SUBS;
  const raw = localStorage.getItem(MY_SUBSTITUTIONS_KEY);
  if (raw === _subsCache.raw) return _subsCache.result;
  try {
    if (!raw) {
      _subsCache = { raw, result: EMPTY_SUBS };
      return EMPTY_SUBS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      _subsCache = { raw, result: EMPTY_SUBS };
      return EMPTY_SUBS;
    }
    const result = parsed.filter(
      (s: unknown): s is Substitution =>
        typeof s === "object" &&
        s !== null &&
        typeof (s as Substitution).from === "string" &&
        typeof (s as Substitution).to === "string"
    );
    _subsCache = { raw, result };
    return result;
  } catch {
    _subsCache = { raw, result: EMPTY_SUBS };
    return EMPTY_SUBS;
  }
}

export function setSubstitutions(subs: Substitution[]) {
  if (typeof window === "undefined") return;

  const filtered = subs.filter((s) => s.from.trim() || s.to.trim());
  if (filtered.length === 0) {
    localStorage.removeItem(MY_SUBSTITUTIONS_KEY);
  } else {
    localStorage.setItem(MY_SUBSTITUTIONS_KEY, JSON.stringify(filtered));
  }

  emitPreferenceChange(MY_SUBSTITUTIONS_KEY);
}
