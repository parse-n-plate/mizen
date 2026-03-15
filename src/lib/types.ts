export interface Ingredient {
  amount: string;
  units: string;
  ingredient: string;
  description?: string;
  substitutions?: string[];
  alerts?: string[];
}

export interface IngredientGroup {
  groupName: string;
  ingredients: Ingredient[];
}

export interface TimeMarker {
  text: string; // exact substring from detail, e.g. "15 minutes"
  seconds: number; // duration in seconds
}

export interface InstructionStep {
  title: string;
  detail: string;
  timeMinutes?: number;
  timers?: TimeMarker[];
  ingredients?: string[];
  tips?: string;
  imageUrl?: string;
}

export interface ParsedRecipe {
  title: string;
  summary?: string;
  author?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  ingredients: IngredientGroup[];
  instructions: InstructionStep[];
  sourceUrl?: string;
  imageUrl?: string;
  imageTranscription?: string;
  sourceSiteDescription?: string;
  commentConsensus?: string;
}

export interface ParserResult {
  success: boolean;
  data?: ParsedRecipe;
  error?: string;
  method: "json-ld" | "json-ld+ai" | "ai" | "image" | "text" | "none";
}

export interface SavedRecipe {
  id: string;
  slug: string;
  recipe: ParsedRecipe;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}
