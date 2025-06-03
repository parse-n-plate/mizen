
export function extractTitle(htmlContent: string): string {
  const titlePatterns = [
    /<title[^>]*>([^<]+)</i,
    /<h1[^>]*class="[^"]*recipe[^"]*"[^>]*>([^<]+)</i,
    /<h1[^>]*>([^<]+)</i,
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
  ];
  
  for (const pattern of titlePatterns) {
    const match = htmlContent.match(pattern);
    if (match) {
      return decodeHtmlEntities(match[1].trim().replace(/\s*\|\s*.*$/, '')); // Remove site name after |
    }
  }
  
  return 'Untitled Recipe';
}

export function extractImage(htmlContent: string): string | undefined {
  const imagePatterns = [
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /<img[^>]*class="[^"]*recipe[^"]*"[^>]*src=["']([^"']+)["']/i,
    /<img[^>]*src=["']([^"']*recipe[^"']*)["']/i,
    /<img[^>]*class="[^"]*featured[^"]*"[^>]*src=["']([^"']+)["']/i
  ];
  
  for (const pattern of imagePatterns) {
    const match = htmlContent.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return undefined;
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .trim();
}
