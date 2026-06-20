import type { ParsedRecipe } from "@/lib/types";

export type DemoRecipeSlug = "banana-bread-cookies" | "kimchi-ragu";

export const demoRecipes: Record<DemoRecipeSlug, ParsedRecipe> = {
  "banana-bread-cookies": {
    title: "Banana Bread Cookies",
    summary:
      "Crisp-edged, chewy banana bread cookies with brown butter walnuts, gooey banana pieces, and chopped dark chocolate.",
    author: "Mary",
    servings: 17,
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    totalTimeMinutes: 80,
    sourceUrl: "https://flouringkitchen.com/banana-bread-cookies/#recipe",
    sourceSiteDescription:
      "Flouring Kitchen shares baking recipes with detailed process notes and practical troubleshooting tips.",
    commentConsensus:
      "Readers describe these cookies as rich, chewy, and memorable, with several calling them one of the best cookies they have tried.",
    equipment: [{ name: "Cookie sheet", stepNumbers: [8] }],
    ingredients: [
      {
        groupName: "Brown Butter Base",
        ingredients: [
          { amount: "1", units: "cup", ingredient: "unsalted butter" },
          {
            amount: "1/2",
            units: "cup",
            ingredient: "raw walnuts",
            description: "coarsely chopped",
          },
          { amount: "1", units: "teaspoon", ingredient: "ground cinnamon" },
        ],
      },
      {
        groupName: "Dough",
        ingredients: [
          { amount: "1", units: "cup", ingredient: "brown sugar", description: "packed" },
          { amount: "1/4", units: "cup", ingredient: "granulated sugar" },
          { amount: "1", units: "", ingredient: "large egg yolk" },
          { amount: "1", units: "teaspoon", ingredient: "pure vanilla extract" },
          { amount: "1/2", units: "teaspoon", ingredient: "sea salt" },
          { amount: "2", units: "", ingredient: "ripe bananas", description: "divided" },
          { amount: "2", units: "cups", ingredient: "all-purpose flour", description: "240g" },
          { amount: "1/2", units: "teaspoon", ingredient: "baking soda" },
          {
            amount: "3/4",
            units: "cup",
            ingredient: "chopped dark chocolate",
            description: "or chocolate chips",
          },
        ],
      },
      {
        groupName: "Finish",
        ingredients: [
          { amount: "", units: "", ingredient: "flaky salt", description: "for sprinkling" },
        ],
      },
    ],
    instructions: [
      {
        title: "Brown the walnuts",
        detail:
          "Combine the butter and walnuts in a medium saucepan. Melt the butter, then continue cooking as it bubbles, stirring frequently, until the walnuts smell toasty and the milk solids in the butter turn brown.",
        ingredients: ["unsalted butter", "raw walnuts"],
        tips: "Browning butter with walnuts takes longer than browning butter alone. Stir often and watch the color of the milk solids closely.",
      },
      {
        title: "Cool with cinnamon",
        detail:
          "Pour the browned butter and walnuts into a large heat-safe bowl. Whisk in the cinnamon and let the mixture cool for a few minutes.",
        ingredients: ["ground cinnamon"],
      },
      {
        title: "Whisk in sugars",
        detail:
          "Add the brown sugar and granulated sugar to the browned butter mixture. Whisk until evenly combined.",
        ingredients: ["brown sugar", "granulated sugar"],
      },
      {
        title: "Add yolk and banana",
        detail:
          "Add the egg yolk, vanilla, sea salt, and one banana broken into pieces. Whisk until the banana is mostly incorporated into the wet mixture.",
        ingredients: ["large egg yolk", "pure vanilla extract", "sea salt", "ripe bananas"],
        tips: "Use ripe, spotty bananas for the best flavor and texture. Avoid frozen bananas because they release too much water.",
      },
      {
        title: "Form the dough",
        detail:
          "Add the flour and baking soda. Stir until a soft dough forms and no dry streaks remain.",
        ingredients: ["all-purpose flour", "baking soda"],
      },
      {
        title: "Fold in chunks",
        detail:
          "Fold in the chopped chocolate. Break the second banana into coarse pieces and fold it through the dough.",
        ingredients: ["chopped dark chocolate", "ripe bananas"],
      },
      {
        title: "Chill the dough",
        detail: "Refrigerate the cookie dough for 1 hour, until firm enough to scoop.",
        timeMinutes: 60,
      },
      {
        title: "Scoop and bake",
        detail:
          "Preheat the oven to 355°F. Line a baking sheet with parchment paper. Scoop the dough into 2-tablespoon portions and bake in batches for 10 to 12 minutes, leaving room for spreading.",
        timeMinutes: 12,
        timers: [{ text: "10 to 12 minutes", seconds: 720 }],
        ingredients: ["cookie dough"],
      },
      {
        title: "Salt and cool",
        detail:
          "Let the cookies cool on the sheet for a few minutes to firm up. Sprinkle with flaky salt while still hot.",
        ingredients: ["flaky salt"],
        tips: "These are best fresh from the oven, when the edges are the crispiest.",
      },
    ],
  },
  "kimchi-ragu": {
    title: "Kimchi Ragu with Linguine",
    summary:
      "A Korean-Italian ragu where sour kimchi cuts through a rich beef sauce and adds depth to pasta.",
    author: "Shy Chef",
    servings: 4,
    prepTimeMinutes: 30,
    cookTimeMinutes: 60,
    totalTimeMinutes: 90,
    sourceUrl: "https://shychef.com/kimchi-ragu",
    sourceSiteDescription:
      "Shy Chef publishes Korean and fusion recipes with direct home-cooking instructions.",
    ingredients: [
      {
        groupName: "Pasta",
        ingredients: [
          {
            amount: "",
            units: "",
            ingredient: "linguine or pasta of choice",
            description: "cook according to package directions",
          },
        ],
      },
      {
        groupName: "Kimchi Ragu",
        ingredients: [
          { amount: "1", units: "lb", ingredient: "ground beef" },
          { amount: "1 1/2", units: "cups", ingredient: "kimchi", description: "chopped" },
          { amount: "1/2", units: "", ingredient: "carrot", description: "diced" },
          { amount: "1/2", units: "", ingredient: "sweet onion", description: "diced" },
          { amount: "2", units: "", ingredient: "celery sticks", description: "diced" },
          { amount: "4", units: "", ingredient: "tomatoes", description: "diced" },
          { amount: "1", units: "tablespoon", ingredient: "minced garlic" },
          { amount: "1", units: "cup", ingredient: "beef broth" },
          {
            amount: "1/2",
            units: "cup",
            ingredient: "soju, white wine, or red wine",
          },
          { amount: "2", units: "tablespoons", ingredient: "gochujang" },
          { amount: "1", units: "tablespoon", ingredient: "sugar" },
          { amount: "", units: "", ingredient: "salt and pepper", description: "to taste" },
          { amount: "", units: "", ingredient: "neutral oil", description: "for cooking" },
        ],
      },
      {
        groupName: "Garnish",
        ingredients: [
          { amount: "", units: "", ingredient: "chopped parsley" },
          { amount: "", units: "", ingredient: "Parmesan cheese" },
        ],
      },
    ],
    instructions: [
      {
        title: "Prep the vegetables",
        detail:
          "Peel the carrot and onion. Clean the celery and tomatoes. Dice the carrot, celery, onion, and tomatoes into small cubes, then chop the kimchi.",
        ingredients: ["carrot", "sweet onion", "celery sticks", "tomatoes", "kimchi"],
      },
      {
        title: "Sweat the aromatics",
        detail:
          "Heat oil in a large heavy-bottomed saucepan. Add the carrot, celery, and onion and cook for about 10 minutes, until the onion turns translucent and begins to turn golden.",
        timeMinutes: 10,
        ingredients: ["neutral oil", "carrot", "celery sticks", "sweet onion"],
      },
      {
        title: "Brown the garlic",
        detail: "Add the minced garlic and cook until it turns light brown and fragrant.",
        ingredients: ["minced garlic"],
      },
      {
        title: "Cook the kimchi",
        detail:
          "Add the chopped kimchi and cook for 5 minutes. Stir in the sugar to balance the sourness.",
        timeMinutes: 5,
        ingredients: ["kimchi", "sugar"],
        tips: "Old, sour kimchi works best here. Fresh kimchi will not give the sauce the same depth.",
      },
      {
        title: "Brown the beef",
        detail:
          "Add the ground beef, mix it well with the vegetables and kimchi, and cook over high heat for a few minutes until the beef starts to brown.",
        ingredients: ["ground beef"],
      },
      {
        title: "Add gochujang",
        detail: "Stir in the gochujang until it coats the beef and vegetables evenly.",
        ingredients: ["gochujang"],
      },
      {
        title: "Deglaze the pan",
        detail:
          "Pour in the soju or wine. Stir well and cook until the liquid has almost completely evaporated and the bottom of the pan looks nearly dry.",
        ingredients: ["soju, white wine, or red wine"],
      },
      {
        title: "Simmer the sauce",
        detail:
          "Add the diced tomatoes and beef broth. Simmer for at least 30 minutes, stirring occasionally.",
        timeMinutes: 30,
        timers: [{ text: "at least 30 minutes", seconds: 1800 }],
        ingredients: ["tomatoes", "beef broth"],
      },
      {
        title: "Cook the pasta",
        detail:
          "While the sauce simmers, cook the linguine or pasta of choice according to the package directions.",
        ingredients: ["linguine or pasta of choice"],
      },
      {
        title: "Season and serve",
        detail:
          "Taste the ragu and adjust with salt and pepper. Serve the pasta in bowls topped with kimchi ragu, chopped parsley, and Parmesan cheese.",
        ingredients: ["salt and pepper", "chopped parsley", "Parmesan cheese"],
        tips: "Sugar helps balance the sourness of kimchi. Add a little more if the sauce tastes too sharp.",
      },
    ],
  },
};

export function getDemoRecipe(slug: string): ParsedRecipe | null {
  return Object.hasOwn(demoRecipes, slug) ? demoRecipes[slug as DemoRecipeSlug] : null;
}

export function getDemoRecipeSlugs(): DemoRecipeSlug[] {
  return Object.keys(demoRecipes) as DemoRecipeSlug[];
}
