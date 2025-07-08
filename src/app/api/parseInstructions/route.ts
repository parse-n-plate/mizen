import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 },
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
            
            Example output:
            [
              "Heat oil in a large pot over medium heat.",
              "Add onions and garlic; sauté until fragrant.",
              "Pour in chicken broth and bring to a boil.",
              "Add shredded chicken, corn, and seasonings.",
              "Simmer for 15 minutes, then serve hot with toppings of choice."
            ]
            `
        },
        {
          role: 'user',
          content: text.slice(0, 10000), // Limit to first 10k characters
        },
      ],
    });

    const result = response.choices[0]?.message?.content;

    if (!result) {
      return NextResponse.json(
        { error: 'No response from Groq' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Recipe parsing failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to parse recipe',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Recipe parsing API endpoint',
    usage: "Send POST request with { text: 'your recipe text here' }",
  });
}
