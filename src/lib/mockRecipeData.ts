import { ParsedRecipe } from '@/contexts/RecipeContext';
import { ParsedRecipe as StorageParsedRecipe } from '@/lib/storage';

/**
 * MOCK RECIPE DATA
 *
 * ⚠️ NOTE: This is dummy data for UI development purposes.
 * Replace this with real API calls or database queries when ready.
 *
 * This file contains mock recipe data organized by cuisine categories
 * to populate the landing page's featured recipes section.
 */

// ---------------------------------------------------------------------------
// Test Fixtures — seed data for Prototype Lab
// ---------------------------------------------------------------------------

export interface TestFixture {
  label: string;
  description: string;
  tags: string[];
  recipe: Omit<StorageParsedRecipe, 'id' | 'parsedAt'> & { servings?: number };
}

export const TEST_FIXTURE_RECIPES: TestFixture[] = [
  // 1. Minimal Recipe
  {
    label: 'Minimal Recipe',
    description: 'Only required fields — no author, cuisine, timing, or image',
    tags: ['minimal', 'no-metadata'],
    recipe: {
      title: 'Simple Boiled Eggs',
      summary: 'The simplest possible recipe for testing minimal data.',
      url: 'https://test-fixtures.dev/minimal-recipe',
      ingredients: [
        {
          groupName: 'Ingredients',
          ingredients: [
            { amount: '4', units: '', ingredient: 'large eggs' },
            { amount: '6', units: 'cups', ingredient: 'water' },
          ],
        },
      ],
      instructions: [
        { title: 'Boil', detail: 'Place eggs in boiling water for 10 minutes. Transfer to ice bath.' },
      ],
    },
  },

  // 2. Rich Recipe (All Fields)
  {
    label: 'Rich Recipe (All Fields)',
    description: 'Every optional field populated including plate data and storage',
    tags: ['rich', 'all-fields', 'plate'],
    recipe: {
      title: 'Pan-Seared Duck Breast with Cherry Reduction',
      summary: 'A richly detailed French-Mediterranean duck dish for testing all fields.',
      description: 'An elegant pan-seared duck breast with a tart cherry reduction sauce, perfect for a special occasion dinner.',
      url: 'https://test-fixtures.dev/rich-recipe',
      author: 'Chef Jean-Pierre',
      sourceUrl: 'https://example.com/duck-breast',
      cuisine: ['French', 'Mediterranean'],
      prepTimeMinutes: 20,
      cookTimeMinutes: 25,
      totalTimeMinutes: 45,
      servings: 4,
      imageUrl: '/assets/images/beef-udon.jpg',
      storageGuide: 'Store in airtight container. Slice before reheating for best results.',
      shelfLife: { fridge: 3, freezer: 30 },
      plate: {
        platingNotes: 'Fan slices across plate, drizzle cherry reduction. Garnish with microgreens and a sprig of thyme.',
        servingVessel: 'wide rimmed plate',
        servingTemp: 'warm',
      },
      ingredients: [
        {
          groupName: 'Duck',
          ingredients: [
            { amount: '2', units: '', ingredient: 'duck breasts (skin-on)' },
            { amount: '1', units: 'tsp', ingredient: 'flaky sea salt' },
            { amount: '1/2', units: 'tsp', ingredient: 'black pepper' },
            { amount: '1', units: 'tbsp', ingredient: 'fresh thyme leaves' },
          ],
        },
        {
          groupName: 'Cherry Reduction',
          ingredients: [
            { amount: '1', units: 'cup', ingredient: 'fresh cherries, pitted' },
            { amount: '1/2', units: 'cup', ingredient: 'dry red wine' },
            { amount: '2', units: 'tbsp', ingredient: 'honey' },
            { amount: '1', units: 'tbsp', ingredient: 'balsamic vinegar' },
          ],
        },
        {
          groupName: 'Garnish',
          ingredients: [
            { amount: '1', units: 'cup', ingredient: 'microgreens' },
            { amount: '4', units: 'sprigs', ingredient: 'fresh thyme' },
          ],
        },
      ],
      instructions: [
        { title: 'Score the duck', detail: 'Score the skin of the duck breasts in a crosshatch pattern, being careful not to cut into the meat. Season generously with salt and pepper.', timeMinutes: 5, ingredients: ['duck breasts', 'sea salt', 'black pepper'], tips: 'Cold duck scores more cleanly — work straight from the fridge.' },
        { title: 'Sear skin-side down', detail: 'Place duck breasts skin-side down in a cold pan. Turn heat to medium and render fat for 8-10 minutes until skin is deeply golden and crisp.', timeMinutes: 10, ingredients: ['duck breasts'], tips: 'Starting in a cold pan renders more fat and gives crispier skin.' },
        { title: 'Flip and finish', detail: 'Flip breasts and cook 3-4 minutes for medium-rare. Rest for 5 minutes before slicing.', timeMinutes: 8, ingredients: ['duck breasts'] },
        { title: 'Make the reduction', detail: 'In the same pan, add cherries, wine, honey, and balsamic. Simmer until thickened to a glossy sauce, about 5 minutes.', timeMinutes: 5, ingredients: ['cherries', 'red wine', 'honey', 'balsamic vinegar'] },
        { title: 'Plate and serve', detail: 'Slice duck on the bias. Fan across plates, spoon cherry reduction over top. Garnish with microgreens and thyme sprigs.', ingredients: ['microgreens', 'thyme'], tips: 'Warm plates in the oven beforehand for restaurant-quality presentation.' },
      ],
    },
  },

  // 3. Long Recipe (20+ Steps)
  {
    label: 'Long Recipe (20+ Steps)',
    description: '22 instruction steps and 4 ingredient groups — tests scrolling and step nav',
    tags: ['long', 'many-steps', 'Italian'],
    recipe: {
      title: 'Handmade Four-Layer Lasagna',
      summary: 'A complex Italian lasagna with handmade pasta, bolognese, bechamel, and assembly.',
      url: 'https://test-fixtures.dev/long-recipe',
      author: 'Nonna Rosa',
      cuisine: ['Italian'],
      prepTimeMinutes: 90,
      cookTimeMinutes: 60,
      totalTimeMinutes: 150,
      servings: 8,
      imageUrl: '/assets/images/mushroom-risotto.jpg',
      ingredients: [
        {
          groupName: 'Fresh Pasta Dough',
          ingredients: [
            { amount: '3', units: 'cups', ingredient: 'tipo 00 flour' },
            { amount: '4', units: '', ingredient: 'large eggs' },
            { amount: '1', units: 'tbsp', ingredient: 'olive oil' },
            { amount: '1', units: 'pinch', ingredient: 'salt' },
          ],
        },
        {
          groupName: 'Bolognese Sauce',
          ingredients: [
            { amount: '1', units: 'lb', ingredient: 'ground beef' },
            { amount: '1/2', units: 'lb', ingredient: 'ground pork' },
            { amount: '1', units: '', ingredient: 'onion, diced' },
            { amount: '2', units: '', ingredient: 'carrots, diced' },
            { amount: '2', units: 'stalks', ingredient: 'celery, diced' },
            { amount: '4', units: 'cloves', ingredient: 'garlic, minced' },
            { amount: '1', units: 'can (28 oz)', ingredient: 'San Marzano tomatoes' },
            { amount: '1/2', units: 'cup', ingredient: 'red wine' },
            { amount: '2', units: 'tbsp', ingredient: 'tomato paste' },
          ],
        },
        {
          groupName: 'Bechamel Sauce',
          ingredients: [
            { amount: '4', units: 'tbsp', ingredient: 'unsalted butter' },
            { amount: '1/4', units: 'cup', ingredient: 'all-purpose flour' },
            { amount: '3', units: 'cups', ingredient: 'whole milk' },
            { amount: '1/4', units: 'tsp', ingredient: 'nutmeg' },
          ],
        },
        {
          groupName: 'Assembly & Topping',
          ingredients: [
            { amount: '2', units: 'cups', ingredient: 'fresh mozzarella, torn' },
            { amount: '1', units: 'cup', ingredient: 'Parmigiano-Reggiano, grated' },
            { amount: '1/4', units: 'cup', ingredient: 'fresh basil leaves' },
          ],
        },
      ],
      instructions: [
        { title: 'Make the dough', detail: 'Mound flour on a clean surface. Create a well in the center and crack in eggs. Add olive oil and salt.' },
        { title: 'Knead the dough', detail: 'Using a fork, gradually incorporate flour into the eggs. Knead by hand for 8-10 minutes until smooth and elastic.', timeMinutes: 10 },
        { title: 'Rest the dough', detail: 'Wrap dough in plastic wrap and rest at room temperature for 30 minutes.', timeMinutes: 30 },
        { title: 'Roll pasta sheets', detail: 'Divide dough into 4 pieces. Roll each through a pasta machine, starting at widest setting and working down to second-thinnest.' },
        { title: 'Cut pasta to size', detail: 'Cut pasta sheets to fit your baking dish. Dust with flour and set aside on parchment paper.' },
        { title: 'Brown the meat', detail: 'Heat olive oil in a large Dutch oven over medium-high heat. Brown beef and pork, breaking into small pieces. Remove and set aside.', timeMinutes: 8 },
        { title: 'Cook soffritto', detail: 'In the same pot, add onion, carrots, and celery. Cook until softened, about 5 minutes.', timeMinutes: 5 },
        { title: 'Add garlic', detail: 'Add minced garlic and cook until fragrant, about 1 minute.', timeMinutes: 1 },
        { title: 'Deglaze with wine', detail: 'Pour in red wine and scrape up any browned bits. Simmer until reduced by half.', timeMinutes: 3 },
        { title: 'Add tomatoes', detail: 'Add tomato paste and stir for 1 minute. Add crushed San Marzano tomatoes.', timeMinutes: 1 },
        { title: 'Return the meat', detail: 'Return the browned meat to the pot. Stir to combine with the tomato mixture.' },
        { title: 'Simmer bolognese', detail: 'Bring to a simmer, then reduce heat to low. Cook uncovered for 45 minutes, stirring occasionally.', timeMinutes: 45, tips: 'Low and slow develops richer flavor.' },
        { title: 'Start bechamel', detail: 'Melt butter in a saucepan over medium heat. Add flour and whisk for 2 minutes to cook the roux.', timeMinutes: 2 },
        { title: 'Add milk gradually', detail: 'Pour in milk a little at a time, whisking constantly to prevent lumps.' },
        { title: 'Thicken bechamel', detail: 'Continue whisking over medium heat until sauce thickens and coats the back of a spoon, about 5 minutes. Season with nutmeg, salt, and pepper.', timeMinutes: 5 },
        { title: 'Blanch pasta sheets', detail: 'Bring a large pot of salted water to a boil. Cook pasta sheets for 1 minute, then transfer to an ice bath. Lay flat on towels.', timeMinutes: 3 },
        { title: 'Preheat oven', detail: 'Preheat oven to 375\u00b0F (190\u00b0C). Grease a 9x13 baking dish.' },
        { title: 'Layer 1', detail: 'Spread a thin layer of bolognese on the bottom. Top with pasta sheets, more bolognese, bechamel, and mozzarella.' },
        { title: 'Layer 2', detail: 'Add another layer of pasta, bolognese, bechamel, and mozzarella.' },
        { title: 'Layer 3', detail: 'Repeat: pasta, bolognese, bechamel, mozzarella.' },
        { title: 'Final layer', detail: 'Top with remaining pasta sheets, bechamel, and a generous coating of Parmigiano-Reggiano.' },
        { title: 'Bake the lasagna', detail: 'Cover with foil and bake for 25 minutes. Remove foil and bake another 20 minutes until golden and bubbling. Rest 15 minutes before serving.', timeMinutes: 60, tips: 'Resting is essential — it lets the layers set so slices hold together.' },
      ],
    },
  },

  // 4. Short Recipe (2 Steps)
  {
    label: 'Short Recipe (2 Steps)',
    description: 'Just 2 instructions and 1 ingredient group — tests compact layouts',
    tags: ['short', 'quick', 'Hawaiian'],
    recipe: {
      title: 'Hawaiian Poke Bowl',
      summary: 'A quick poke bowl with minimal steps.',
      url: 'https://test-fixtures.dev/short-recipe',
      cuisine: ['Hawaiian'],
      prepTimeMinutes: 10,
      servings: 1,
      ingredients: [
        {
          groupName: 'Bowl',
          ingredients: [
            { amount: '1', units: 'cup', ingredient: 'sushi rice, cooked' },
            { amount: '6', units: 'oz', ingredient: 'sushi-grade ahi tuna, cubed' },
            { amount: '2', units: 'tbsp', ingredient: 'soy sauce' },
            { amount: '1', units: 'tsp', ingredient: 'sesame oil' },
            { amount: '2', units: '', ingredient: 'green onions, sliced' },
          ],
        },
      ],
      instructions: [
        { title: 'Marinate fish', detail: 'Toss cubed tuna with soy sauce and sesame oil. Let sit 5 minutes.', timeMinutes: 5 },
        { title: 'Assemble bowl', detail: 'Place rice in a bowl. Top with marinated tuna and sliced green onions.' },
      ],
    },
  },

  // 5. No Timing Data
  {
    label: 'No Timing Data',
    description: 'No prep/cook/total time — tests missing time display',
    tags: ['no-timing', 'Mexican'],
    recipe: {
      title: 'Classic Guacamole',
      summary: 'Simple guacamole with no timing information.',
      url: 'https://test-fixtures.dev/no-timing',
      author: 'Maria Garcia',
      cuisine: ['Mexican'],
      servings: 4,
      ingredients: [
        {
          groupName: 'Ingredients',
          ingredients: [
            { amount: '3', units: '', ingredient: 'ripe avocados' },
            { amount: '1', units: '', ingredient: 'lime, juiced' },
            { amount: '1/4', units: 'cup', ingredient: 'white onion, finely diced' },
            { amount: '2', units: 'tbsp', ingredient: 'fresh cilantro, chopped' },
            { amount: '1', units: '', ingredient: 'jalapeno, seeded and minced' },
            { amount: '1/2', units: 'tsp', ingredient: 'salt' },
          ],
        },
      ],
      instructions: [
        { title: 'Mash avocados', detail: 'Halve avocados and scoop into a bowl. Mash with a fork to desired consistency.' },
        { title: 'Season', detail: 'Squeeze in lime juice. Add onion, cilantro, jalapeno, and salt. Stir gently to combine.' },
        { title: 'Serve', detail: 'Taste and adjust seasoning. Serve immediately with tortilla chips.' },
      ],
    },
  },

  // 6. No Image
  {
    label: 'No Image',
    description: 'No imageUrl or imageData — tests placeholder/fallback rendering',
    tags: ['no-image', 'Indian'],
    recipe: {
      title: 'Chicken Tikka Masala',
      summary: 'A creamy Indian curry without any image data.',
      url: 'https://test-fixtures.dev/no-image',
      author: 'Priya Sharma',
      cuisine: ['Indian'],
      prepTimeMinutes: 30,
      cookTimeMinutes: 40,
      totalTimeMinutes: 70,
      servings: 6,
      ingredients: [
        {
          groupName: 'Marinade',
          ingredients: [
            { amount: '2', units: 'lbs', ingredient: 'boneless chicken thighs' },
            { amount: '1', units: 'cup', ingredient: 'yogurt' },
            { amount: '2', units: 'tbsp', ingredient: 'lemon juice' },
            { amount: '2', units: 'tsp', ingredient: 'garam masala' },
            { amount: '1', units: 'tsp', ingredient: 'turmeric' },
          ],
        },
        {
          groupName: 'Sauce',
          ingredients: [
            { amount: '2', units: 'tbsp', ingredient: 'butter' },
            { amount: '1', units: '', ingredient: 'onion, diced' },
            { amount: '3', units: 'cloves', ingredient: 'garlic, minced' },
            { amount: '1', units: 'can (14 oz)', ingredient: 'crushed tomatoes' },
            { amount: '1', units: 'cup', ingredient: 'heavy cream' },
            { amount: '2', units: 'tsp', ingredient: 'garam masala' },
            { amount: '1', units: 'tsp', ingredient: 'smoked paprika' },
          ],
        },
      ],
      instructions: [
        { title: 'Marinate chicken', detail: 'Combine chicken with yogurt, lemon juice, garam masala, and turmeric. Refrigerate for at least 1 hour.', timeMinutes: 60 },
        { title: 'Grill chicken', detail: 'Thread chicken onto skewers and grill or broil until charred, about 5 minutes per side.', timeMinutes: 10 },
        { title: 'Make sauce base', detail: 'Melt butter in a large pan. Saute onion until soft, add garlic and cook 1 minute more.', timeMinutes: 6 },
        { title: 'Simmer sauce', detail: 'Add crushed tomatoes, garam masala, and paprika. Simmer 15 minutes. Stir in heavy cream.', timeMinutes: 15 },
        { title: 'Combine and serve', detail: 'Add grilled chicken to the sauce. Simmer 10 minutes. Serve over basmati rice with naan.', timeMinutes: 10 },
      ],
    },
  },

  // 7. Unicode Title
  {
    label: 'Unicode Title',
    description: 'Accents, CJK characters, and em-dashes in title — tests text rendering',
    tags: ['unicode', 'special-chars', 'Korean'],
    recipe: {
      title: "Bibimbap \ube44\ube54\ubc25 \u2014 Rice & Veggies",
      summary: 'Korean mixed rice bowl with a Unicode-rich title for text rendering tests.',
      url: 'https://test-fixtures.dev/unicode-title',
      cuisine: ['Korean'],
      prepTimeMinutes: 30,
      cookTimeMinutes: 15,
      servings: 2,
      ingredients: [
        {
          groupName: 'Rice & Protein',
          ingredients: [
            { amount: '2', units: 'cups', ingredient: 'short-grain rice, cooked' },
            { amount: '1/2', units: 'lb', ingredient: 'ground beef' },
            { amount: '2', units: 'tbsp', ingredient: 'soy sauce' },
            { amount: '1', units: 'tsp', ingredient: 'sesame oil' },
          ],
        },
        {
          groupName: 'Toppings',
          ingredients: [
            { amount: '1', units: 'cup', ingredient: 'spinach, blanched' },
            { amount: '1', units: '', ingredient: 'carrot, julienned' },
            { amount: '1', units: '', ingredient: 'zucchini, sliced' },
            { amount: '2', units: '', ingredient: 'eggs' },
            { amount: '2', units: 'tbsp', ingredient: 'gochujang' },
          ],
        },
      ],
      instructions: [
        { title: 'Season beef', detail: 'Combine ground beef with soy sauce and sesame oil. Cook in a skillet until browned.', timeMinutes: 5 },
        { title: 'Saute vegetables', detail: 'Saute each vegetable separately with a drizzle of sesame oil. Season lightly with salt.', timeMinutes: 10 },
        { title: 'Fry eggs', detail: 'Fry eggs sunny-side up in a non-stick pan.', timeMinutes: 3 },
        { title: 'Assemble bowls', detail: 'Divide rice between bowls. Arrange beef, vegetables, and egg on top. Serve with gochujang on the side.' },
      ],
    },
  },

  // 8. Long Title (Truncation Test)
  {
    label: 'Long Title (Truncation)',
    description: 'Extremely long recipe title — tests truncation in sidebar, cards, and headers',
    tags: ['long-title', 'truncation', 'Chinese'],
    recipe: {
      title: "Grandma Wong's Traditional Hand-Pulled Lanzhou Beef Noodle Soup with Slow-Braised Five-Spice Broth and House-Made Chili Oil",
      summary: 'An absurdly long title to test truncation across the entire UI.',
      url: 'https://test-fixtures.dev/long-title',
      cuisine: ['Chinese'],
      cookTimeMinutes: 180,
      servings: 6,
      ingredients: [
        {
          groupName: 'Broth',
          ingredients: [
            { amount: '3', units: 'lbs', ingredient: 'beef bones' },
            { amount: '1', units: 'lb', ingredient: 'beef shank' },
            { amount: '10', units: 'cups', ingredient: 'water' },
            { amount: '3', units: '', ingredient: 'star anise' },
            { amount: '1', units: 'stick', ingredient: 'cinnamon' },
          ],
        },
        {
          groupName: 'Noodles & Garnish',
          ingredients: [
            { amount: '1', units: 'lb', ingredient: 'hand-pulled noodles' },
            { amount: '4', units: 'stalks', ingredient: 'green onions' },
            { amount: '2', units: 'tbsp', ingredient: 'chili oil' },
            { amount: '1/4', units: 'cup', ingredient: 'fresh cilantro' },
          ],
        },
      ],
      instructions: [
        { title: 'Blanch bones', detail: 'Blanch beef bones in boiling water for 5 minutes. Drain and rinse to remove impurities.', timeMinutes: 5 },
        { title: 'Simmer broth', detail: 'Combine blanched bones, beef shank, water, and spices. Bring to a boil, then reduce to a gentle simmer for 3 hours.', timeMinutes: 180, tips: 'Skim scum regularly for a clear broth.' },
        { title: 'Cook noodles', detail: 'Pull or boil noodles according to their type. Cook until chewy, about 2 minutes for fresh noodles.', timeMinutes: 2 },
        { title: 'Assemble and serve', detail: 'Place noodles in bowls. Ladle hot broth over top. Garnish with sliced beef, green onions, cilantro, and chili oil.' },
      ],
    },
  },

  // 9. Large Ingredient List (30+)
  {
    label: 'Large Ingredient List (30+)',
    description: '33 ingredients across 5 groups — tests ingredient list scrolling and scaling',
    tags: ['many-ingredients', 'Japanese'],
    recipe: {
      title: 'Elaborate Sushi Platter',
      summary: 'A sushi platter with an extensive ingredient list for UI stress testing.',
      url: 'https://test-fixtures.dev/large-ingredients',
      author: 'Chef Tanaka',
      cuisine: ['Japanese'],
      prepTimeMinutes: 60,
      cookTimeMinutes: 30,
      totalTimeMinutes: 90,
      servings: 4,
      ingredients: [
        {
          groupName: 'Sushi Rice',
          ingredients: [
            { amount: '3', units: 'cups', ingredient: 'Japanese short-grain rice' },
            { amount: '3', units: 'cups', ingredient: 'water' },
            { amount: '1/3', units: 'cup', ingredient: 'rice vinegar' },
            { amount: '2', units: 'tbsp', ingredient: 'sugar' },
            { amount: '1', units: 'tsp', ingredient: 'salt' },
            { amount: '1', units: 'piece', ingredient: 'kombu (kelp)' },
          ],
        },
        {
          groupName: 'Nigiri Toppings',
          ingredients: [
            { amount: '4', units: 'oz', ingredient: 'sushi-grade salmon' },
            { amount: '4', units: 'oz', ingredient: 'sushi-grade tuna' },
            { amount: '4', units: 'oz', ingredient: 'yellowtail (hamachi)' },
            { amount: '4', units: 'oz', ingredient: 'cooked shrimp (ebi)' },
            { amount: '4', units: 'oz', ingredient: 'freshwater eel (unagi)' },
            { amount: '4', units: 'oz', ingredient: 'octopus (tako)' },
            { amount: '1', units: 'tbsp', ingredient: 'wasabi paste' },
          ],
        },
        {
          groupName: 'Roll Fillings',
          ingredients: [
            { amount: '1', units: '', ingredient: 'cucumber, julienned' },
            { amount: '1', units: '', ingredient: 'avocado, sliced' },
            { amount: '4', units: 'oz', ingredient: 'cream cheese' },
            { amount: '4', units: 'sticks', ingredient: 'imitation crab' },
            { amount: '1', units: '', ingredient: 'mango, sliced' },
            { amount: '4', units: 'sheets', ingredient: 'nori (seaweed)' },
            { amount: '2', units: 'tbsp', ingredient: 'sesame seeds' },
          ],
        },
        {
          groupName: 'Sauces & Seasonings',
          ingredients: [
            { amount: '1/4', units: 'cup', ingredient: 'soy sauce' },
            { amount: '2', units: 'tbsp', ingredient: 'mirin' },
            { amount: '1', units: 'tbsp', ingredient: 'unagi sauce' },
            { amount: '1', units: 'tbsp', ingredient: 'spicy mayo' },
            { amount: '1', units: 'tbsp', ingredient: 'ponzu' },
            { amount: '1', units: 'tsp', ingredient: 'yuzu juice' },
          ],
        },
        {
          groupName: 'Garnishes',
          ingredients: [
            { amount: '2', units: 'oz', ingredient: 'pickled ginger (gari)' },
            { amount: '1', units: 'tbsp', ingredient: 'tobiko (flying fish roe)' },
            { amount: '1', units: '', ingredient: 'shiso leaf' },
            { amount: '1', units: '', ingredient: 'daikon radish, shredded' },
            { amount: '1', units: 'tbsp', ingredient: 'microgreens' },
            { amount: '1', units: '', ingredient: 'lemon, sliced' },
            { amount: '1', units: 'tsp', ingredient: 'black sesame seeds' },
          ],
        },
      ],
      instructions: [
        { title: 'Prepare sushi rice', detail: 'Rinse rice until water runs clear. Cook with kombu. Season with vinegar mixture while still warm. Fan to cool.', timeMinutes: 30 },
        { title: 'Slice fish', detail: 'Slice each fish into uniform pieces at a slight angle. Keep covered and chilled until ready to use.' },
        { title: 'Prepare roll fillings', detail: 'Julienne cucumber, slice avocado and mango. Cut cream cheese into strips.' },
        { title: 'Form nigiri', detail: 'Wet hands. Shape small mounds of rice. Add a tiny dab of wasabi and drape fish slices over each piece.' },
        { title: 'Roll maki', detail: 'Place nori on a bamboo mat, spread rice, add fillings. Roll tightly, seal with water. Slice into 6-8 pieces.' },
        { title: 'Plate the platter', detail: 'Arrange nigiri, maki, and sashimi on a large wooden board. Garnish with ginger, shiso, tobiko, and microgreens. Serve with soy sauce and wasabi on the side.' },
      ],
    },
  },

  // 10. Legacy String Instructions
  {
    label: 'Legacy String Instructions',
    description: 'Instructions as plain strings (not InstructionStep objects) — tests normalization',
    tags: ['legacy', 'string-format', 'French'],
    recipe: {
      title: 'French Omelette',
      summary: 'A classic French omelette with legacy string-format instructions.',
      url: 'https://test-fixtures.dev/legacy-instructions',
      cuisine: ['French'],
      prepTimeMinutes: 5,
      cookTimeMinutes: 3,
      servings: 1,
      ingredients: [
        {
          groupName: 'Ingredients',
          ingredients: [
            { amount: '3', units: '', ingredient: 'large eggs' },
            { amount: '1', units: 'tbsp', ingredient: 'unsalted butter' },
            { amount: '1', units: 'pinch', ingredient: 'fine salt' },
            { amount: '1', units: 'tbsp', ingredient: 'fresh chives, minced' },
          ],
        },
      ],
      instructions: [
        'Crack eggs into a bowl and whisk vigorously with a fork until yolks and whites are fully combined and slightly frothy. Season with a pinch of salt.',
        'Heat butter in an 8-inch non-stick pan over medium-high heat. Swirl to coat the entire surface. When butter is foaming but not brown, pour in eggs.',
        'Stir eggs gently with a chopstick while shaking the pan. When the bottom is set but the top is still slightly wet, stop stirring and let cook 10 more seconds.',
        'Tilt pan and fold the omelette onto itself in thirds. Slide onto a warm plate, seam-side down. Garnish with chives and serve immediately.',
      ],
    },
  },
];

export interface MockRecipe {
  id: string;
  name: string;
  author: string;
  category: string;
  image: string; // Placeholder image URL - replace with real images
}

// Detailed Mock Parsed Recipe for Design Lab Testing
export const MOCK_PARSED_RECIPE: ParsedRecipe = {
  title: "Classic Beef Udon",
  description: "A comforting Japanese noodle soup with tender beef and savory broth.",
  author: "Namiko Hirasawa Chen",
  cookTimeMinutes: 15,
  prepTimeMinutes: 15,
  totalTimeMinutes: 30,
  servings: 2,
  imageUrl: "/assets/images/beef-udon.jpg",
  sourceUrl: "https://example.com/beef-udon",
  ingredients: [
    {
      groupName: "Soup Base",
      ingredients: [
        { amount: "4", units: "cups", ingredient: "dashi stock" },
        { amount: "2", units: "tbsp", ingredient: "soy sauce" },
        { amount: "2", units: "tbsp", ingredient: "mirin" },
        { amount: "1", units: "tsp", ingredient: "sugar" },
        { amount: "1", units: "pinch", ingredient: "salt" }
      ]
    },
    {
      groupName: "Beef Topping",
      ingredients: [
        { amount: "1/2", units: "lb", ingredient: "thinly sliced beef chuck" },
        { amount: "1", units: "tbsp", ingredient: "sugar" },
        { amount: "1", units: "tbsp", ingredient: "soy sauce" },
        { amount: "1", units: "tbsp", ingredient: "sake" }
      ]
    },
    {
      groupName: "Noodles & Garnish",
      ingredients: [
        { amount: "2", units: "packs", ingredient: "udon noodles" },
        { amount: "2", units: "stalks", ingredient: "green onions" },
        { amount: "2", units: "slices", ingredient: "narutomaki (fish cake)" },
        { amount: "1", units: "tsp", ingredient: "shichimi togarashi" }
      ]
    }
  ],
  instructions: [
    {
      stepNumber: 1,
      instruction: "In a pot, combine dashi stock, 2 tbsp soy sauce, 2 tbsp mirin, 1 tsp sugar, and a pinch of salt. Bring to a gentle boil, then reduce heat to low to keep warm.",
      ingredientsNeeded: ["dashi stock", "soy sauce", "mirin", "sugar", "salt"],
      toolsNeeded: ["pot", "spoon"],
      timerMinutes: 5,
      timerLabel: "Simmer Broth"
    },
    {
      stepNumber: 2,
      instruction: "Heat a frying pan over medium-high heat. Add the sliced beef and cook until browned.",
      ingredientsNeeded: ["thinly sliced beef chuck"],
      toolsNeeded: ["frying pan", "tongs"]
    },
    {
      stepNumber: 3,
      instruction: "Add 1 tbsp sugar, 1 tbsp soy sauce, and 1 tbsp sake to the beef. Cook for another 2-3 minutes until the sauce glazes the meat.",
      ingredientsNeeded: ["sugar", "soy sauce", "sake"],
      toolsNeeded: ["frying pan"],
      timerMinutes: 3,
      timerLabel: "Glaze Beef"
    },
    {
      stepNumber: 4,
      instruction: "In a separate large pot of boiling water, cook the udon noodles according to package instructions (usually 1-2 minutes for frozen/fresh udon). Drain well.",
      ingredientsNeeded: ["udon noodles"],
      toolsNeeded: ["large pot", "colander"],
      timerMinutes: 2,
      timerLabel: "Boil Noodles"
    },
    {
      stepNumber: 5,
      instruction: "Divide the drained noodles into serving bowls. Pour the hot soup broth over the noodles.",
      ingredientsNeeded: [],
      toolsNeeded: ["ladle", "serving bowls"]
    },
    {
      stepNumber: 6,
      instruction: "Top with the seasoned beef, sliced green onions, and narutomaki. Sprinkle with shichimi togarashi if desired. Serve immediately.",
      ingredientsNeeded: ["green onions", "narutomaki (fish cake)", "shichimi togarashi"],
      toolsNeeded: ["chopsticks"]
    }
  ]
};

// Cuisine categories available for filtering
export const CUISINE_CATEGORIES = [
  'Asian',
  'Italian',
  'Mexican',
  'Mediterranean',
  'French',
  'Indian',
  'Japanese',
  'Korean',
  'Hawaiian',
] as const;

// Mock recipe data - replace with real data source
// NOTE: Image paths point to /assets/images/ folder
// Add your recipe images to public/assets/images/ and name them accordingly
export const MOCK_RECIPES: MockRecipe[] = [
  {
    id: 'mock-1',
    name: 'Beef Udon',
    author: 'Namiko Hirasawa Chen',
    category: 'Asian',
    image: '/assets/images/beef-udon.jpg', // Add image to public/assets/images/
  },
  {
    id: 'mock-2',
    name: 'Garlic Shrimp Ramen',
    author: 'Cameron Tillman',
    category: 'Asian',
    image: '/assets/images/garlic-shrimp-ramen.jpg', // Add image to public/assets/images/
  },
  {
    id: 'mock-3',
    name: 'Pad Thai',
    author: 'Thai Kitchen',
    category: 'Asian',
    image: '/assets/images/pad-thai.jpg', // Add image to public/assets/images/
  },
  {
    id: 'mock-4',
    name: 'Mushroom Risotto',
    author: 'Darrell Schroeder',
    category: 'Italian',
    image: '/assets/images/mushroom-risotto.jpg', // Add image to public/assets/images/
  },
  {
    id: 'mock-5',
    name: 'Spaghetti Carbonara',
    author: 'Italian Chef',
    category: 'Italian',
    image: '/assets/images/spaghetti-carbonara.jpg', // Add image to public/assets/images/
  },
  {
    id: 'mock-6',
    name: 'Tacos al Pastor',
    author: 'Maria Lopez',
    category: 'Mexican',
    image: '/assets/images/tacos-al-pastor.jpg', // Add image to public/assets/images/
  },
  {
    id: 'mock-7',
    name: 'Beef Wellington',
    author: 'Gordon Ramsay',
    category: 'French',
    image: '/assets/images/beef-wellington.jpg', // Add image to public/assets/images/
  },
  {
    id: 'mock-8',
    name: 'Chicken Tikka Masala',
    author: 'Indian Spice',
    category: 'Indian',
    image: '/assets/images/chicken-tikka-masala.jpg', // Add image to public/assets/images/
  },
  {
    id: 'mock-9',
    name: 'Sushi Platter',
    author: 'Tokyo Sushi',
    category: 'Japanese',
    image: '/assets/images/sushi-platter.jpg', // Add image to public/assets/images/
  },
  {
    id: 'mock-10',
    name: 'Bibimbap',
    author: 'Korean Kitchen',
    category: 'Korean',
    image: '/assets/images/bibimbap.jpg', // Add image to public/assets/images/
  },
  {
    id: 'mock-11',
    name: 'Poke Bowl',
    author: 'Hawaiian Fresh',
    category: 'Hawaiian',
    image: '/assets/images/poke-bowl.jpg', // Add image to public/assets/images/
  },
  {
    id: 'mock-12',
    name: 'Greek Salad',
    author: 'Mediterranean Delight',
    category: 'Mediterranean',
    image: '/assets/images/greek-salad.jpg', // Add image to public/assets/images/
  },
];

/**
 * Get recipes filtered by category
 * @param category - The cuisine category to filter by (empty string for all)
 * @returns Filtered array of recipes
 */
export function getRecipesByCategory(category: string): MockRecipe[] {
  if (!category) {
    return MOCK_RECIPES;
  }
  return MOCK_RECIPES.filter((recipe) => recipe.category === category);
}

/**
 * Get a specific recipe by ID
 * @param id - The recipe ID
 * @returns The recipe or undefined if not found
 */
export function getRecipeById(id: string): MockRecipe | undefined {
  return MOCK_RECIPES.find((recipe) => recipe.id === id);
}

