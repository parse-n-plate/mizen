import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { formatError, ERROR_CODES } from '@/utils/formatError';

export async function POST(req: NextRequest) {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const body = await req.json();
    console.log('body;', body);
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
      model: 'mistral-saba-24b',
      messages: [
        {
          role: 'system',
          content: `You are an AI that extracts recipe ingredients from raw HTML.

Your output must follow this exact JSON format:
- A string for the recipe title as the first element
- A JSON array of ingredient group objects as the second element

Each ingredient group object must have exactly these keys:
- "groupName": string (e.g. "For the cake", "For the frosting", or "Main" if no group)
- "ingredients": array of ingredient objects

Each ingredient object must have exactly these keys:
- "amount": string (e.g. "1", "½", "as much as you like")
- "units": string (e.g. "cups", "tablespoons", "grams") — exclude size units like "inch", "oz", "lb"
- "ingredient": string (e.g. "rigatoni", "gochujang")

Rules:
1. If a size like "6-inch" is part of the ingredient (e.g. "2 6-inch tortillas"), treat it as part of the ingredient and leave units blank.
2. If no amount is listed, try to infer it from the instructions.
3. If no amount is found at all, use: "as much as you like"
4. If the recipe does not have ingredient groups, use a single group with groupName "Main".
5. Your response must be ONLY raw, valid JSON — no markdown, no code blocks, no explanation, no preamble or postscript.
6. If you cannot find a valid recipe in the HTML, you must return exactly: ["No recipe found", []]. Do NOT make up or hallucinate a recipe if none is present.

// The above instruction is critical to prevent the AI from inventing recipes when the input does not contain one. This helps avoid misleading results and ensures the user is notified if no recipe is found.

Valid example output:
[
  "Chocolate Cake",
  [
    {
      "groupName": "For the cake",
      "ingredients": [
        {"amount": "2", "units": "cups", "ingredient": "flour"},
        {"amount": "1", "units": "cup", "ingredient": "sugar"}
      ]
    },
    {
      "groupName": "For the frosting",
      "ingredients": [
        {"amount": "1/2", "units": "cup", "ingredient": "butter"},
        {"amount": "2", "units": "cups", "ingredient": "powdered sugar"}
      ]
    }
  ]
]

Invalid example output:
[
  "No recipe found",
  [
  ]
]
`,
        },
        {
          role: 'user',
          content: text.slice(0, 10000), // Limit to first 10k characters
        },
      ],
    });

    const result = response.choices[0]?.message?.content;
    console.log('result;', result);

    // Check if the AI explicitly says no recipe was found
    if (result && result.toLowerCase().includes('no recipe found')) {
      return NextResponse.json(
        formatError(
          ERROR_CODES.ERR_NO_RECIPE_FOUND,
          'No valid recipe found in the provided HTML',
        ),
      );
    }

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
      JSON.parse(extractedJson);
    } catch {
      console.error('Invalid JSON response from AI:', result);
      return NextResponse.json(
        formatError(
          ERROR_CODES.ERR_AI_PARSE_FAILED,
          'AI returned invalid response format',
        ),
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
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

  // Try to extract JSON array first (for our ["title", [ingredients]] format)
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

export async function GET() {
  return NextResponse.json({
    message: 'Recipe parsing API endpoint',
    usage: "Send POST request with { text: 'your recipe text here' }",
  });
}
