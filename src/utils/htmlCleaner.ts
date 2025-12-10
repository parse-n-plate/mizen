/**
 * HTML Cleaning Utility for Recipe Parsing
 * 
 * This utility removes unnecessary HTML elements (ads, images, scripts, navigation, etc.)
 * and preserves only the core content needed for recipe extraction.
 * 
 * The goal is to provide clean HTML optimized for AI parsing while maintaining
 * the structure of lists, paragraphs, and semantic recipe-related content.
 */

import * as cheerio from 'cheerio';

/**
 * Interface for HTML cleaning result
 */
export interface CleanedHTML {
  success: boolean;
  html?: string;
  error?: string;
}

/**
 * Clean HTML by removing unnecessary elements and preserving recipe content
 * Prioritizes ingredients and directions sections for better AI parsing
 * 
 * @param rawHtml - The raw HTML content from a recipe page
 * @returns CleanedHTML object with success status and cleaned HTML or error
 */
export function cleanRecipeHTML(rawHtml: string): CleanedHTML {
  try {
    if (!rawHtml || rawHtml.trim().length === 0) {
      return {
        success: false,
        error: 'HTML content is empty',
      };
    }

    // Load HTML with Cheerio
    const $ = cheerio.load(rawHtml);

    // STEP 1: Extract recipe-specific sections FIRST (before removing other content)
    // This ensures we prioritize ingredients and directions
    
    // Find recipe title
    const recipeTitle = $('h1, .recipe-title, [class*="recipe-title"], [itemprop="name"]').first().text().trim() || 
                        $('title').first().text().trim();

    // Find ingredients sections (multiple common selectors)
    // Added more flexible selectors for sites like Just One Cookbook
    const ingredientSelectors = [
      '[class*="ingredient"]',
      '[id*="ingredient"]',
      '[itemprop="recipeIngredient"]',
      '[class*="ingredients-list"]',
      '[id*="ingredients-list"]',
      'ul.ingredients, ol.ingredients',
      '.recipe-ingredients, #recipe-ingredients',
      '[data-ingredients]',
      // Just One Cookbook and similar sites
      '.wprm-recipe-ingredients-container',
      '.wprm-recipe-ingredient',
      '[class*="wprm-recipe-ingredient"]',
    ];
    
    let ingredientsHtml = '';
    ingredientSelectors.forEach(selector => {
      if (!ingredientsHtml) {
        const $ingredients = $(selector);
        if ($ingredients.length) {
          // Get parent container if it's a list item
          const $container = $ingredients.first().closest('[class*="ingredient"], [id*="ingredient"], section, div');
          ingredientsHtml = $container.length ? $container.html() || '' : $ingredients.first().parent().html() || '';
        }
      }
    });

    // Fallback: Look for headings that say "Ingredients" and get following content
    if (!ingredientsHtml) {
      const headings = $('h1, h2, h3, h4, h5, h6');
      headings.each((_, heading) => {
        const $heading = $(heading);
        const headingText = $heading.text().trim().toLowerCase();
        if (headingText === 'ingredients' || headingText.includes('ingredients')) {
          // Get the next sibling element (usually a list or div)
          let $next = $heading.next();
          // If no next sibling, try parent's next sibling
          if ($next.length === 0) {
            $next = $heading.parent().next();
          }
          // If still nothing, look within the same parent
          if ($next.length === 0) {
            $next = $heading.parent().find('ul, ol, div').first();
          }
          if ($next.length > 0) {
            ingredientsHtml = $next.html() || '';
            return false; // Break the loop
          }
        }
      });
    }

    // Find directions/instructions sections
    const instructionSelectors = [
      '[class*="instruction"]',
      '[class*="direction"]',
      '[id*="instruction"]',
      '[id*="direction"]',
      '[itemprop="recipeInstructions"]',
      '[class*="steps"]',
      '[id*="steps"]',
      '.recipe-instructions, #recipe-instructions',
      '.recipe-directions, #recipe-directions',
      '[data-instructions]',
      'ol.instructions, ul.instructions',
      // Just One Cookbook and similar sites
      '.wprm-recipe-instructions-container',
      '.wprm-recipe-instruction',
      '[class*="wprm-recipe-instruction"]',
    ];
    
    let instructionsHtml = '';
    instructionSelectors.forEach(selector => {
      if (!instructionsHtml) {
        const $instructions = $(selector);
        if ($instructions.length) {
          const $container = $instructions.first().closest('[class*="instruction"], [class*="direction"], [class*="step"], section, div');
          instructionsHtml = $container.length ? $container.html() || '' : $instructions.first().parent().html() || '';
        }
      }
    });

    // Fallback: Look for headings that say "Instructions", "Directions", or "Steps"
    if (!instructionsHtml) {
      const headings = $('h1, h2, h3, h4, h5, h6');
      headings.each((_, heading) => {
        const $heading = $(heading);
        const headingText = $heading.text().trim().toLowerCase();
        if (
          headingText === 'instructions' ||
          headingText === 'directions' ||
          headingText === 'steps' ||
          headingText.includes('instructions') ||
          headingText.includes('directions') ||
          headingText.includes('steps')
        ) {
          // Get the next sibling element (usually a list or div)
          let $next = $heading.next();
          // If no next sibling, try parent's next sibling
          if ($next.length === 0) {
            $next = $heading.parent().next();
          }
          // If still nothing, look within the same parent
          if ($next.length === 0) {
            $next = $heading.parent().find('ol, ul, div').first();
          }
          if ($next.length > 0) {
            instructionsHtml = $next.html() || '';
            return false; // Break the loop
          }
        }
      });
    }

    // STEP 2: Remove all non-essential elements
    // Remove scripts, styles, and media elements
    $(
      'script, style, noscript, link, meta, head, svg, symbol, img, button, iframe, video, audio, canvas, form, input, select, option, textarea'
    ).remove();

    // Remove navigation and site structure elements
    $(
      'nav, .navbar, .nav, .navigation, .site-nav, .menu, .mobile-menu, [role="navigation"]'
    ).remove();

    // Remove header and footer elements (unless they contain recipe schema)
    $('header, .header, .site-header, [role="banner"]').each((_, element) => {
      const $element = $(element);
      if (!$element.find('script[type="application/ld+json"]').length) {
        $element.remove();
      }
    });

    $('footer, .footer, .site-footer, [role="contentinfo"]').remove();

    // Remove sidebars and secondary content
    $('aside, .sidebar, .side-bar, .secondary, [role="complementary"]').remove();

    // Remove ads, sponsors, and promotional content
    $(
      '.ad, .ads, .advertisement, .sponsor, .sponsored, .promo, .promotion, .banner-ad, .ad-container, .ad-slot, .adsbygoogle, .outbrain, .taboola'
    ).remove();

    // Remove social sharing widgets and icons
    $(
      '.social, .share, .sharing, .social-share, .share-buttons, .social-media, .follow, .social-icons, .network-icons'
    ).remove();

    // Remove comments sections
    $(
      '.comments, .comment, .comment-section, #comments, #comment, [class*="comment"], [id*="comment"], [class*="disqus"], [id*="disqus"]'
    ).remove();

    // Remove rating widgets and user interactions
    $(
      '.rating, .ratings, .reviews, .review, .stars, .rmp-rating-widget, .rmp-widgets-container'
    ).remove();

    // Remove newsletter signup forms and popups
    $(
      '.newsletter, .subscribe, .subscription, .signup, .email-signup, .popup, .modal, .overlay, .push-modal, .push-subscribe'
    ).remove();

    // Remove breadcrumbs and metadata
    $(
      '.breadcrumb, .breadcrumbs, .breadcrumb-container, .breadcrumbs-container'
    ).remove();

    // Remove author info boxes and bylines
    $('.author, .author-box, .author-info, .byline, .author-byline').remove();

    // Remove entry metadata and post metadata
    $(
      '.entry-meta, .entry-metadata, .post-meta, .post-metadata, .entry-footer, .post-footer, .entry-date, .post-date'
    ).remove();

    // Remove WordPress plugin containers that aren't recipe-related
    $('.wp-block-group, .wp-block-buttons, .wp-block-embed, .widget').each(
      (_, element) => {
        const $element = $(element);
        if (
          !$element.find('[class*="recipe"]').length &&
          !$element.find('[class*="ingredient"]').length &&
          !$element.find('[class*="instruction"]').length
        ) {
          $element.remove();
        }
      }
    );

    // Remove print buttons and utility controls
    $(
      '.print, .print-btn, .print-recipe, .printable, .jump-to-recipe, .scroll-to-top, .floating-btn'
    ).remove();

    // Remove search boxes and site search
    $(
      '.search, .search-box, .search-container, .search-form, .site-search, .search-bar'
    ).remove();

    // Remove app banners and mobile prompts
    $(
      '.app-banner, .mobile-banner, .mobile-sticky, .open-app, .app-link, .download-app'
    ).remove();

    // Remove theme toggles and accessibility controls
    $(
      '.theme-toggle, .dark-mode, .light-mode, .toggle-switch, .color-mode, .font-size-control'
    ).remove();

    // Remove tooltips, hints, and UI helpers
    $(
      '.tooltip, .tooltips, .hint, .hovercard, .dropdown-menu, .dropdown'
    ).remove();

    // Remove related posts and recommendations
    $(
      '.related, .related-posts, .recommendations, .you-may-like, .more-recipes, .thumb-grid'
    ).remove();

    // Remove video containers and hero videos
    $('.hero-video-container, .video-container, .video-wrapper').remove();

    // Remove embedded social media content
    $('lite-youtube, [class*="twitter"], [class*="instagram"], [class*="facebook"]').remove();

    // Remove Google Custom Search Engine elements
    $('gcse, [class*="gcse"]').remove();

    // Remove screen reader text and accessibility helpers
    $('.screen-reader-text, .sr-only, .visually-hidden').remove();

    // Remove nutritional info boxes (not needed for parsing ingredients/instructions)
    $('[class*="nutrition"], [id*="nutrition"], [class*="calorie"], [id*="calorie"]').remove();

    // Remove prep time, cook time, serving size boxes (keep text if in main content)
    $('[class*="prep-time"], [class*="cook-time"], [class*="serving"], [class*="yield"], [class*="time"]').each((_, el) => {
      const $el = $(el);
      // Only remove if it's a standalone widget, not if it's part of recipe content
      if ($el.hasClass('widget') || $el.parent().hasClass('widget')) {
        $el.remove();
      }
    });

    // STEP 3: Build optimized HTML with prioritized recipe content
    // Start with a structured format that emphasizes ingredients and directions
    
    let optimizedHtml = '';

    // Add title if found
    if (recipeTitle) {
      optimizedHtml += `<h1 class="recipe-title-parsed">${recipeTitle}</h1>\n`;
    }

    // Add ingredients section FIRST (most important for AI)
    if (ingredientsHtml) {
      optimizedHtml += `<section class="recipe-ingredients-parsed">\n<h2>INGREDIENTS</h2>\n${ingredientsHtml}\n</section>\n`;
    }

    // Add instructions section SECOND
    if (instructionsHtml) {
      optimizedHtml += `<section class="recipe-instructions-parsed">\n<h2>INSTRUCTIONS</h2>\n${instructionsHtml}\n</section>\n`;
    }

    // Get remaining cleaned body content as fallback
    // Try multiple sources to ensure we get content
    let remainingContent = $('body').html() || '';
    if (!remainingContent || remainingContent.trim().length === 0) {
      remainingContent = $('main, article, [role="main"]').html() || '';
    }
    // Final fallback: get any content from the page
    if (!remainingContent || remainingContent.trim().length === 0) {
      remainingContent = $('div[class*="content"], div[class*="post"], div[class*="entry"]').first().html() || '';
    }

    // If we found ingredients/instructions, prioritize them and add remaining content
    if (ingredientsHtml || instructionsHtml) {
      // Clean up the remaining content to remove duplicates
      if (remainingContent) {
        const $remaining = cheerio.load(`<div>${remainingContent}</div>`);
        
        // Remove sections we already extracted
        if (ingredientsHtml) {
          ingredientSelectors.forEach(selector => {
            $remaining(selector).remove();
          });
        }
        if (instructionsHtml) {
          instructionSelectors.forEach(selector => {
            $remaining(selector).remove();
          });
        }

        const cleanedRemaining = $remaining('div').html() || '';
        
        // Only add remaining content if it's substantial and different
        if (cleanedRemaining && cleanedRemaining.trim().length > 100) {
          optimizedHtml += `<section class="recipe-additional-content">\n${cleanedRemaining}\n</section>\n`;
        }
      }
    } else {
      // If we didn't find specific sections, use all cleaned content
      // This is important for sites that don't use standard class names
      optimizedHtml = remainingContent || optimizedHtml;
    }

    // Final check - if still empty, try one more time with minimal cleaning
    if (!optimizedHtml || optimizedHtml.trim().length === 0) {
      // Last resort: reload original HTML and do minimal cleaning
      const $fallback = cheerio.load(rawHtml);
      $fallback('script, style, noscript, nav, header, footer, aside').remove();
      const fallbackContent = $fallback('body').html() || $fallback('main, article').html() || '';
      
      if (fallbackContent && fallbackContent.trim().length > 0) {
        optimizedHtml = fallbackContent;
      } else {
        return {
          success: false,
          error: 'No content found after cleaning',
        };
      }
    }

    // Normalize whitespace in the HTML string
    optimizedHtml = optimizedHtml
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/>\s+</g, '><') // Remove spaces between tags
      .trim();

    return {
      success: true,
      html: optimizedHtml,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during HTML cleaning';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Extract just the text content from HTML (for lightweight parsing)
 * This is useful when you need plain text without HTML structure
 * 
 * @param rawHtml - The raw HTML content
 * @returns Plain text content
 */
export function extractTextContent(rawHtml: string): string {
  try {
    const cleaned = cleanRecipeHTML(rawHtml);
    if (!cleaned.success || !cleaned.html) {
      return '';
    }

    const $ = cheerio.load(cleaned.html);
    return $.text().trim();
  } catch (error) {
    console.error('Error extracting text content:', error);
    return '';
  }
}



















