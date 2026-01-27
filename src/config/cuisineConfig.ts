/**
 * Central Cuisine Configuration
 * 
 * This file serves as the single source of truth for all supported cuisines.
 * To add a new cuisine:
 * 1. Add the cuisine name to SUPPORTED_CUISINES array
 * 2. Add the icon file to /public/assets/cusineIcons/[Cuisine]_Icon.png
 * 3. Add the mapping to CUISINE_ICON_MAP
 * 
 * The cuisine will automatically appear in filters and be detectable by the AI parser.
 */

// Cuisine categories matching the prototype
export const SUPPORTED_CUISINES = [
  'Chinese',
  'Italian',
  'Mexican',
  'Mediterranean',
  'French',
  'Indian',
  'Japanese',
  'Korean',
  'Hawaiian',
  'Thai',
  'Vietnamese',
  'Greek',
  'American',
  'Southern',
  'Spanish',
  'Middle Eastern',
  'Caribbean',
  'Ethiopian',
] as const;

// Placeholder icon for cuisines without custom icons
export const PLACEHOLDER_CUISINE_ICON = '/assets/cusineIcons/Placeholder_Icon.svg';

// Mapping cuisine names to their icon file paths
// Note: Meditareain_Icon.png has a typo in the filename but matches Mediterranean cuisine
// Cuisines without icons will use the placeholder
export const CUISINE_ICON_MAP: Record<string, string> = {
  'Chinese': '/assets/cusineIcons/Chinese_Icon.png',
  'Italian': '/assets/cusineIcons/Italian_Icon.png',
  'Mexican': '/assets/cusineIcons/Mexican_Icon.png',
  'Mediterranean': '/assets/cusineIcons/Meditareain_Icon.png',
  'French': '/assets/cusineIcons/French_Icon.png',
  'Indian': '/assets/cusineIcons/Indian_Icon.png',
  'Japanese': '/assets/cusineIcons/Japanese_Icon.png',
  'Korean': '/assets/cusineIcons/Korean_Icon.png',
  'Hawaiian': '/assets/cusineIcons/Hawaiian_Icon.png',
  'Thai': PLACEHOLDER_CUISINE_ICON,
  'Vietnamese': PLACEHOLDER_CUISINE_ICON,
  'Greek': PLACEHOLDER_CUISINE_ICON,
  'American': PLACEHOLDER_CUISINE_ICON,
  'Southern': PLACEHOLDER_CUISINE_ICON,
  'Spanish': PLACEHOLDER_CUISINE_ICON,
  'Middle Eastern': PLACEHOLDER_CUISINE_ICON,
  'Caribbean': PLACEHOLDER_CUISINE_ICON,
  'Ethiopian': PLACEHOLDER_CUISINE_ICON,
};

// TypeScript type for supported cuisine names
export type SupportedCuisine = (typeof SUPPORTED_CUISINES)[number];

// Helper function to check if a string is a supported cuisine
export function isSupportedCuisine(cuisine: string): cuisine is SupportedCuisine {
  return SUPPORTED_CUISINES.includes(cuisine as SupportedCuisine);
}

// Helper function to get cuisine icon path (returns empty string if not found)
export function getCuisineIcon(cuisine: string): string {
  return CUISINE_ICON_MAP[cuisine] || '';
}

