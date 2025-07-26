import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { formatError, ERROR_CODES } from '@/utils/formatError';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
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
      return NextResponse.json(
        formatError(ERROR_CODES.ERR_INVALID_URL, 'Invalid URL format'),
      );
    }

    return new Promise((resolve) => {
      const process = spawn('python3', ['src/utils/scrape_recipe.py', url]);

      let data = '';
      let error = '';
      const timeout: NodeJS.Timeout = setTimeout(() => {
        process.kill();
        resolve(
          NextResponse.json(
            formatError(
              ERROR_CODES.ERR_TIMEOUT,
              'Python script execution timed out',
            ),
          ),
        );
      }, 30000); // 30 seconds timeout

      process.stdout.on('data', (chunk) => {
        data += chunk.toString();
      });

      process.stderr.on('data', (chunk) => {
        error += chunk.toString();
      });

      process.on('close', (code) => {
        clearTimeout(timeout);

        if (code === 0) {
          try {
            const json = JSON.parse(data);

            // Check if the Python script returned valid recipe data
            if (!json || typeof json !== 'object') {
              resolve(
                NextResponse.json(
                  formatError(
                    ERROR_CODES.ERR_NO_RECIPE_FOUND,
                    'No recipe data returned from Python script',
                  ),
                ),
              );
              return;
            }

            // Check if we have at least some basic recipe information
            const hasTitle =
              json.title &&
              typeof json.title === 'string' &&
              json.title.trim().length > 0;
            const hasIngredients =
              json.ingredients &&
              Array.isArray(json.ingredients) &&
              json.ingredients.length > 0;
            const hasInstructions =
              json.instructions &&
              (Array.isArray(json.instructions) ||
                typeof json.instructions === 'string');

            if (!hasTitle && !hasIngredients && !hasInstructions) {
              resolve(
                NextResponse.json(
                  formatError(
                    ERROR_CODES.ERR_NO_RECIPE_FOUND,
                    'No recipe content found on this page',
                  ),
                ),
              );
              return;
            }

            resolve(NextResponse.json({ success: true, ...json }));
          } catch (err) {
            console.error('Error parsing Python output:', err);
            console.error('Raw Python output:', data);
            resolve(
              NextResponse.json(
                formatError(
                  ERROR_CODES.ERR_AI_PARSE_FAILED,
                  'Failed to parse Python script output',
                ),
              ),
            );
          }
        } else {
          console.error('Python script error:', error);
          console.error('Python script exit code:', code);

          if (
            error.includes('ModuleNotFoundError') ||
            error.includes('ImportError')
          ) {
            resolve(
              NextResponse.json(
                formatError(
                  ERROR_CODES.ERR_UNKNOWN,
                  'Python dependencies not installed',
                ),
              ),
            );
          } else if (error.includes('FileNotFoundError')) {
            resolve(
              NextResponse.json(
                formatError(ERROR_CODES.ERR_UNKNOWN, 'Python script not found'),
              ),
            );
          } else {
            resolve(
              NextResponse.json(
                formatError(
                  ERROR_CODES.ERR_UNKNOWN,
                  'Python script execution failed',
                ),
              ),
            );
          }
        }
      });

      process.on('error', (err) => {
        clearTimeout(timeout);
        console.error('Process spawn error:', err);
        resolve(
          NextResponse.json(
            formatError(
              ERROR_CODES.ERR_UNKNOWN,
              'Failed to start Python script',
            ),
          ),
        );
      });
    });
  } catch (error) {
    console.error('Recipe scraper error:', error);
    return NextResponse.json(
      formatError(ERROR_CODES.ERR_UNKNOWN, 'An unexpected error occurred'),
    );
  }
}
