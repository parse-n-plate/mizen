import axios from 'axios';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  const { url } = await req.json();
  try {
    const { data: html } = await axios.get(url, { timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },});
    const $ = cheerio.load(html);
    const text = $.text().toLowerCase();

    const hasIngredients = text.includes('ingredient');
    const hasInstructions =
      text.includes('instruction') ||
      text.includes('step') ||
      text.includes('directions');
    const hasSchema =
      html.includes('"@type":"Recipe"') || html.includes('@type": "Recipe"');

    const isRecipe = (hasIngredients && hasInstructions) || hasSchema;

    return Response.json({ isRecipe });
  } catch (err) {
    console.error('Invalid URL:', err);
    return Response.json({ isRecipe: false });
  }
}
