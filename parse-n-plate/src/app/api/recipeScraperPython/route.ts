import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(req: NextRequest): Promise<Response> {
  const { url } = await req.json();

  return new Promise((resolve) => {
    const process = spawn('python3', ['src/functions/scrape_recipe.py', url]);

    let data = '';
    let error = '';

    process.stdout.on('data', (chunk) => {
      data += chunk.toString();
    });

    process.stderr.on('data', (chunk) => {
      error += chunk.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        try {
          const json = JSON.parse(data);
          resolve(NextResponse.json(json));
        } catch (err) {
          console.error('Error parsing Python output:', err);
          resolve(NextResponse.json({ error: 'Failed to parse Python output' }));
        }
      } else {
        resolve(NextResponse.json({ error: error || 'Unknown error running Python script' }));
      }
    });
  });
}
