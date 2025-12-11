'use client';

import HomepageSkeleton from '@/components/ui/homepage-skeleton';
import CuisinePills from '@/components/ui/cuisine-pills';
import RecipeCard, { RecipeCardData } from '@/components/ui/recipe-card';
import Footer from '@/components/ui/footer';
import { useState, useEffect, Suspense } from 'react';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import type { ParsedRecipe } from '@/contexts/RecipeContext';
import { useAdminSettings } from '@/contexts/AdminSettingsContext';
import { useRouter } from 'next/navigation';
import type { CuisineType } from '@/components/ui/cuisine-pills';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

// Placeholder recipe data matching the prototype
const PLACEHOLDER_RECIPES: RecipeCardData[] = [
  {
    id: '1',
    title: 'Beef Udon',
    author: 'Namiko Hirasawa Chen',
    cuisine: 'Asian',
    // Use the beef udon placeholder image so the card reflects the recipe
    imageUrl: '/assets/recipeImagePlaceholders/Image (Beef Udon).webp',
  },
  {
    id: '2',
    title: 'Garlic Shrimp Ramen',
    author: 'Cameron Tillman',
    cuisine: 'Asian',
    // Match the ramen card with its placeholder image
    imageUrl: '/assets/recipeImagePlaceholders/Image (Garlic Shrimp Ramen).webp',
  },
  {
    id: '3',
    title: 'Mushroom Risotto',
    author: 'Darrell Schroeder',
    cuisine: 'Italian',
  },
  {
    id: '4',
    title: 'Chicken Tikka Masala',
    author: 'Priya Sharma',
    cuisine: 'Indian',
  },
  {
    id: '5',
    title: 'Coq au Vin',
    author: 'Jean-Pierre Dubois',
    cuisine: 'French',
  },
  {
    id: '6',
    title: 'Tacos al Pastor',
    author: 'Maria Rodriguez',
    cuisine: 'Mexican',
  },
  {
    id: '7',
    title: 'Pad Thai',
    author: 'Somsak Wong',
    cuisine: 'Asian',
    // Pair the Pad Thai card with the Pad Thai placeholder image
    imageUrl: '/assets/recipeImagePlaceholders/Image (Pad Thai).webp',
  },
  {
    id: '8',
    title: 'Margherita Pizza',
    author: 'Giuseppe Rossi',
    cuisine: 'Italian',
  },
  {
    id: '9',
    title: 'Bibimbap',
    author: 'Kim Soo-jin',
    cuisine: 'Korean',
  },
];

// Comprehensive Pad Thai mock that fills every ParsedRecipe field
const PAD_THAI_MOCK: ParsedRecipe = {
  title: 'Pad Thai with Tamarind Sauce',
  description:
    'A balanced, street-style Pad Thai with chewy rice noodles, sweet-sour tamarind sauce, and crunchy peanuts.',
  imageUrl: '/assets/recipeImagePlaceholders/Image (Pad Thai).webp',
  author: 'Chef Somsak Wong',
  publishedDate: '2024-06-12',
  sourceUrl: 'https://example.com/mock-pad-thai',
  prepTimeMinutes: 15,
  cookTimeMinutes: 20,
  totalTimeMinutes: 35,
  servings: 4,
  cuisine: ['Thai', 'Asian', 'Noodles'],
  rating: 4.8,
  skills: {
    techniques: ['Stir-frying', 'Tossing noodles', 'Balancing sweet-sour'],
    knifework: ['Thin slicing', 'Rough chop', 'Mincing aromatics'],
  },
  ingredients: [
    {
      groupName: 'Pad Thai Sauce',
      ingredients: [
        { amount: '3', units: 'tbsp', ingredient: 'tamarind paste' },
        { amount: '3', units: 'tbsp', ingredient: 'fish sauce' },
        { amount: '2', units: 'tbsp', ingredient: 'palm sugar' },
        { amount: '1', units: 'tbsp', ingredient: 'rice vinegar' },
        { amount: '1', units: 'tsp', ingredient: 'chili flakes' },
        { amount: '2', units: 'tbsp', ingredient: 'warm water (to loosen)' },
      ],
    },
    {
      groupName: 'Noodles & Protein',
      ingredients: [
        { amount: '8', units: 'oz', ingredient: 'dried rice noodles (3 mm)' },
        { amount: '12', units: 'oz', ingredient: 'boneless chicken thighs, thinly sliced' },
        { amount: '1', units: 'cup', ingredient: 'firm tofu, diced' },
        { amount: '2', units: 'large', ingredient: 'eggs, lightly beaten' },
        { amount: '2', units: 'tbsp', ingredient: 'neutral oil (divided)' },
      ],
    },
    {
      groupName: 'Aromatics & Veg',
      ingredients: [
        { amount: '3', units: 'cloves', ingredient: 'garlic, minced' },
        { amount: '2', units: '', ingredient: 'shallots, thinly sliced' },
        { amount: '4', units: '', ingredient: 'green onions, cut into 1-inch pieces' },
        { amount: '1', units: 'cup', ingredient: 'bean sprouts' },
      ],
    },
    {
      groupName: 'Garnish',
      ingredients: [
        { amount: '1/2', units: 'cup', ingredient: 'roasted peanuts, crushed' },
        { amount: '1', units: '', ingredient: 'lime, cut into wedges' },
        { amount: '1/4', units: 'cup', ingredient: 'cilantro leaves' },
        { amount: '1', units: '', ingredient: 'red chili, thinly sliced (optional)' },
      ],
    },
  ],
  instructions: [
    {
      title: 'Soak the noodles',
      detail:
        'Soak rice noodles in warm water for 20-30 minutes until pliable but not fully soft. Drain and pat dry before cooking.',
      timeMinutes: 20,
      ingredients: ['Rice noodles'],
      tips: 'Do not boil; soaked-only noodles stay springy and avoid clumping.',
    },
    {
      title: 'Mix the sauce',
      detail:
        'In a bowl, whisk tamarind paste, fish sauce, palm sugar, rice vinegar, chili flakes, and warm water until dissolved.',
      timeMinutes: 5,
      ingredients: ['Tamarind paste', 'Fish sauce', 'Palm sugar', 'Rice vinegar'],
      tips: 'Taste and balance: add more sugar for sweetness or tamarind for tang.',
    },
    {
      title: 'Sear protein and tofu',
      detail:
        'Heat 1 tbsp oil in a wok over medium-high. Sear chicken and tofu until browned and just cooked through, 5-6 minutes. Season with a pinch of salt. Push to one side.',
      timeMinutes: 6,
      ingredients: ['Chicken thighs', 'Firm tofu', 'Neutral oil'],
      tips: 'Keep heat high to avoid steaming; work in batches if crowded.',
    },
    {
      title: 'Scramble the eggs',
      detail:
        'Add a small splash of oil if the pan looks dry. Pour in beaten eggs and softly scramble into ribbons. Keep in the pan.',
      timeMinutes: 2,
      ingredients: ['Eggs', 'Neutral oil'],
      tips: 'Pull the eggs just before fully set so they stay tender.',
    },
    {
      title: 'Bloom aromatics',
      detail:
        'Add garlic and shallots. Stir-fry 30-45 seconds until fragrant but not browned.',
      timeMinutes: 1,
      ingredients: ['Garlic', 'Shallots'],
      tips: 'If garlic starts to darken, lower the heat briefly.',
    },
    {
      title: 'Toss noodles with sauce',
      detail:
        'Add soaked noodles and pour in the sauce. Toss continuously for 2-3 minutes until noodles turn glossy and just tender. Splash 1-2 tbsp water if they look dry.',
      timeMinutes: 3,
      ingredients: ['Soaked noodles', 'Pad Thai sauce'],
      tips: 'Keep noodles moving to prevent sticking; stop when al dente.',
    },
    {
      title: 'Finish with vegetables',
      detail:
        'Add bean sprouts and green onions. Toss 30-60 seconds to wilt slightly while keeping crunch.',
      timeMinutes: 1,
      ingredients: ['Bean sprouts', 'Green onions'],
      tips: 'Remove from heat once greens brighten to keep texture.',
    },
    {
      title: 'Plate and garnish',
      detail:
        'Divide into bowls. Top with crushed peanuts, cilantro, and sliced chili. Serve with lime wedges to squeeze over.',
      timeMinutes: 2,
      ingredients: ['Roasted peanuts', 'Cilantro', 'Lime wedges', 'Red chili'],
      tips: 'A fresh lime squeeze just before eating brightens everything.',
    },
  ],
};

function HomeContent() {
  const {
    isLoaded,
    recentRecipes,
    getRecipeById,
    clearRecipes,
    removeRecipe,
  } = useParsedRecipes();
  const { settings } = useAdminSettings();
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType>('Asian');
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeCardData[]>([]);

  // Filter recipes based on selected cuisine
  useEffect(() => {
    if (selectedCuisine === 'All') {
      setFilteredRecipes(PLACEHOLDER_RECIPES);
    } else {
      const filtered = PLACEHOLDER_RECIPES.filter(
        (recipe) => recipe.cuisine === selectedCuisine,
      );
      setFilteredRecipes(filtered);
    }
  }, [selectedCuisine]);

  // Initialize filtered recipes on mount
  useEffect(() => {
    setFilteredRecipes(
      PLACEHOLDER_RECIPES.filter((recipe) => recipe.cuisine === 'Asian'),
    );
  }, []);

  // Provide a full mock experience for the Pad Thai Trending card
  const handlePadThaiClick = () => {
    setParsedRecipe(PAD_THAI_MOCK);
    router.push('/parsed-recipe-page');
  };

  const handleCuisineChange = (cuisine: CuisineType) => {
    setSelectedCuisine(cuisine);
  };

  // Handler for clearing all recipes with confirmation
  const handleClearRecipes = () => {
    // Show confirmation dialog before clearing
    const confirmed = window.confirm(
      'Are you sure you want to clear all recent recipes? This action cannot be undone.',
    );

    if (confirmed) {
      // Call the clearRecipes function from context
      clearRecipes();
    }
  };

  // Handle recent recipe click - navigate to parsed recipe page
  const handleRecentRecipeClick = (recipeId: string) => {
    try {
      const fullRecipe = getRecipeById(recipeId);
      if (fullRecipe && fullRecipe.ingredients && fullRecipe.instructions) {
        setParsedRecipe({
          title: fullRecipe.title,
          ingredients: fullRecipe.ingredients,
          instructions: fullRecipe.instructions,
          author: fullRecipe.author, // Include author if available
          sourceUrl: fullRecipe.sourceUrl || fullRecipe.url, // Include source URL if available
        });
        router.push('/parsed-recipe-page');
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
    }
  };

  const handleRemoveRecentRecipe = (recipeId: string) => {
    removeRecipe(recipeId);
  };

  // Convert ParsedRecipe to RecipeCardData format
  const convertToRecipeCardData = (recipe: typeof recentRecipes[0]): RecipeCardData => {
    // Extract domain name from URL as a simple "author" placeholder
    let author = 'Recipe';
    try {
      if (recipe.url) {
        const urlObj = new URL(recipe.url);
        author = urlObj.hostname.replace('www.', '').split('.')[0];
        // Capitalize first letter
        author = author.charAt(0).toUpperCase() + author.slice(1);
      }
    } catch {
      // If URL parsing fails, use default
    }

    return {
      id: recipe.id,
      title: recipe.title,
      author: author,
      imageUrl: recipe.imageUrl, // Optional image support when available
      cuisine: undefined,
    };
  };

  // Get recent recipes for display (limit to 6 most recent)
  const displayRecentRecipes = recentRecipes.slice(0, 6).map(convertToRecipeCardData);

  if (!isLoaded) {
    return <HomepageSkeleton />;
  }

  return (
    <div className="bg-white min-h-screen relative flex flex-col">

      <div className="transition-opacity duration-300 ease-in-out opacity-100 relative z-10 flex-1">
        {/* Main Content Container */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-12 md:pt-16 pb-12 md:pb-16 flex flex-col gap-12 md:gap-16">
          {/* Hero Section */}
          <div className="text-center space-y-4 md:space-y-5">
              {/* App Name */}
              <p className="font-domine text-[16px] md:text-[18px] font-normal text-[#5a5a5a] tracking-[0.08em] uppercase leading-[1.2] mb-4">
                Mis San Plas
              </p>
              <h1 className="font-domine text-[48px] md:text-[72px] font-normal text-black leading-[1.05] mb-4">
                Cook with confidence,
                <span className="block"> from prep to plate.</span>
              </h1>
            <p className="font-albert text-[16px] md:text-[18px] text-stone-700 leading-[1.5] max-w-2xl mx-auto">
                Structured steps, helpful cues, and guidance for every stage of the process.
              </p>
          </div>

          {/* Recent Recipes Section */}
          {displayRecentRecipes.length > 0 && (
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-3 md:space-y-4">
                {/* Header with title and Clear All button */}
                <div className="flex items-center justify-between">
                  <h2 className="font-domine text-[24px] md:text-[32px] font-normal text-black leading-[1.1]">
                    Recent Recipes
                  </h2>
                  {/* Clear All button - positioned to the right */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearRecipes}
                    className="flex items-center gap-2 font-albert text-[14px] text-[#757575] hover:text-[#1e1e1e]"
                    aria-label="Clear all recent recipes"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear All</span>
                  </Button>
                </div>
                <p className="font-albert text-[16px] text-stone-600 leading-[1.4]">
                  Fresh pulls from your kitchen queue
                </p>
              </div>

              {/* Recent Recipe Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayRecentRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    showImage={settings.showRecentRecipeImages}
                    onClick={() => handleRecentRecipeClick(recipe.id)}
                    showDelete
                    onDelete={() => handleRemoveRecentRecipe(recipe.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Trending Recipes Section */}
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
              <div className="space-y-3 md:space-y-4">
                <h2 className="font-domine text-[24px] md:text-[32px] font-normal text-black leading-[1.1]">
                  Trending Recipes
                </h2>
              </div>

              {/* Cuisine Filter Pills now sit closer to the Trending header */}
              <CuisinePills onCuisineChange={handleCuisineChange} />
            </div>

            {/* Recipe Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={recipe.id === '7' ? handlePadThaiClick : undefined}
                />
              ))}
            </div>

            {/* Show message if no recipes match filter */}
            {filteredRecipes.length === 0 && (
              <div className="text-center py-12">
                <p className="font-albert text-[16px] text-stone-600">
                  No recipes found for {selectedCuisine}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomepageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
