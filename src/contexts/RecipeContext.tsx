'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { updateRecipe as updateRecipeInStorage } from '@/lib/storage';

// Represents a single step in the parsed recipe with a human-friendly title
export interface InstructionStep {
  title: string; // Short, high-level step title (e.g., "Make the broth")
  detail: string; // Full instruction text for the step
  timeMinutes?: number;
  ingredients?: string[];
  tips?: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  ingredientsNeeded?: string[];
  toolsNeeded?: string[];
  timerMinutes?: number;
  timerLabel?: string;
  tips?: string;
}

export interface ParsedRecipe {
  id?: string;                   // Recipe ID (for syncing with recent recipes)
  title?: string;
  description?: string;          // NEW: Recipe description
  summary?: string;             // NEW: AI-generated recipe summary (1-2 sentences)
  imageUrl?: string;              // NEW: Recipe image URL
  imageData?: string;             // NEW: Base64 image data for uploaded images
  imageFilename?: string;         // NEW: Original filename for uploaded images
  author?: string;                // NEW: Recipe author/source
  publishedDate?: string;         // NEW: Publication date
  sourceUrl?: string;             // NEW: Source URL
  cookTimeMinutes?: number;       // NEW: Cook time in minutes
  prepTimeMinutes?: number;       // NEW: Prep time in minutes
  totalTimeMinutes?: number;      // NEW: Total time in minutes
  servings?: number;             // NEW: Number of servings
  cuisine?: string[];            // NEW: Cuisine types/tags
  // Storage guidance - generated during initial parse (top-level for immediate access)
  storageGuide?: string;         // Storage instructions from initial AI parse
  shelfLife?: {
    fridge?: number | null;      // Days in fridge (null if not fridge-safe)
    freezer?: number | null;     // Days in freezer (null if not freezer-friendly)
  };
  // Plating/serving guidance - generated during initial parse (top-level for immediate access)
  platingNotes?: string;         // Plating suggestions from initial AI parse
  servingVessel?: string;        // Recommended serving vessel (e.g., "shallow bowl", "plate")
  servingTemp?: string;          // Ideal serving temperature (e.g., "hot", "warm", "room temp", "chilled")
  rating?: number;               // NEW: Recipe rating (1-5)
  skills?: {                    // NEW: Required cooking skills
    techniques?: string[];      // Cooking techniques needed
    knifework?: string[];       // Knife skills needed
  };
  plate?: {                     // NEW: Plate stage data
    // Legacy single photo support (backward compatibility)
    photoData?: string;         // Base64 user plate photo
    photoFilename?: string;     // Original filename
    capturedAt?: string;        // ISO timestamp of photo capture
    // New multi-photo support (up to 5 photos)
    photos?: Array<{
      data: string;
      filename: string;
      capturedAt: string;
      rating?: number;        // 1-5 star rating
    }>;
    // AI-generated guidance
    platingNotes?: string;      // AI-generated plating suggestions
    servingVessel?: string;     // e.g., "shallow bowl", "plate"
    servingTemp?: string;       // e.g., "hot", "room temp", "chilled"
    storageGuide?: string;      // Storage instructions
    shelfLife?: {
      fridge?: number | null;   // days in refrigerator
      freezer?: number | null;  // days in freezer
    };
    storedAt?: string;          // ISO timestamp when stored
    sharedAt?: string[];        // Array of share timestamps
    shareCount?: number;        // Total shares
  };
  ingredients: {
    groupName: string;
    ingredients: {
      amount: string;
      units: string;
      ingredient: string;
      description?: string;
      substitutions?: string[];
    }[];
  }[];
  // Instructions can be legacy strings or new objects with titles
  instructions: Array<string | InstructionStep>;
}

interface RecipeContextType {
  parsedRecipe: ParsedRecipe | null;
  setParsedRecipe: (recipe: ParsedRecipe | null) => void;
  clearRecipe: () => void;
  isLoaded: boolean; // Add this line
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

// --- Helpers to normalize instructions into titled steps for legacy data ---
const normalizeInstructions = (
  instructions?: Array<string | InstructionStep>,
): InstructionStep[] => {
  if (!instructions || !Array.isArray(instructions)) return [];

  const cleanLeading = (text: string): string =>
    (text || '').replace(/^[\s.:;,\-–—]+/, '').trim();

  return instructions
    .map((item, index) => {
      // Handle string inputs (legacy format)
      if (typeof item === 'string') {
        const detail = cleanLeading(item.trim());
        if (!detail) return null;
        // Use generic title for legacy string inputs
        return { title: `Step ${index + 1}`, detail };
      }

      // Handle object inputs (expected format)
      if (item && typeof item === 'object') {
        const title =
          typeof item.title === 'string'
            ? cleanLeading(item.title.trim())
            : `Step ${index + 1}`;
        const legacyText =
          'text' in item && typeof item.text === 'string'
            ? cleanLeading(item.text.trim())
            : '';
        const detail =
          typeof item.detail === 'string'
            ? cleanLeading(item.detail.trim())
            : legacyText;

        if (!detail) return null;

        return {
          title,
          detail,
          timeMinutes: item.timeMinutes,
          ingredients: item.ingredients,
          tips: item.tips,
        } satisfies InstructionStep;
      }

      return null;
    })
    .filter((step): step is InstructionStep => Boolean(step));
};

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load recipe from localStorage after hydration to avoid SSR mismatch
  useEffect(() => {
    const saved = localStorage.getItem('parsedRecipe');
    if (saved) {
      try {
        const loaded = JSON.parse(saved) as ParsedRecipe;
        setParsedRecipe({
          ...loaded,
          instructions: normalizeInstructions(loaded.instructions),
        });
      } catch (error) {
        console.error('Error loading recipe from localStorage:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  const setParsedRecipeWithStorage = (recipe: ParsedRecipe | null) => {
    if (recipe) {
      const normalizedRecipe: ParsedRecipe = {
        ...recipe,
        instructions: normalizeInstructions(recipe.instructions),
      };
      setParsedRecipe(normalizedRecipe);
      localStorage.setItem('parsedRecipe', JSON.stringify(normalizedRecipe));

      // If this recipe has an ID, also update it in recentRecipes
      if (normalizedRecipe.id) {
        console.log('[RecipeContext] 🔄 Syncing recipe to recentRecipes:', {
          recipeId: normalizedRecipe.id,
          hasPlate: !!normalizedRecipe.plate,
          hasPhotoData: !!normalizedRecipe.plate?.photoData,
          photoDataLength: normalizedRecipe.plate?.photoData?.length || 0,
        });
        updateRecipeInStorage(normalizedRecipe.id, normalizedRecipe as Partial<ParsedRecipe>);
      } else {
        console.warn('[RecipeContext] ⚠️ Recipe has no ID, cannot sync to recentRecipes');
      }
    } else {
      setParsedRecipe(null);
      localStorage.removeItem('parsedRecipe');
    }
  };

  const clearRecipe = () => {
    setParsedRecipe(null);
    localStorage.removeItem('parsedRecipe');
  };

  return (
    <RecipeContext.Provider
      value={{
        parsedRecipe,
        setParsedRecipe: setParsedRecipeWithStorage,
        clearRecipe,
        isLoaded, // Add this line
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipe() {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipe must be used within a RecipeProvider');
  }
  return context;
}
