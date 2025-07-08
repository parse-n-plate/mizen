import axios from 'axios';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  const { url } = await req.json();
  try {
    const { data: html } = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(html);
    const text = $.text().toLowerCase();

    const hasIngredients = text.includes('ingredient');
    const hasInstructions =
      text.includes('instruction') || text.includes('step');
    const hasSchema =
      html.includes('"@type":"Recipe"') || html.includes('@type": "Recipe"');

    const isRecipe = (hasIngredients && hasInstructions) || hasSchema;

    return Response.json({ isRecipe });
  } catch (err) {
    console.error('Invalid URL:', err);
    return Response.json({ isRecipe: false });
  }
}
