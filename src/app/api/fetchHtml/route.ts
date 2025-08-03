import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Function to validate URL and prevent SSRF attacks
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    
    // Block common internal/private IP ranges and localhost
    const hostname = url.hostname.toLowerCase();
    
    // Block localhost and loopback addresses
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return false;
    }
    
    // Block private IP ranges (RFC 1918)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const [, a, b, c, d] = ipMatch.map(Number);
      // Block 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
      if (
        a === 10 ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        a === 169 && b === 254 // Link-local
      ) {
        return false;
      }
    }
    
    // Block common internal domains
    const blockedDomains = ['internal', 'local', 'intranet'];
    if (blockedDomains.some(domain => hostname.includes(domain))) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url)
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 });

  // Validate URL to prevent SSRF attacks
  if (!isValidUrl(url)) {
    return NextResponse.json(
      { error: 'Invalid or potentially unsafe URL' },
      { status: 400 }
    );
  }

  try {
    const htmlRes = await fetch(url, {
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'RecipeParser/1.0 (Recipe parsing bot)',
      },
    });
    
    if (!htmlRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${htmlRes.status} ${htmlRes.statusText}` },
        { status: 400 }
      );
    }
    
    const fullHtml = await htmlRes.text();

    const $ = cheerio.load(fullHtml);
    // .topper, .topper-inset, .subnav, .shell, .no-subnav, .has-subnav, .authgor, .single-post
    // Remove scripts, styles, and all the fluff
    $(
      'script, style, noscript, link, meta, head, svg, symbol, img, button, gcse, lite-youtube, .comments, .nav, .rmp-rating-widget, .rmp-widgets-container, .topper, .topper-inset, .subnav, .entry-metadata--date, .copyright, .network-icons, .thumb-grid, .entry-title, .hero-video-container, iframe, video, audio, canvas, form, input, select, option, .navbar, .header, .footer, .sidebar, .breadcrumb, .ad, .ads, .sponsor, .promo, .popup, .modal, .newsletter, .social, .share, .related, .rating, .author, .subscribe, .login, .user, .profile, .icon, .banner, .announcement, .entry-meta, .entry-footer, .post-meta, .wp-block-group, .wp-block-buttons, .wp-caption, .widget, .wp-block-embed, .wp-block-image, .wp-block-video, .wp-block-pullquote, .adsbygoogle, .ad-container, .sponsored, .sponsor-box, .ad-slot, .outbrain, .taboola, .yummly-share, .print-btn, .print-recipe, .printable, .breadcrumbs, .breadcrumbs-container, .site-branding, .site-header, .site-footer, .post-navigation, .nav-links, .mobile-banner, .mobile-sticky, .app-banner, .open-app, .app-link, .push-modal, .push-popup, .push-subscribe, .push-banner, .theme-toggle, .dark-mode, .light-mode, .toggle-switch, .color-mode, .font-size-control, script[type="application/ld+json"], script[type="application/json"], .scroll-to-top, .floating-btn, .chat-widget, .feedback-widget, .tooltips, .hint, .hovercard, .dropdown-menu, .search-box, .search-container, .search-form, .site-search, .search-bar, .comments, .comment, #comments, #comment, [class*="comment"], [id*="comment"], [class*="reply"], [id*="reply"], [class*="disqus"], [id*="disqus"], [class*="discussion"], [id*="discussion"], [id*="wprm"], [class*="wprm"], .screen-reader-text',
    ).remove();

    // Grab just the visible body content
    const cleanHtml = $('body').html() || '';

    return NextResponse.json({ html: cleanHtml });
  } catch (err) {
    console.error('Error parsing HTML:', err);
    return NextResponse.json(
      { error: 'Failed to fetch or clean HTML' },
      { status: 500 },
    );
  }
}
