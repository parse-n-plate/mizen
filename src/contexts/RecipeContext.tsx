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
  imageUrl?: string;              // NEW: Recipe image URL
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
const deriveStepTitle = (text: string): string => {
  const trimmed = text?.trim() || '';
  if (!trimmed) return 'Step';
  const firstSentenceMatch = trimmed.match(/^([^.!?]+[.!?]?)/);
  if (firstSentenceMatch) {
    const firstSentence = firstSentenceMatch[1].trim();
    return firstSentence.replace(/[.!?]+$/, '') || 'Step';
  }
  return trimmed;
};

const normalizeInstructions = (
  instructions?: Array<string | InstructionStep>,
): InstructionStep[] => {
  if (!instructions || !Array.isArray(instructions)) return [];

  const stripLeadingTitle = (title: string, detail: string): string => {
    if (!title) return detail;
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const stripped = detail.replace(
      new RegExp(`^${escaped}\\s*[:\\-–—]?\\s*`, 'i'),
      '',
    ).trim();
    return stripped.length > 0 ? stripped : detail;
  };

  return instructions
    .map((item) => {
      if (typeof item === 'string') {
        const detail = item.trim();
        if (!detail) return null;
        const autoTitle = deriveStepTitle(detail);
        const title = autoTitle || 'Step';
        const cleanedDetail = stripLeadingTitle(title, detail);
        return { title, detail: cleanedDetail };
      }

      if (item && typeof item === 'object') {
        const title =
          typeof (item as any).title === 'string'
            ? (item as any).title.trim()
            : '';
        const detail =
          typeof (item as any).detail === 'string'
            ? (item as any).detail.trim()
            : '';
        if (!detail) return null;
        const autoTitle = deriveStepTitle(detail);
        const chosenTitle = autoTitle || 'Step';
        const cleanedDetail = stripLeadingTitle(chosenTitle, detail);
        return {
          title: chosenTitle,
          detail: cleanedDetail,
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
