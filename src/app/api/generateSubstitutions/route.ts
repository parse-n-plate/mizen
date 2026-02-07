import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI service is not configured' },
        { status: 500 }
      );
    }

    const { ingredientName, ingredientAmount, recipeTitle, cuisine, ingredients, instructions } = await request.json();

    if (!ingredientName) {
      return NextResponse.json(
        { error: 'Ingredient name is required' },
        { status: 400 }
      );
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // Build recipe context
    const recipeContext = `
Recipe: ${recipeTitle || 'Untitled'}
${cuisine && cuisine.length > 0 ? `Cuisine: ${cuisine.join(', ')}` : ''}

${ingredients ? `Ingredients:\n${ingredients.map((g: any) =>
  `${g.groupName !== 'Main' ? `${g.groupName}:\n` : ''}${g.ingredients.map((i: any) =>
    `- ${i.amount} ${i.units} ${i.ingredient}`
  ).join('\n')}`
).join('\n\n')}` : ''}

${instructions ? `Instructions:\n${instructions.map((step: any, i: number) =>
  `${i + 1}. ${typeof step === 'string' ? step : step.detail}`
).join('\n')}` : ''}
    `.trim();

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a professional chef and recipe adaptation specialist. Suggest ingredient substitutions in JSON format. Always respond with valid JSON only, no other text.',
        },
        {
          role: 'user',
          content: `Suggest 3 substitutions for "${ingredientName}"${ingredientAmount ? ` (${ingredientAmount})` : ''} in the following recipe. Each substitution must be practical, commonly available, and its description must reference specific aspects of THIS recipe (cooking method, other ingredients, or cuisine style).

${recipeContext}

Respond with a JSON object:
{
  "substitutions": [
    {
      "name": "Substitute name",
      "description": "One sentence explaining why this works for THIS recipe, referencing the dish context (max 100 chars)"
    }
  ]
}

Only respond with the JSON object, no other text.`,
        },
      ],
      temperature: 0.4,
      max_tokens: 1024,
    });

    const responseText = response.choices[0]?.message?.content || '';

    if (!responseText || responseText.trim().length === 0) {
      throw new Error('No response from AI service');
    }

    // Strip markdown code fences if present
    const jsonText = responseText
      .replace(/^[\s`]*```(?:json)?/, '')
      .replace(/```[\s`]*$/, '')
      .trim();

    const data = JSON.parse(jsonText);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error generating substitutions:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate substitutions',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
