import axios from 'axios';
import * as cheerio from 'cheerio';
import { formatError, ERROR_CODES } from '@/utils/formatError';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return Response.json(
        formatError(
          ERROR_CODES.ERR_INVALID_URL,
          'URL is required and must be a string',
        ),
      );
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return Response.json(
        formatError(ERROR_CODES.ERR_INVALID_URL, 'Please enter a valid URL'),
      );
    }

    // Check if domain is supported
    const supportedDomains = [
      'allrecipes.com',
      'foodnetwork.com',
      'epicurious.com',
      'bonappetit.com',
      'seriouseats.com',
      'tasteofhome.com',
      'simplyrecipes.com',
      'thepioneerwoman.com',
      'food52.com',
      'kingarthurbaking.com',
    ];

    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    const isSupported = supportedDomains.some((supported) =>
      domain.includes(supported),
    );

    if (!isSupported) {
      return Response.json(
        formatError(
          ERROR_CODES.ERR_UNSUPPORTED_DOMAIN,
          'This website is not currently supported',
        ),
      );
    }

    const { data: html } = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

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

    if (!isRecipe) {
      return Response.json(
        formatError(
          ERROR_CODES.ERR_NO_RECIPE_FOUND,
          'No recipe found on this page',
        ),
      );
    }

    return Response.json({ success: true, isRecipe });
  } catch (error) {
    console.error('URL validation error:', error);

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return Response.json(
          formatError(ERROR_CODES.ERR_TIMEOUT, 'Request timed out'),
        );
      }
      if (error.response?.status === 404) {
        return Response.json(
          formatError(ERROR_CODES.ERR_NO_RECIPE_FOUND, 'Page not found'),
        );
      }
      if (error.response?.status && error.response.status >= 500) {
        return Response.json(
          formatError(ERROR_CODES.ERR_FETCH_FAILED, 'Server error occurred'),
        );
      }
      return Response.json(
        formatError(ERROR_CODES.ERR_FETCH_FAILED, 'Failed to fetch the page'),
      );
    }

    return Response.json(
      formatError(ERROR_CODES.ERR_UNKNOWN, 'An unexpected error occurred'),
    );
  }
}
