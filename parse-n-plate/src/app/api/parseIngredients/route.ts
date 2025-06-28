import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text input is required" },
        { status: 400 }
      );
    }

    const response = await groq.chat.completions.create({
      model: "mistral-saba-24b",
      messages: [
        {
          role: "system",
          content: "Given the ingredients, return an array of objects, each with amount, units (like cups, teaspoons, grams – NOT sizes like inch, oz, lb), and ingredient. If a size like ‘6 inch’ is describing the ingredient (e.g. ‘2 6-inch tortillas’), treat it as part of the ingredient and leave units empty. If no amount is found, use ‘As much as you like’. Return raw JSON only. No explanation"
        },
        {
          role: "user",
          content: text.slice(0, 10000) // Limit to first 10k characters
        }
      ],
    });

    const result = response.choices[0]?.message?.content;
    
    if (!result) {
      return NextResponse.json(
        { error: "No response from Groq" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("Recipe parsing failed:", error);
    return NextResponse.json(
      { error: "Failed to parse recipe", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Recipe parsing API endpoint", 
    usage: "Send POST request with { text: 'your recipe text here' }" 
  });
}