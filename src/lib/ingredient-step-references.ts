import type { Ingredient, IngredientGroup, InstructionStep } from "@/lib/types";

export type IngredientStepReference = {
  key: string;
  ingredient: Ingredient;
  matchText?: string;
  start?: number;
  end?: number;
  amountLabel: string;
  usage: "full" | "partial";
  confidence: "high" | "medium";
};

type Candidate = {
  ingredient: Ingredient;
  key: string;
  phrases: string[];
};

const DESCRIPTOR_WORDS = new Set([
  "all",
  "purpose",
  "fresh",
  "frozen",
  "dried",
  "chopped",
  "minced",
  "diced",
  "sliced",
  "grated",
  "shredded",
  "toasted",
  "roasted",
  "melted",
  "softened",
  "unsalted",
  "salted",
  "packed",
  "light",
  "dark",
  "extra",
  "virgin",
  "fine",
  "coarse",
  "large",
  "small",
  "medium",
  "whole",
  "low",
  "fat",
]);

const PARTIAL_USE_PATTERN =
  /\b(half|some|part|portion|divided|reserve|reserved|remaining|remainder|rest)\b/i;

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singularize(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.endsWith("es")) return word.slice(0, -2);
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phraseRegExp(phrase: string): RegExp {
  const body = phrase
    .split(" ")
    .map((word) => {
      const singular = singularize(word);
      return singular === word ? escapeRegExp(word) + "s?" : `${escapeRegExp(singular)}(?:s|es)?`;
    })
    .join("[\\s\\-]+");

  return new RegExp(`(^|[^a-z0-9])(${body})(?=$|[^a-z0-9])`, "i");
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function candidatePhrases(ingredientName: string): string[] {
  const normalized = normalizeText(ingredientName.replace(/\([^)]*\)/g, ""));
  if (!normalized) return [];

  const tokens = normalized.split(" ");
  const coreTokens = tokens.filter((token) => !DESCRIPTOR_WORDS.has(token));
  const phrases = [normalized];

  if (coreTokens.length >= 2) {
    phrases.push(coreTokens.join(" "));
    phrases.push(coreTokens.slice(-2).join(" "));
    phrases.push(coreTokens.at(-1)!);
  }

  if (coreTokens.length === 1) {
    phrases.push(coreTokens[0]);
  }

  if (tokens.length > 2) phrases.push(tokens.slice(-2).join(" "));

  return unique(phrases).sort((a, b) => b.length - a.length);
}

function flattenIngredientGroups(groups: IngredientGroup[]): Candidate[] {
  return groups.flatMap((group, groupIndex) =>
    group.ingredients.map((ingredient, ingredientIndex) => ({
      ingredient,
      key: `${groupIndex}-${ingredientIndex}-${normalizeText(ingredient.ingredient)}`,
      phrases: candidatePhrases(ingredient.ingredient),
    }))
  );
}

function matchesHint(stepHints: string[] | undefined, ingredientName: string): boolean {
  if (!stepHints?.length) return false;
  const normalizedIngredient = normalizeText(ingredientName);
  const ingredientTokens = new Set(normalizedIngredient.split(" "));

  return stepHints.some((hint) => {
    const normalizedHint = normalizeText(hint);
    if (!normalizedHint) return false;
    if (normalizedHint === normalizedIngredient) return true;

    const hintTokens = normalizedHint.split(" ").filter((token) => !DESCRIPTOR_WORDS.has(token));
    if (hintTokens.length < 2) return false;
    return hintTokens.every((token) => ingredientTokens.has(token));
  });
}

function findPhraseInText(text: string, phrase: string) {
  const regex = phraseRegExp(phrase);
  const match = regex.exec(text);
  if (!match || match.index === undefined) return null;

  const start = match.index + match[1].length;
  const matchText = match[2];
  return {
    start,
    end: start + matchText.length,
    matchText,
  };
}

function hasAmbiguousPhrase(phrase: string, candidate: Candidate, allCandidates: Candidate[]) {
  return allCandidates.some(
    (other) =>
      other.key !== candidate.key && other.phrases.some((otherPhrase) => otherPhrase === phrase)
  );
}

function isPartialUse(text: string, start?: number, end?: number): boolean {
  if (PARTIAL_USE_PATTERN.test(text)) {
    const windowStart = Math.max(0, (start ?? 0) - 48);
    const windowEnd = Math.min(text.length, (end ?? text.length) + 48);
    return PARTIAL_USE_PATTERN.test(text.slice(windowStart, windowEnd));
  }
  return false;
}

function amountLabel(ingredient: Ingredient, usage: "full" | "partial"): string {
  if (usage === "partial") return "partial";
  return [ingredient.amount, ingredient.units].filter(Boolean).join(" ").trim();
}

export function matchIngredientReferences(
  step: InstructionStep,
  ingredientGroups: IngredientGroup[] | undefined,
  detailText = step.detail
): IngredientStepReference[] {
  if (!ingredientGroups?.length || !detailText.trim()) return [];

  const candidates = flattenIngredientGroups(ingredientGroups);
  const references: IngredientStepReference[] = [];
  const occupied: Array<{ start: number; end: number }> = [];

  for (const candidate of candidates) {
    const hinted = matchesHint(step.ingredients, candidate.ingredient.ingredient);
    let bestMatch: ReturnType<typeof findPhraseInText> | null = null;
    let bestPhrase = "";

    for (const phrase of candidate.phrases) {
      if (!hinted && hasAmbiguousPhrase(phrase, candidate, candidates)) continue;
      const match = findPhraseInText(detailText, phrase);
      if (!match) continue;
      bestMatch = match;
      bestPhrase = phrase;
      break;
    }

    if (!bestMatch && !hinted) continue;

    const overlaps =
      bestMatch &&
      occupied.some(({ start, end }) => bestMatch!.start < end && bestMatch!.end > start);
    if (overlaps) continue;

    const usage = isPartialUse(detailText, bestMatch?.start, bestMatch?.end) ? "partial" : "full";
    const label = amountLabel(candidate.ingredient, usage);

    if (!label && !hinted) continue;

    if (bestMatch) occupied.push({ start: bestMatch.start, end: bestMatch.end });

    references.push({
      key: candidate.key,
      ingredient: candidate.ingredient,
      matchText: bestMatch?.matchText,
      start: bestMatch?.start,
      end: bestMatch?.end,
      amountLabel: label,
      usage,
      confidence: hinted || bestPhrase.split(" ").length >= 2 ? "high" : "medium",
    });
  }

  return references.sort(
    (a, b) => (a.start ?? Number.MAX_SAFE_INTEGER) - (b.start ?? Number.MAX_SAFE_INTEGER)
  );
}
