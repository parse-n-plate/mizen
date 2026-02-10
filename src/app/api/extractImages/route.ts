import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

/**
 * API endpoint to extract images from a recipe URL
 * Returns up to 3 recipe-related images
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { url } = await req.json();

    // Validate URL is provided
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log(`[API /extractImages] Fetching images from URL: ${url}`);

    // Fetch the HTML content
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch URL: ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract images - prioritize recipe-related images
    const images: string[] = [];

    // 1. Try to find images in JSON-LD structured data (recipe images)
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const jsonContent = $(element).html();
        if (!jsonContent) return;

        const data = JSON.parse(jsonContent);
        
        // Handle @graph structure
        const items = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
        
        for (const item of items) {
          if (item['@type'] === 'Recipe' || item['@type'] === 'ImageObject') {
            if (item.image) {
              if (typeof item.image === 'string') {
                images.push(item.image);
              } else if (item.image.url) {
                images.push(item.image.url);
              } else if (Array.isArray(item.image)) {
                item.image.forEach((img: string | { url?: string }) => {
                  if (typeof img === 'string') {
                    images.push(img);
                  } else if (img.url) {
                    images.push(img.url);
                  }
                });
              }
            }
          }
        }
      } catch {
        // Skip invalid JSON
      }
    });

    // 2. Find images in common recipe image selectors
    const imageSelectors = [
      'img[itemprop="image"]',
      '.recipe-image img',
      '.recipe-photo img',
      '.recipe-header img',
      'article img',
      'main img',
    ];

    for (const selector of imageSelectors) {
      $(selector).each((_, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && !images.includes(src)) {
          // Convert relative URLs to absolute
          try {
            const imageUrl = new URL(src, url).href;
            if (isValidImageUrl(imageUrl)) {
              images.push(imageUrl);
            }
          } catch {
            // Skip invalid URLs
          }
        }
      });
    }

    // 3. Remove duplicates and filter out invalid images
    const uniqueImages = Array.from(new Set(images))
      .filter((img) => isValidImageUrl(img))
      .slice(0, 3); // Limit to 3 images

    console.log(`[API /extractImages] Found ${uniqueImages.length} images`);

    return NextResponse.json({
      success: true,
      images: uniqueImages,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /extractImages] Error:', errorMessage);
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Check if URL is a valid image URL
 */
function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    
    // Check for image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const hasImageExtension = imageExtensions.some((ext) =>
      pathname.endsWith(ext)
    );
    
    // Check for common image CDN patterns
    const imagePatterns = ['/image/', '/img/', '/photo/', '/picture/'];
    const hasImagePattern = imagePatterns.some((pattern) =>
      pathname.includes(pattern)
    );
    
    // Exclude common non-image patterns
    const excludePatterns = ['/logo', '/icon', '/avatar', '/favicon'];
    const hasExcludePattern = excludePatterns.some((pattern) =>
      pathname.includes(pattern)
    );
    
    return (hasImageExtension || hasImagePattern) && !hasExcludePattern;
  } catch {
    return false;
  }
}






