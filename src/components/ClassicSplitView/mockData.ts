import { RecipeStep } from './types';

export const MOCK_RECIPE_STEPS: RecipeStep[] = [
  {
    step: "Prepare the bread",
    detail: "Cut bread into 1-inch cubes and let sit out overnight to dry.",
    time: 5,
    ingredients: ["1 loaf stale bread"],
    tips: "Day-old bread works best. Fresh bread will make soggy stuffing.",
  },
  {
    step: "Chop vegetables",
    detail: "Dice Chinese sausage and slice leeks into thin half-moons.",
    time: 10,
    ingredients: ["2 Chinese sausages", "3 leeks, white parts only"],
    tips: "Rinse leeks thoroughly to remove dirt between layers.",
  },
  {
    step: "Toast the bread",
    detail: "Spread bread cubes on a baking sheet and toast at 350°F until golden.",
    time: 15,
    ingredients: ["Bread cubes from step 1"],
    tips: "Watch carefully in the last 5 minutes to prevent burning.",
  },
  {
    step: "Sauté mixture",
    detail: "Melt butter in a large skillet and cook sausage and leeks until soft.",
    time: 8,
    ingredients: ["4 tbsp butter", "Sausage and leeks from step 2"],
    tips: "Medium heat works best to avoid burning the butter.",
  },
];





