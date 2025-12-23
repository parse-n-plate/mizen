import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { formatError, ERROR_CODES } from '@/utils/formatError';
import { writeFile, appendFile } from 'fs/promises';
import { join } from 'path';

// Timeout constant (10 seconds, matching urlValidator)
const FETCH_TIMEOUT_MS = 10000;

// Debug logging helper - writes directly to file as backup
async function debugLog(data: any) {
  const logPath = '/Users/gageminamoto/Documents/GitHub/parse-n-plate/.cursor/debug.log';
  const logLine = JSON.stringify({...data, timestamp: Date.now()}) + '\n';
  try {
    await appendFile(logPath, logLine, 'utf8');
  } catch (err) {
    // Log error to console for debugging
    console.error('[DEBUG LOG] Failed to write log file:', err);
  }
  // Also try fetch-based logging
  fetch('http://127.0.0.1:7242/ingest/211f35f0-b7c4-4493-a3d1-13dbeecaabb1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).catch(()=>{});
}

/**
 * Fetch with timeout using AbortController
 * This ensures requests don't hang indefinitely
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  // #region agent log
  await debugLog({location:'fetchHtml/route.ts:32',message:'fetchWithTimeout entry',data:{url,timeoutMs,hasHeaders:!!options.headers},sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
  // #endregion
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // #region agent log
    await debugLog({location:'fetchHtml/route.ts:39',message:'Before fetch call',data:{url,timeoutMs},sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
    // #endregion
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    // #region agent log
    await debugLog({location:'fetchHtml/route.ts:46',message:'After fetch success',data:{status:response.status,statusText:response.statusText,ok:response.ok,contentType:response.headers.get('content-type'),url:response.url},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
    // #endregion
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    // #region agent log
    await debugLog({location:'fetchHtml/route.ts:52',message:'Fetch error caught',data:{errorName:error instanceof Error?error.name:'unknown',errorMessage:error instanceof Error?error.message:String(error),isAbortError:error instanceof Error&&error.name==='AbortError'},sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
    // #endregion
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

export async function GET(req: NextRequest) {
  console.log('[fetchHtml] GET handler called');
  try {
    const url = req.nextUrl.searchParams.get('url');
    console.log('[fetchHtml] URL received:', url);
    // #region agent log
    await debugLog({location:'fetchHtml/route.ts:65',message:'GET handler entry',data:{url:url||'null'},sessionId:'debug-session',runId:'run1',hypothesisId:'ALL'});
    // #endregion

    if (!url) {
      return NextResponse.json(
        formatError(ERROR_CODES.ERR_INVALID_URL, 'No URL provided'),
      );
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      // #region agent log
      await debugLog({location:'fetchHtml/route.ts:79',message:'URL validation failed',data:{url},sessionId:'debug-session',runId:'run1',hypothesisId:'D'});
      // #endregion
      return NextResponse.json(
        formatError(ERROR_CODES.ERR_INVALID_URL, 'Invalid URL format'),
      );
    }

    // Fetch with timeout and proper headers
    // #region agent log
    await debugLog({location:'fetchHtml/route.ts:88',message:'Before fetchWithTimeout call',data:{url,timeout:FETCH_TIMEOUT_MS},sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
    // #endregion
    const htmlRes = await fetchWithTimeout(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
      },
      FETCH_TIMEOUT_MS,
    );

    // #region agent log
    await debugLog({location:'fetchHtml/route.ts:106',message:'After fetchWithTimeout, checking response',data:{status:htmlRes.status,statusText:htmlRes.statusText,ok:htmlRes.ok,contentType:htmlRes.headers.get('content-type'),finalUrl:htmlRes.url},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
    // #endregion
    if (!htmlRes.ok) {
      // #region agent log
      await debugLog({location:'fetchHtml/route.ts:109',message:'Response not ok',data:{status:htmlRes.status,statusText:htmlRes.statusText},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
      // #endregion
      if (htmlRes.status === 404) {
        return NextResponse.json(
          formatError(ERROR_CODES.ERR_NO_RECIPE_FOUND, 'Page not found'),
        );
      }
      if (htmlRes.status >= 500) {
        return NextResponse.json(
          formatError(ERROR_CODES.ERR_FETCH_FAILED, 'Server error occurred'),
        );
      }
      return NextResponse.json(
        formatError(ERROR_CODES.ERR_FETCH_FAILED, 'Failed to fetch the page'),
      );
    }

    const fullHtml = await htmlRes.text();
    // #region agent log
    await debugLog({location:'fetchHtml/route.ts:128',message:'After text extraction',data:{htmlLength:fullHtml.length,htmlTrimmedLength:fullHtml.trim().length,first200Chars:fullHtml.substring(0,200)},sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
    // #endregion

    if (!fullHtml || fullHtml.trim().length === 0) {
      // #region agent log
      await debugLog({location:'fetchHtml/route.ts:133',message:'HTML content empty',data:{htmlLength:fullHtml?.length||0},sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
      // #endregion
      return NextResponse.json(
        formatError(ERROR_CODES.ERR_NO_RECIPE_FOUND, 'Page content is empty'),
      );
    }

    const $ = cheerio.load(fullHtml);

    // Remove scripts, styles, and all the fluff
    $(
      'script, style, noscript, link, meta, head, svg, symbol, img, button, gcse, lite-youtube, .comments, .nav, .rmp-rating-widget, .rmp-widgets-container, .topper, .topper-inset, .subnav, .entry-metadata--date, .copyright, .network-icons, .thumb-grid, .entry-title, .hero-video-container, iframe, video, audio, canvas, form, input, select, option, .navbar, .header, .footer, .sidebar, .breadcrumb, .ad, .ads, .sponsor, .promo, .popup, .modal, .newsletter, .social, .share, .related, .rating, .author, .subscribe, .login, .user, .profile, .icon, .banner, .announcement, .entry-meta, .entry-footer, .post-meta, .wp-block-group, .wp-block-buttons, .wp-caption, .widget, .wp-block-embed, .wp-block-image, .wp-block-video, .wp-block-pullquote, .adsbygoogle, .ad-container, .sponsored, .sponsor-box, .ad-slot, .outbrain, .taboola, .yummly-share, .print-btn, .print-recipe, .printable, .breadcrumbs, .breadcrumbs-container, .site-branding, .site-header, .site-footer, .post-navigation, .nav-links, .mobile-banner, .mobile-sticky, .app-banner, .open-app, .app-link, .push-modal, .push-popup, .push-subscribe, .push-banner, .theme-toggle, .dark-mode, .light-mode, .toggle-switch, .color-mode, .font-size-control, script[type="application/ld+json"], script[type="application/json"], .scroll-to-top, .floating-btn, .chat-widget, .feedback-widget, .tooltips, .hint, .hovercard, .dropdown-menu, .search-box, .search-container, .search-form, .site-search, .search-bar, .comments, .comment, #comments, #comment, [class*="comment"], [id*="comment"], [class*="reply"], [id*="reply"], [class*="disqus"], [id*="disqus"], [class*="discussion"], [id*="discussion"], [id*="wprm"], [class*="wprm"], .screen-reader-text',
    ).remove();

    // Grab just the visible body content
    const cleanHtml = $('body').html() || '';
    // #region agent log
    await debugLog({location:'fetchHtml/route.ts:150',message:'After cheerio cleaning',data:{cleanHtmlLength:cleanHtml.length,cleanHtmlTrimmedLength:cleanHtml.trim().length,hasBody:!!$('body').length},sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
    // #endregion

    if (!cleanHtml || cleanHtml.trim().length === 0) {
      // #region agent log
      await debugLog({location:'fetchHtml/route.ts:155',message:'Clean HTML empty after processing',data:{cleanHtmlLength:cleanHtml?.length||0},sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
      // #endregion
      return NextResponse.json(
        formatError(
          ERROR_CODES.ERR_NO_RECIPE_FOUND,
          'No content found after cleaning',
        ),
      );
    }

    // #region agent log
    await debugLog({location:'fetchHtml/route.ts:167',message:'Success - returning HTML',data:{cleanHtmlLength:cleanHtml.length},sessionId:'debug-session',runId:'run1',hypothesisId:'ALL'});
    // #endregion
    return NextResponse.json({ success: true, html: cleanHtml });
  } catch (error) {
    console.error('Error fetching HTML:', error);
    // #region agent log
    await debugLog({location:'fetchHtml/route.ts:171',message:'Error caught in GET handler',data:{errorName:error instanceof Error?error.name:'unknown',errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined,errorType:error instanceof TypeError?'TypeError':error instanceof Error?'Error':'Unknown'},sessionId:'debug-session',runId:'run1',hypothesisId:'ALL'});
    // #endregion

    // Handle timeout errors specifically
    if (error instanceof Error) {
      if (
        error.message.includes('timeout') ||
        error.message.includes('timed out') ||
        error.name === 'AbortError'
      ) {
        // #region agent log
        await debugLog({location:'fetchHtml/route.ts:179',message:'Timeout error detected',data:{errorMessage:error.message},sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
        // #endregion
        return NextResponse.json(
          formatError(ERROR_CODES.ERR_TIMEOUT, 'Request timed out'),
        );
      }

      // Handle network errors
      if (
        error.message.includes('fetch') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('network')
      ) {
        // #region agent log
        await debugLog({location:'fetchHtml/route.ts:193',message:'Network error detected',data:{errorMessage:error.message},sessionId:'debug-session',runId:'run1',hypothesisId:'D'});
        // #endregion
        return NextResponse.json(
          formatError(ERROR_CODES.ERR_FETCH_FAILED, 'Network error occurred'),
        );
      }
    }

    // Handle TypeError (usually network-related)
    if (error instanceof TypeError) {
      // #region agent log
      await debugLog({location:'fetchHtml/route.ts:209',message:'TypeError detected',data:{errorMessage:error.message},sessionId:'debug-session',runId:'run1',hypothesisId:'D'});
      // #endregion
      return NextResponse.json(
        formatError(ERROR_CODES.ERR_FETCH_FAILED, 'Failed to fetch the page'),
      );
    }

    // Generic error fallback
    // #region agent log
    await debugLog({location:'fetchHtml/route.ts:218',message:'Generic error fallback',data:{errorMessage:error instanceof Error?error.message:String(error)},sessionId:'debug-session',runId:'run1',hypothesisId:'G'});
    // #endregion
    return NextResponse.json(
      formatError(ERROR_CODES.ERR_UNKNOWN, 'An unexpected error occurred'),
    );
  }
}
