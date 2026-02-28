import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { formatError, ERROR_CODES } from '@/utils/formatError';

export async function POST(req: NextRequest) {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        formatError(
          ERROR_CODES.ERR_INVALID_URL,
          'Text input is required and must be a string',
        ),
      );
    }

    if (text.trim().length === 0) {
      return NextResponse.json(
        formatError(ERROR_CODES.ERR_NO_RECIPE_FOUND, 'Text input is empty'),
      );
    }

    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not configured');
      return NextResponse.json(
        formatError(ERROR_CODES.ERR_UNKNOWN, 'AI service is not configured'),
      );
    }

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `========================================
CRITICAL OUTPUT FORMAT
========================================
You MUST output ONLY raw JSON. NO thinking, NO reasoning, NO explanations, NO text before or after the JSON.
START YOUR RESPONSE IMMEDIATELY WITH [ and END WITH ]. Nothing else.

Required JSON structure:
[
  "First instruction step (string)",
  "Second instruction step (string)",
  "Third instruction step (string)"
]

CRITICAL: instructions MUST be an array, NEVER null.
- If instructions are found: extract them into an array of strings
- If NO instructions found: use empty array []
- NEVER use null for instructions - ALWAYS use [] if nothing is found

========================================
THE HTML PROVIDED IS YOUR ONLY SOURCE OF DATA
========================================
You are an AI instruction extractor. Your SOLE purpose is to read the HTML provided and extract cooking instruction steps EXACTLY as they appear.

CORE EXTRACTION PRINCIPLES:
1. Read the HTML carefully and locate the cooking instructions section
2. Extract each instruction step EXACTLY as written in the HTML
3. Never shorten, combine, summarize, or simplify steps
4. Preserve ALL details: temperatures, times, measurements, techniques, visual cues
5. Only remove author names, bylines, and attribution text
6. Only normalize whitespace - nothing else

========================================
EXTRACTION WORKFLOW
========================================
Follow these steps in order:
1. Locate the instructions or directions section in the HTML
2. Identify each individual instruction step
3. Extract each step EXACTLY as written, preserving all details
4. Remove ONLY author attribution and metadata (see Cleaning section)
5. Keep steps in the exact order they appear
6. Format into a JSON array of strings

========================================
INSTRUCTION EXTRACTION RULES
========================================
COMPLETENESS:
- Extract ALL instruction steps from the HTML
- Do NOT skip any steps, even if they seem minor or obvious
- Do NOT combine multiple steps into one
- Do NOT split one step into multiple steps
- Include every detail: temperatures, times, measurements, techniques

ACCURACY:
- Copy instruction text as closely as possible to the HTML
- Preserve all cooking temperatures exactly: "350°F", "175°C", "medium-high heat"
- Preserve all cooking times exactly: "30 minutes", "until golden brown", "for 2-3 hours"
- Preserve all measurements mentioned: "2 cups", "1/4 inch thick", "8-inch pan"
- Keep technique descriptions: "until light and fluffy", "fold gently", "stir constantly"
- Keep visual cues: "until golden brown", "until knife comes out clean", "until bubbling"

DETAIL PRESERVATION:
- Do NOT shorten or condense any instruction
- Do NOT simplify complex steps
- Do NOT remove helpful tips or warnings embedded in steps
- Do NOT remove descriptive details about texture, color, or doneness
- Maintain the original level of detail from the HTML

ORDER:
- Keep instructions in the EXACT order they appear in the HTML
- Do NOT reorder or reorganize steps
- Do NOT group steps by type or technique

========================================
CLEANING (Remove These Only)
========================================
DO remove:
- Author names and bylines (e.g., "By Chef John:", "Recipe by Sarah Smith")
- Attribution text (e.g., "Recipe courtesy of...", "Adapted from...")
- Recipe credits and editor names
- Nutritional information
- Prep time, cook time, total time labels
- Serving size information
- Ingredient lists (if mixed with instructions)
- Image descriptions or photo captions
- Video references (e.g., "Watch the video", "See video for details")
- Advertisement content or promotional text
- Unnecessary line breaks or formatting artifacts

DO NOT remove:
- Any cooking instructions or techniques
- Temperatures, times, or measurements
- Tips or notes about technique
- Warnings about timing or temperature
- Visual cues for doneness

========================================
EDGE CASES AND MISSING DATA
========================================
If no valid cooking instructions are found:
- Return an empty array: []

If instructions are incomplete:
- Extract what is available exactly as written
- Do NOT make up or fill in missing steps

If steps include inline ingredients:
- Keep the full step text including ingredient mentions
- Example: "Add 2 cups flour and mix until combined" - keep as is

MANDATORY OUTPUT REQUIREMENTS:
- instructions MUST be an array (never null) - use [] if empty
- If you cannot find instructions, return []
- The HTML contains recipe data - search more carefully if you initially find nothing

========================================
FORMAT EXAMPLES (FOR STRUCTURE REFERENCE ONLY)
========================================
WARNING: These examples show the JSON FORMAT and STRUCTURE only.
DO NOT use these example values. Extract actual instruction text from the HTML provided.

Example showing detailed steps with temperatures and times:
[
  "Preheat oven to 350°F (175°C). Grease and flour two 9-inch round cake pans.",
  "In a medium bowl, whisk together 2 1/2 cups all-purpose flour, 1 teaspoon baking powder, 1/2 teaspoon baking soda, and 1/4 teaspoon salt. Set aside.",
  "In a large bowl, using an electric mixer on medium speed, cream together 3/4 cup unsalted butter and 1 3/4 cups granulated sugar until light and fluffy, about 3-4 minutes.",
  "Beat in 3 large eggs, one at a time, mixing well after each addition. Stir in 1 1/2 teaspoons vanilla extract.",
  "With the mixer on low speed, gradually add the flour mixture in three additions, alternating with 1 1/4 cups buttermilk in two additions, beginning and ending with the flour mixture. Mix just until incorporated after each addition.",
  "Divide batter evenly between the prepared pans. Bake for 28-32 minutes, or until a toothpick inserted in the center comes out clean.",
  "Cool in pans on wire racks for 10 minutes, then remove from pans and cool completely on wire racks before frosting."
]

IMPORTANT: The example above shows JSON format structure only. You MUST extract actual instruction steps from the HTML provided, preserving all details exactly as written.

========================================
FINAL REMINDER
========================================
Output ONLY the JSON array. No markdown, no code blocks, no explanations, no text before or after.
START with [ and END with ]. Nothing else.
Preserve ALL details from the HTML - temperatures, times, measurements, techniques, and visual cues.`,
        },
        {
          role: 'user',
          content: text.slice(0, 15000), // Limit to first 15k characters
        },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    });

    const result = response.choices[0]?.message?.content;

    if (!result || result.trim().length === 0) {
      return NextResponse.json(
        formatError(
          ERROR_CODES.ERR_AI_PARSE_FAILED,
          'No response from AI service',
        ),
      );
    }

    // Validate that the response contains valid JSON structure
    try {
      const extractedJson = extractJsonFromResponse(result);
      const parsedInstructions = JSON.parse(extractedJson);

      if (!Array.isArray(parsedInstructions)) {
        return NextResponse.json(
          formatError(
            ERROR_CODES.ERR_AI_PARSE_FAILED,
            'AI returned invalid instruction format',
          ),
        );
      }

      // Filter out author names and attribution text from instructions
      const filteredInstructions = filterAuthorNames(parsedInstructions);

      // Return the filtered instructions as JSON string (to match expected format)
      return NextResponse.json({
        success: true,
        data: JSON.stringify(filteredInstructions),
      });
    } catch {
      console.error('Invalid JSON response from AI:', result);
      return NextResponse.json(
        formatError(
          ERROR_CODES.ERR_AI_PARSE_FAILED,
          'AI returned invalid response format',
        ),
      );
    }
  } catch (error) {
    console.error('Recipe parsing failed:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('timeout') ||
        error.message.includes('timed out')
      ) {
        return NextResponse.json(
          formatError(ERROR_CODES.ERR_TIMEOUT, 'AI service request timed out'),
        );
      }
      if (
        error.message.includes('authentication') ||
        error.message.includes('unauthorized')
      ) {
        return NextResponse.json(
          formatError(
            ERROR_CODES.ERR_UNKNOWN,
            'AI service authentication failed',
          ),
        );
      }
      if (
        error.message.includes('quota') ||
        error.message.includes('rate limit')
      ) {
        return NextResponse.json(
          formatError(ERROR_CODES.ERR_UNKNOWN, 'AI service quota exceeded'),
        );
      }
    }

    return NextResponse.json(
      formatError(
        ERROR_CODES.ERR_AI_PARSE_FAILED,
        'Failed to parse recipe with AI',
      ),
    );
  }
}

// Helper function to extract JSON from AI response
function extractJsonFromResponse(text: string): string {
  const cleaned = text
    .replace(/^[\s`]*```(?:json)?/, '')
    .replace(/```[\s`]*$/, '')
    .trim();

  // Try to extract JSON array first (for our instructions array format)
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  // If no JSON array found, try to extract JSON object
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  return cleaned;
}

// Helper function to filter out author names and attribution from instructions
function filterAuthorNames(instructions: string[]): string[] {
  return instructions
    .map((instruction) => instruction.trim())
    .filter((instruction) => {
      // Skip empty instructions
      if (!instruction || instruction.length === 0) {
        return false;
      }

      // Filter out patterns that look like author names or attribution
      // Common patterns: "By [Name]", "[Name]", "Recipe by [Name]", etc.
      const lowerInstruction = instruction.toLowerCase();

      // Check if it's just a name (2-3 words, no verbs, no cooking terms)
      const wordCount = instruction.split(/\s+/).length;
      const hasCookingTerms =
        /(heat|add|stir|mix|cook|bake|simmer|boil|fry|roast|season|taste|serve|preheat|chop|dice|slice|mince|pour|drain|whisk|beat|fold|knead|roll|cut|peel|grate|zest|squeeze|melt|saute|brown|caramelize|deglaze|reduce|thicken|thaw|marinate|brine|rub|glaze|garnish|top|sprinkle|drizzle|toss|coat|dredge|flour|bread|batter|crust|filling|topping|sauce|gravy|broth|stock|marinade|dressing|vinaigrette|seasoning|spice|herb|aromatic|flavor|taste|texture|tender|crispy|golden|browned|caramelized|caramel|syrup|honey|sugar|salt|pepper|garlic|onion|herbs|spices)/i.test(
          instruction,
        );

      // If it's 1-3 words and has no cooking terms, it's likely an author name
      if (wordCount <= 3 && !hasCookingTerms) {
        // Additional check: does it look like a name (capitalized words, no punctuation except periods)
        const looksLikeName = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\.?$/.test(
          instruction,
        );
        if (looksLikeName) {
          return false;
        }
      }

      // Filter out instructions that start with "By " (common attribution pattern)
      if (/^by\s+[A-Z]/.test(instruction)) {
        return false;
      }

      // Filter out instructions that are just "Recipe by [Name]" or similar
      if (/^(recipe\s+)?by\s+[A-Z]/.test(lowerInstruction)) {
        return false;
      }

      // Filter out very short text that's likely not an instruction (less than 10 chars)
      if (instruction.length < 10) {
        return false;
      }

      return true;
    });
}

export async function GET() {
  return NextResponse.json({
    message: 'Recipe parsing API endpoint',
    usage: "Send POST request with { text: 'your recipe text here' }",
  });
}
