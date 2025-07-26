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
      model: 'mistral-saba-24b',
      messages: [
        {
          role: 'system',
          content: `
            You are an AI that extracts the recipe title and cooking instructions from raw HTML.
            
            Your task:
            Return ONLY a JSON object with the following:
            array of strings — each string is a full step in the recipe
            
            Rules:
            1. Only extract **visible, human-readable** steps meant to be followed by the cook.
            2. Do NOT include ingredient lists, prep times, serving sizes, or nutritional info.
            3. Clean each step by removing unnecessary line breaks or formatting artifacts.
            4. Steps should be listed in the correct order.
            5. Do NOT include any explanations, markdown, or commentary — just valid raw JSON.
            6. If you cannot find valid cooking instructions, return an empty array: [].
            
            Example output:
            [
              "Heat oil in a large pot over medium heat.",
              "Add onions and garlic; sauté until fragrant.",
              "Pour in chicken broth and bring to a boil.",
              "Add shredded chicken, corn, and seasonings.",
              "Simmer for 15 minutes, then serve hot with toppings of choice."
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

export async function GET() {
  return NextResponse.json({
    message: 'Recipe parsing API endpoint',
    usage: "Send POST request with { text: 'your recipe text here' }",
  });
}
