"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BetaAuthModal } from "@/components/BetaAuthModal";
import { useRecipe } from "@/context/RecipeContext";
import type { ParsedRecipe } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

const EXAMPLE_RECIPES: { emoji: string; time: string; recipe: ParsedRecipe }[] = [
  {
    emoji: "🍝",
    time: "25 min",
    recipe: {
      title: "Classic Carbonara",
      summary:
        "A rich, creamy Roman pasta made with eggs, cheese, guanciale, and black pepper — no cream needed.",
      author: "Bon Appetit",
      servings: 4,
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      totalTimeMinutes: 25,
      sourceUrl: "https://www.bonappetit.com/recipe/simple-carbonara",
      ingredients: [
        {
          groupName: "Pasta",
          ingredients: [
            { amount: "1", units: "lb", ingredient: "spaghetti" },
            { amount: "", units: "", ingredient: "kosher salt" },
          ],
        },
        {
          groupName: "Sauce",
          ingredients: [
            { amount: "4", units: "oz", ingredient: "guanciale, cut into small pieces" },
            { amount: "4", units: "large", ingredient: "egg yolks" },
            { amount: "2", units: "whole", ingredient: "eggs" },
            { amount: "1.5", units: "cups", ingredient: "Pecorino Romano, finely grated" },
            { amount: "1", units: "tsp", ingredient: "freshly cracked black pepper" },
          ],
        },
      ],
      instructions: [
        {
          title: "Cook the pasta",
          detail:
            "Bring a large pot of heavily salted water to a boil. Cook spaghetti until just shy of al dente, about 1 minute less than package directions. Reserve 1½ cups pasta water before draining.",
        },
        {
          title: "Render the guanciale",
          detail:
            "While pasta cooks, place guanciale in a cold large skillet. Cook over medium heat, stirring occasionally, until the fat renders and the pieces are golden and crisp, about 7 minutes. Remove from heat.",
        },
        {
          title: "Make the egg mixture",
          detail:
            "Whisk egg yolks, whole eggs, and most of the Pecorino (save some for serving) in a medium bowl. Add plenty of freshly cracked black pepper.",
        },
        {
          title: "Combine everything",
          detail:
            "Add drained pasta to the skillet with guanciale. Toss over low heat for 30 seconds. Remove from heat entirely, then pour in the egg mixture, tossing vigorously. Add splashes of reserved pasta water until you have a glossy, creamy sauce that coats each strand.",
        },
        {
          title: "Serve",
          detail:
            "Divide among warmed bowls. Top with remaining Pecorino and more cracked black pepper. Serve immediately.",
        },
      ],
    },
  },
  {
    emoji: "🍛",
    time: "35 min",
    recipe: {
      title: "Thai Green Curry",
      summary:
        "A fragrant, coconut-based curry with tender chicken, Thai basil, and vegetables — faster than takeout.",
      author: "RecipeTin Eats",
      servings: 4,
      prepTimeMinutes: 10,
      cookTimeMinutes: 25,
      totalTimeMinutes: 35,
      sourceUrl: "https://www.recipetineats.com/thai-green-curry/",
      ingredients: [
        {
          groupName: "Curry",
          ingredients: [
            { amount: "1.5", units: "lbs", ingredient: "boneless skinless chicken thighs, sliced" },
            { amount: "3", units: "tbsp", ingredient: "green curry paste" },
            { amount: "1", units: "can (14 oz)", ingredient: "coconut milk" },
            { amount: "1", units: "cup", ingredient: "chicken broth" },
            { amount: "2", units: "tbsp", ingredient: "fish sauce" },
            { amount: "1", units: "tbsp", ingredient: "brown sugar" },
            { amount: "1", units: "cup", ingredient: "Thai basil leaves" },
            { amount: "1", units: "", ingredient: "red bell pepper, sliced" },
            { amount: "1", units: "cup", ingredient: "bamboo shoots, drained" },
            { amount: "2", units: "tbsp", ingredient: "vegetable oil" },
            { amount: "4", units: "", ingredient: "kaffir lime leaves" },
          ],
        },
        {
          groupName: "To serve",
          ingredients: [
            { amount: "3", units: "cups", ingredient: "jasmine rice, cooked" },
            { amount: "1", units: "", ingredient: "lime, cut into wedges" },
          ],
        },
      ],
      instructions: [
        {
          title: "Bloom the curry paste",
          detail:
            "Heat oil in a large skillet or wok over medium-high heat. Add the green curry paste and stir-fry for 1 minute until fragrant.",
        },
        {
          title: "Cook the chicken",
          detail:
            "Add sliced chicken and cook for 3 minutes, tossing to coat in the paste, until the outside turns white.",
        },
        {
          title: "Build the sauce",
          detail:
            "Pour in coconut milk and chicken broth. Add fish sauce, brown sugar, and kaffir lime leaves. Stir and bring to a simmer.",
        },
        {
          title: "Add vegetables",
          detail:
            "Add bell pepper and bamboo shoots. Simmer for 10–12 minutes until the chicken is cooked through and the sauce has thickened slightly.",
        },
        {
          title: "Finish and serve",
          detail:
            "Remove from heat and stir in Thai basil until just wilted. Serve over jasmine rice with lime wedges on the side.",
        },
      ],
    },
  },
  {
    emoji: "🍪",
    time: "30 min",
    recipe: {
      title: "Chocolate Chip Cookies",
      summary:
        "Thick, chewy chocolate chip cookies with crispy edges and gooey centers — the only recipe you need.",
      author: "Sally's Baking Addiction",
      servings: 36,
      prepTimeMinutes: 15,
      cookTimeMinutes: 12,
      totalTimeMinutes: 30,
      sourceUrl: "https://sallysbakingaddiction.com/chewy-chocolate-chip-cookies/",
      ingredients: [
        {
          groupName: "Dry ingredients",
          ingredients: [
            { amount: "2.25", units: "cups", ingredient: "all-purpose flour" },
            { amount: "1", units: "tsp", ingredient: "baking soda" },
            { amount: "1", units: "tsp", ingredient: "fine sea salt" },
            { amount: "1", units: "tsp", ingredient: "cornstarch" },
          ],
        },
        {
          groupName: "Wet ingredients",
          ingredients: [
            { amount: "0.75", units: "cup", ingredient: "unsalted butter, melted" },
            { amount: "0.75", units: "cup", ingredient: "packed light brown sugar" },
            { amount: "0.5", units: "cup", ingredient: "granulated sugar" },
            { amount: "1", units: "large", ingredient: "egg plus 1 egg yolk" },
            { amount: "2", units: "tsp", ingredient: "vanilla extract" },
            { amount: "1.25", units: "cups", ingredient: "semi-sweet chocolate chips" },
          ],
        },
      ],
      instructions: [
        {
          title: "Mix dry ingredients",
          detail:
            "Whisk flour, baking soda, salt, and cornstarch together in a medium bowl. Set aside.",
        },
        {
          title: "Make the dough",
          detail:
            "In a large bowl, whisk the melted butter, brown sugar, and granulated sugar until smooth. Add the egg, egg yolk, and vanilla, whisking until combined. Pour the dry ingredients into the wet and mix with a rubber spatula until a soft dough forms. Fold in the chocolate chips.",
        },
        {
          title: "Chill the dough",
          detail:
            "Cover the dough and chill in the refrigerator for at least 30 minutes (or up to 3 days). This step is essential for thick cookies.",
        },
        {
          title: "Bake",
          detail:
            "Preheat oven to 325°F (163°C). Line baking sheets with parchment paper. Scoop 1.5 tablespoon-sized balls of dough and place 3 inches apart. Bake for 11–13 minutes until edges are barely set and centers look undone.",
        },
        {
          title: "Cool",
          detail:
            "Let cookies cool on the baking sheet for 10 minutes — they'll continue to set. Transfer to a wire rack. Cookies stay fresh in an airtight container for up to 1 week.",
        },
      ],
    },
  },
];

export function GettingStarted() {
  const [authOpen, setAuthOpen] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState<string | null>(null);
  const { setRecipe, setIsLoading } = useRecipe();
  const router = useRouter();

  const handleTryRecipe = (recipe: ParsedRecipe) => {
    setLoadingTitle(recipe.title);
    setIsLoading(true);
    setTimeout(() => {
      setRecipe(recipe);
      setIsLoading(false);
      setLoadingTitle(null);
      router.push("/recipe");
    }, 800);
  };

  return (
    <>
      <section className="page-fade-in-up page-fade-delay-3 w-full max-w-3xl space-y-8">
        {/* Example recipes */}
        <div>
          <p className="mb-3 text-center font-sans text-sm font-medium text-stone-500 dark:text-stone-400">
            Try one
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {EXAMPLE_RECIPES.map((example) => {
              const isActive = loadingTitle === example.recipe.title;
              return (
                <button
                  key={example.recipe.title}
                  onClick={() => handleTryRecipe(example.recipe)}
                  disabled={!!loadingTitle}
                  className="press-scale flex flex-col items-start gap-1 rounded-2xl border border-stone-200 dark:border-stone-700 bg-[var(--color-cream)] px-4 py-3.5 text-left transition-all hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-sm disabled:opacity-50"
                >
                  <span className="text-xl leading-none">{example.emoji}</span>
                  <span className="font-sans text-[14px] font-medium text-stone-900 dark:text-stone-100 leading-snug">
                    {example.recipe.title}
                  </span>
                  <span className="font-sans text-xs text-stone-400 dark:text-stone-500">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1">
                        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Parsing...
                      </span>
                    ) : (
                      example.time
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sign up CTA */}
        {isSupabaseConfigured && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setAuthOpen(true)}
              className="press-scale rounded-xl bg-stone-900 dark:bg-stone-100 px-5 py-2.5 font-sans text-sm font-medium text-white dark:text-stone-900 transition-colors hover:bg-stone-800 dark:hover:bg-stone-200"
            >
              Sign in
            </button>
            <span className="font-sans text-sm text-stone-400 dark:text-stone-500">
              to save your recipes
            </span>
          </div>
        )}
      </section>

      {isSupabaseConfigured && (
        <BetaAuthModal open={authOpen} onOpenChange={setAuthOpen} />
      )}
    </>
  );
}
