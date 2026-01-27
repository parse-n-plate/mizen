import lzString from 'lz-string';
import type { ParsedRecipe } from '@/contexts/RecipeContext';

// 30 days in milliseconds
const SHARE_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Minimal recipe structure for URL encoding.
 * We use short keys to reduce URL length after compression.
 */
interface MinimalRecipe {
  t: string;                    // title
  a?: string;                   // author
  u?: string;                   // sourceUrl
  i: {                          // ingredients
    g: string;                  // groupName
    l: { a?: string; u?: string; n: string }[]; // amount, units, name (ingredient)
  }[];
  s: Array<string | {           // instructions (steps)
    t?: string;                 // title
    d: string;                  // detail
    m?: number;                 // timeMinutes
    g?: string[];               // ingredients (used in step)
    p?: string;                 // tips
  }>;
  m?: {                         // metadata
    sv?: number;                // servings
    pt?: number;                // prepTimeMinutes
    ct?: number;                // cookTimeMinutes
    tt?: number;                // totalTimeMinutes
    c?: string[];               // cuisine
    sm?: string;                // summary
  };
  x: number;                    // expiresAt timestamp
}

/**
 * Generate a URL-friendly slug from a recipe title.
 * @param title - The recipe title
 * @returns URL-safe slug
 */
export function generateSlug(title: string): string {
  if (!title) return 'recipe';

  return title
    .toLowerCase()
    .trim()
    // Replace common separators with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove special characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '')
    // Limit length to keep URLs reasonable
    .slice(0, 50)
    // If empty after processing, use a default
    || 'recipe';
}

/**
 * Convert a full ParsedRecipe to minimal format for URL encoding.
 * Excludes large data like images to keep URLs manageable.
 */
function toMinimalRecipe(recipe: ParsedRecipe): MinimalRecipe {
  const expiresAt = Date.now() + SHARE_EXPIRATION_MS;

  const minimal: MinimalRecipe = {
    t: recipe.title || 'Untitled Recipe',
    i: (recipe.ingredients || []).map(group => ({
      g: group.groupName,
      l: group.ingredients.map(ing => ({
        a: ing.amount || undefined,
        u: ing.units || undefined,
        n: ing.ingredient,
      })),
    })),
    s: (recipe.instructions || []).map(inst => {
      if (typeof inst === 'string') {
        return inst;
      }
      return {
        t: inst.title || undefined,
        d: inst.detail,
        m: inst.timeMinutes || undefined,
        g: inst.ingredients || undefined,
        p: inst.tips || undefined,
      };
    }),
    x: expiresAt,
  };

  // Only include optional fields if they have values
  if (recipe.author) minimal.a = recipe.author;
  if (recipe.sourceUrl && !recipe.sourceUrl.startsWith('image:')) {
    minimal.u = recipe.sourceUrl;
  }

  // Build metadata object only if there's data
  const metadata: MinimalRecipe['m'] = {};
  if (recipe.servings) metadata.sv = recipe.servings;
  if (recipe.prepTimeMinutes) metadata.pt = recipe.prepTimeMinutes;
  if (recipe.cookTimeMinutes) metadata.ct = recipe.cookTimeMinutes;
  if (recipe.totalTimeMinutes) metadata.tt = recipe.totalTimeMinutes;
  if (recipe.cuisine && recipe.cuisine.length > 0) metadata.c = recipe.cuisine;
  if (recipe.summary) metadata.sm = recipe.summary;

  if (Object.keys(metadata).length > 0) {
    minimal.m = metadata;
  }

  return minimal;
}

/**
 * Convert minimal recipe format back to full ParsedRecipe.
 */
function fromMinimalRecipe(minimal: MinimalRecipe): ParsedRecipe {
  return {
    title: minimal.t,
    author: minimal.a,
    sourceUrl: minimal.u,
    ingredients: minimal.i.map(group => ({
      groupName: group.g,
      ingredients: group.l.map(ing => ({
        amount: ing.a || '',
        units: ing.u || '',
        ingredient: ing.n,
      })),
    })),
    instructions: minimal.s.map(inst => {
      if (typeof inst === 'string') {
        return inst;
      }
      return {
        title: inst.t || '',
        detail: inst.d,
        timeMinutes: inst.m,
        ingredients: inst.g,
        tips: inst.p,
      };
    }),
    servings: minimal.m?.sv,
    prepTimeMinutes: minimal.m?.pt,
    cookTimeMinutes: minimal.m?.ct,
    totalTimeMinutes: minimal.m?.tt,
    cuisine: minimal.m?.c,
    summary: minimal.m?.sm,
  };
}

/**
 * Encode a recipe for URL sharing.
 * Compresses recipe data and makes it URL-safe.
 *
 * @param recipe - The full recipe to encode
 * @returns Compressed, URL-safe string
 */
export function encodeRecipeForUrl(recipe: ParsedRecipe): string {
  const minimal = toMinimalRecipe(recipe);
  const json = JSON.stringify(minimal);
  return lzString.compressToEncodedURIComponent(json);
}

/**
 * Result of decoding a shared recipe URL.
 */
export interface DecodeResult {
  success: boolean;
  recipe?: ParsedRecipe;
  error?: 'expired' | 'invalid' | 'corrupted';
  expiresAt?: number;
}

/**
 * Decode a recipe from URL-encoded data.
 * Validates structure and checks expiration.
 *
 * @param encoded - The compressed, URL-safe string from query param
 * @returns Decode result with recipe or error
 */
export function decodeRecipeFromUrl(encoded: string): DecodeResult {
  if (!encoded) {
    return { success: false, error: 'invalid' };
  }

  try {
    // Decompress the data
    const json = lzString.decompressFromEncodedURIComponent(encoded);

    if (!json) {
      return { success: false, error: 'corrupted' };
    }

    // Parse JSON
    const minimal = JSON.parse(json) as MinimalRecipe;

    // Validate required fields
    if (!minimal.t || !minimal.i || !minimal.s || !minimal.x) {
      return { success: false, error: 'invalid' };
    }

    // Check expiration
    if (Date.now() > minimal.x) {
      return {
        success: false,
        error: 'expired',
        expiresAt: minimal.x,
      };
    }

    // Convert to full recipe
    const recipe = fromMinimalRecipe(minimal);

    return {
      success: true,
      recipe,
      expiresAt: minimal.x,
    };
  } catch (error) {
    console.error('Failed to decode shared recipe:', error);
    return { success: false, error: 'corrupted' };
  }
}

/**
 * Generate a shareable URL for a recipe.
 *
 * @param recipe - The recipe to share
 * @param baseUrl - Optional base URL (defaults to window.location.origin)
 * @returns The full shareable URL
 */
export function generateShareableUrl(recipe: ParsedRecipe, baseUrl?: string): string {
  const slug = generateSlug(recipe.title || '');
  const encoded = encodeRecipeForUrl(recipe);
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  return `${base}/r/${slug}?d=${encoded}`;
}
