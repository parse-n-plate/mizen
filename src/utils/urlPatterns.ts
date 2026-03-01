export const RECIPE_DOMAINS = new Set([
  "allrecipes.com",
  "bonappetit.com",
  "budgetbytes.com",
  "cooking.nytimes.com",
  "cookinglight.com",
  "delish.com",
  "eatingwell.com",
  "epicurious.com",
  "food52.com",
  "food.com",
  "foodandwine.com",
  "foodnetwork.com",
  "halfbakedharvest.com",
  "justonecookbook.com",
  "kingarthurbaking.com",
  "minimalistbaker.com",
  "pinchofyum.com",
  "recipetineats.com",
  "seriouseats.com",
  "simplyrecipes.com",
  "skinnytaste.com",
  "smittenkitchen.com",
  "tasteofhome.com",
  "tasty.co",
  "thekitchn.com",
  "thespruceeats.com",
]);

const RECIPE_PATH_PATTERNS = /\/(recipes?|cooking|dish|meal|baking)\b/i;

export function looksLikeRecipeUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.replace(/^www\./, "");
    if (RECIPE_DOMAINS.has(host)) return true;
    if (RECIPE_PATH_PATTERNS.test(parsed.pathname)) return true;
    return false;
  } catch {
    return false;
  }
}

const COLLECTION_PATTERNS: Array<{ domain: string; pattern: RegExp }> = [
  // allrecipes.com: only /recipe/<id> paths are single recipes;
  // anything else (listicles, categories, galleries) is not parseable
  { domain: "allrecipes.com", pattern: /^\/(?!recipe\/\d).+/ },
];

export const COLLECTION_MESSAGE =
  "This looks like a recipe collection page, not a single recipe. Try pasting the URL for a specific recipe instead.";

/**
 * Returns a user-facing message if the URL appears to be a collection/category
 * page rather than a single recipe. Returns null if the URL looks fine.
 */
export function detectCollectionUrl(urlString: string): string | null {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname;

    for (const { domain, pattern } of COLLECTION_PATTERNS) {
      if (host === domain || host.endsWith(`.${domain}`)) {
        if (pattern.test(path)) {
          return COLLECTION_MESSAGE;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}
