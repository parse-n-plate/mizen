import type { ParsedRecipe } from "@/lib/types";

/** The example recipe shown on the sunset homepage. */
export const SUNSET_EXAMPLE_RECIPE: ParsedRecipe = {
  title: "Classic Carbonara",
  summary:
    "A rich, creamy Roman pasta made with eggs, cheese, guanciale, and black pepper — no cream needed.",
  author: "Bon Appetit",
  servings: 4,
  prepTimeMinutes: 10,
  cookTimeMinutes: 15,
  totalTimeMinutes: 25,
  sourceUrl: "https://www.bonappetit.com/recipe/simple-carbonara",
  sourceSiteDescription:
    "Bon Appétit is a monthly food and entertaining magazine founded in 1956. Known for thoroughly tested recipes, restaurant reviews, and cooking videos with a loyal following.",
  commentConsensus:
    "Commenters love this recipe for its simplicity and authentic flavor. Many suggest using the full amount of pepper and reserving extra pasta water. A few note that guanciale can be hard to find — pancetta works in a pinch but changes the flavor. Consensus: a reliable weeknight go-to that tastes restaurant-quality.",
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
        { amount: "4", units: "", ingredient: "large eggs" },
        { amount: "1", units: "cup", ingredient: "Pecorino Romano, finely grated" },
        { amount: "2", units: "tsp", ingredient: "freshly ground black pepper" },
      ],
    },
  ],
  instructions: [
    {
      title: "Boil pasta",
      detail:
        "Bring a large pot of salted water to a rolling boil. Cook spaghetti according to package directions until al dente. Reserve 1 cup of pasta water before draining.",
    },
    {
      title: "Crisp the guanciale",
      detail:
        "While pasta cooks, add guanciale to a cold skillet. Cook over medium heat, stirring occasionally, until the fat renders and pieces are golden and crispy, about 7 minutes.",
    },
    {
      title: "Make the sauce",
      detail:
        "In a bowl, whisk together eggs and Pecorino Romano until smooth. Season generously with black pepper.",
    },
    {
      title: "Combine",
      detail:
        "Add drained pasta to the skillet with guanciale (off heat). Pour egg mixture over pasta and toss vigorously, adding splashes of pasta water until you get a creamy, glossy coating. Serve immediately.",
    },
  ],
};
