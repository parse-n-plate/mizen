import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { formatError, ERROR_CODES } from '@/utils/formatError';

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        formatError(ERROR_CODES.ERR_INVALID_URL, 'No URL provided'),
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

    const htmlRes = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

    if (!htmlRes.ok) {
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

    if (!fullHtml || fullHtml.trim().length === 0) {
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

    if (!cleanHtml || cleanHtml.trim().length === 0) {
      return NextResponse.json(
        formatError(
          ERROR_CODES.ERR_NO_RECIPE_FOUND,
          'No content found after cleaning',
        ),
      );
    }

    return NextResponse.json({ success: true, html: cleanHtml });
  } catch (error) {
    console.error('Error fetching HTML:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        formatError(ERROR_CODES.ERR_FETCH_FAILED, 'Network error occurred'),
      );
    }

    return NextResponse.json(
      formatError(ERROR_CODES.ERR_UNKNOWN, 'An unexpected error occurred'),
    );
  }
}
