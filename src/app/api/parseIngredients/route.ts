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
            You are an AI that extracts recipe ingredients from raw HTML.
            
            Your task:
            Return ONLY a JSON array of ingredient objects. Each object must have the following keys:
            - amount: string (e.g. "1", "½", "as much as you like")
            - units: string (e.g. "cups", "tablespoons", "grams") — exclude size units like "inch", "oz", "lb"
            - ingredient: string (e.g. "rigatoni", "gochujang")
            
            Rules:
            1. If a size like “6-inch” is part of the ingredient (e.g. “2 6-inch tortillas”), treat it as part of the **ingredient** and leave **units** blank.
            2. If no amount is listed in the ingredients, try to infer it from the instructions.
            3. If no amount is found at all, set **amount** to "as much as you like".
            4. Do NOT include any explanation, formatting, markdown, or commentary — just raw JSON.
            
            Example output:
            [
              { "amount": "1", "units": "cup", "ingredient": "heavy cream" },
              { "amount": "2", "units": "", "ingredient": "6-inch tortillas" },
              { "amount": "as much as you like", "units": "", "ingredient": "salt" }
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
