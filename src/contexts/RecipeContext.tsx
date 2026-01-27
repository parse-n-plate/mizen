'use client';
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/211f35f0-b7c4-4493-a3d1-13dbeecaabb1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecipeContext.tsx:136',message:'setParsedRecipeWithStorage entry',data:{hasServings:'servings' in recipe,servings:recipe.servings,hasAuthor:'author' in recipe,author:recipe.author,keys:Object.keys(recipe)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const normalizedRecipe: ParsedRecipe = {
        ...recipe,
        instructions: normalizeInstructions(recipe.instructions),
      };
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/211f35f0-b7c4-4493-a3d1-13dbeecaabb1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecipeContext.tsx:142',message:'normalizedRecipe before storage',data:{hasServings:'servings' in normalizedRecipe,servings:normalizedRecipe.servings,keys:Object.keys(normalizedRecipe)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
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
        updateRecipeInStorage(normalizedRecipe.id, normalizedRecipe as any);
      } else {
        console.warn('[RecipeContext] ⚠️ Recipe has no ID, cannot sync to recentRecipes');
      }

      // #region agent log
      const stored = localStorage.getItem('parsedRecipe');
      const parsed = stored ? JSON.parse(stored) : null;
      fetch('http://127.0.0.1:7242/ingest/211f35f0-b7c4-4493-a3d1-13dbeecaabb1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecipeContext.tsx:143',message:'After localStorage.setItem',data:{hasServings:parsed&&'servings' in parsed,servings:parsed?.servings,servingsType:typeof parsed?.servings,normalizedRecipeServings:normalizedRecipe.servings,normalizedRecipeServingsType:typeof normalizedRecipe.servings,storedKeys:parsed?Object.keys(parsed):[],normalizedKeys:Object.keys(normalizedRecipe)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
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
