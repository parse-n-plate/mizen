'use client';
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';

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
  rating?: number;               // NEW: Recipe rating (1-5)
  skills?: {                    // NEW: Required cooking skills
    techniques?: string[];      // Cooking techniques needed
    knifework?: string[];       // Knife skills needed
  };
  ingredients: {
    groupName: string;
    ingredients: { amount: string; units: string; ingredient: string }[];
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
          typeof (item as any).title === 'string'
            ? cleanLeading((item as any).title.trim())
            : `Step ${index + 1}`;
        const detail =
          typeof (item as any).detail === 'string'
            ? cleanLeading((item as any).detail.trim())
            : typeof (item as any).text === 'string'
            ? cleanLeading((item as any).text.trim())
            : '';
        
        if (!detail) return null;

        return {
          title,
          detail,
          timeMinutes: (item as any).timeMinutes,
          ingredients: (item as any).ingredients,
          tips: (item as any).tips,
        } satisfies InstructionStep;
      }

      return null;
    })
    .filter((step): step is InstructionStep => Boolean(step));
};

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('parsedRecipe');
    if (saved) {
      try {
        const loaded = JSON.parse(saved) as ParsedRecipe;
        const normalized = {
          ...loaded,
          instructions: normalizeInstructions(loaded.instructions),
        };
        setParsedRecipe(normalized);
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
