import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: NextRequest) {
  try {
    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI service is not configured' },
        { status: 500 }
      );
    }

    const { recipeTitle, ingredients, instructions } = await request.json();

    if (!recipeTitle) {
      return NextResponse.json(
        { error: 'Recipe title is required' },
        { status: 400 }
      );
    }

    // Initialize Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // Build recipe context for AI
    const recipeContext = `
Recipe: ${recipeTitle}

${ingredients ? `Ingredients:\n${ingredients.map((g: any) =>
  `${g.groupName !== 'Main' ? `${g.groupName}:\n` : ''}${g.ingredients.map((i: any) =>
    `- ${i.amount} ${i.units} ${i.ingredient}`
  ).join('\n')}`
).join('\n\n')}` : ''}

${instructions ? `Instructions:\n${instructions.map((step: any, i: number) =>
  `${i + 1}. ${typeof step === 'string' ? step : step.detail}`
).join('\n')}`  : ''}
    `.trim();

    // Call Groq API for plating guidance
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a professional chef and food stylist. Analyze recipes and provide plating guidance in JSON format. Always respond with valid JSON only, no other text.',
        },
        {
          role: 'user',
          content: `Analyze this recipe and provide plating guidance in JSON format.

${recipeContext}

Provide your response as a JSON object with these fields:
{
  "platingNotes": "2-3 sentences with specific, actionable plating suggestions (e.g., placement, garnishes, presentation tips)",
  "servingVessel": "The ideal serving vessel (e.g., 'shallow bowl', 'dinner plate', 'small ramekin')",
  "servingTemp": "Ideal serving temperature (e.g., 'hot', 'warm', 'room temperature', 'chilled')",
  "storageGuide": "2-3 sentences on how to store leftovers properly",
  "shelfLife": {
    "fridge": <number of days in fridge>,
    "freezer": <number of days in freezer, or null if not freezer-friendly>
  }
}

Keep it practical and concise. Only respond with the JSON object, no other text.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    // Extract the response text from Groq's response format
    const responseText = response.choices[0]?.message?.content || '';

    if (!responseText || responseText.trim().length === 0) {
      throw new Error('No response from AI service');
    }

    // Extract JSON from response (in case it's wrapped in markdown code blocks)
    const jsonText = responseText
      .replace(/^[\s`]*```(?:json)?/, '')
      .replace(/```[\s`]*$/, '')
      .trim();

    // Parse the JSON response
    const guidanceData = JSON.parse(jsonText);

    return NextResponse.json({
      success: true,
      data: guidanceData,
    });
  } catch (error: any) {
    console.error('Error generating plating guidance:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate plating guidance',
        details: error.message
      },
      { status: 500 }
    );
  }
}
