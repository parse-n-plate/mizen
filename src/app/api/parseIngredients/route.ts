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
