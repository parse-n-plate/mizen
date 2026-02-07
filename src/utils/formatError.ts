export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    retryAfter?: number; // Timestamp (milliseconds) when to retry after rate limit
  };
}

export interface EnhancedErrorInfo {
  userMessage: string;
  detailedExplanation: string;
  suggestions: string[];
  hasSourcePage: boolean; // true = the page likely exists, show "Visit page" action
}

export const formatError = (code: string, message: string, retryAfter?: number): ErrorResponse => ({
  success: false,
  error: { code, message, ...(retryAfter && { retryAfter }) },
});

// Predefined error codes and messages
export const ERROR_CODES = {
  ERR_INVALID_URL: 'ERR_INVALID_URL',
  ERR_UNSUPPORTED_DOMAIN: 'ERR_UNSUPPORTED_DOMAIN',
  ERR_FETCH_FAILED: 'ERR_FETCH_FAILED',
  ERR_NO_RECIPE_FOUND: 'ERR_NO_RECIPE_FOUND',
  ERR_AI_PARSE_FAILED: 'ERR_AI_PARSE_FAILED',
  ERR_TIMEOUT: 'ERR_TIMEOUT',
  ERR_UNKNOWN: 'ERR_UNKNOWN',
  ERR_INVALID_FILE_TYPE: 'ERR_INVALID_FILE_TYPE',
  ERR_FILE_TOO_LARGE: 'ERR_FILE_TOO_LARGE',
  ERR_NOT_A_URL: 'ERR_NOT_A_URL',
  ERR_RATE_LIMIT: 'ERR_RATE_LIMIT',
  ERR_API_UNAVAILABLE: 'ERR_API_UNAVAILABLE',
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.ERR_INVALID_URL]: "That doesn't look like a valid URL",
  [ERROR_CODES.ERR_UNSUPPORTED_DOMAIN]: "We don't support this website yet",
  [ERROR_CODES.ERR_FETCH_FAILED]: "We couldn't reach that page",
  [ERROR_CODES.ERR_NO_RECIPE_FOUND]: 'No recipe found on this page',
  [ERROR_CODES.ERR_AI_PARSE_FAILED]: "We found the page but couldn't extract the recipe",
  [ERROR_CODES.ERR_TIMEOUT]: 'That website is taking too long',
  [ERROR_CODES.ERR_UNKNOWN]: 'Something went wrong',
  [ERROR_CODES.ERR_INVALID_FILE_TYPE]: 'Please select a valid image file',
  [ERROR_CODES.ERR_FILE_TOO_LARGE]: 'Image size must be less than 10MB',
  [ERROR_CODES.ERR_NOT_A_URL]: 'Paste a recipe URL',
  [ERROR_CODES.ERR_RATE_LIMIT]: 'Too many requests',
  [ERROR_CODES.ERR_API_UNAVAILABLE]: 'Our service is temporarily down',
} as const;

// Enhanced error information with details and suggestions
export const ERROR_DETAILS: Record<string, EnhancedErrorInfo> = {
  [ERROR_CODES.ERR_INVALID_URL]: {
    userMessage: "That doesn't look like a valid URL",
    detailedExplanation: 'Double-check the URL you pasted \u2014 it should start with http:// or https://',
    suggestions: [
      'Make sure to include http:// or https://',
      'Check for typos in the URL',
      'Try copying the URL directly from your browser\'s address bar',
      'Ensure the URL is complete and not truncated',
    ],
    hasSourcePage: false,
  },
  [ERROR_CODES.ERR_UNSUPPORTED_DOMAIN]: {
    userMessage: "We don't support this website yet",
    detailedExplanation: 'This site uses a format we can\'t read. Try a recipe from a different website.',
    suggestions: [
      'Try a recipe from a different website',
      'Check if the site has a standard recipe format',
      'Some sites may require special handling - we\'re working on adding more support',
    ],
    hasSourcePage: true,
  },
  [ERROR_CODES.ERR_FETCH_FAILED]: {
    userMessage: "We couldn't reach that page",
    detailedExplanation: 'The site may be down or blocking our request. Try visiting the page directly.',
    suggestions: [
      'Check your internet connection',
      'The website might be down - try again later',
      'Try a different recipe site',
      'Some sites block automated access - try manually copying the recipe content',
    ],
    hasSourcePage: true,
  },
  [ERROR_CODES.ERR_NO_RECIPE_FOUND]: {
    userMessage: 'No recipe found on this page',
    detailedExplanation: 'Make sure the URL points to a recipe page, not a homepage or category.',
    suggestions: [
      'Make sure the URL points to a recipe page, not a homepage or category page',
      'Try a different recipe from the same website',
      'Some sites require you to be logged in to view recipes',
      'The recipe might be in an unusual format - try another recipe',
    ],
    hasSourcePage: true,
  },
  [ERROR_CODES.ERR_AI_PARSE_FAILED]: {
    userMessage: "We found the page but couldn't extract the recipe",
    detailedExplanation: 'The recipe format may be unusual. Try visiting the page to copy it manually.',
    suggestions: [
      'The recipe format might be unusual - try a different recipe',
      'Make sure the recipe page is fully loaded before parsing',
      'Try a recipe from a more standard recipe website',
      'Some recipes with complex formatting may not parse correctly',
    ],
    hasSourcePage: true,
  },
  [ERROR_CODES.ERR_TIMEOUT]: {
    userMessage: 'That website is taking too long',
    detailedExplanation: "The site didn't respond in time \u2014 this usually means it's under heavy traffic.",
    suggestions: [
      'The site might be experiencing high traffic - try again in a few moments',
      'Try a different recipe from a faster site',
      'Check if the website is accessible in your browser',
      'Some sites are slower to respond - wait a moment and retry',
    ],
    hasSourcePage: true,
  },
  [ERROR_CODES.ERR_UNKNOWN]: {
    userMessage: 'Something went wrong',
    detailedExplanation: 'This is usually temporary. Try again or try a different recipe URL.',
    suggestions: [
      'Try again in a few moments',
      'Try a different recipe URL',
      'Check your internet connection',
      'If the problem persists, the recipe format might not be supported',
    ],
    hasSourcePage: false,
  },
  [ERROR_CODES.ERR_INVALID_FILE_TYPE]: {
    userMessage: 'Please select a valid image file',
    detailedExplanation: 'Only image files are supported (PNG, JPG, WEBP).',
    suggestions: [
      'Make sure you\'re uploading an image file',
      'Supported formats: PNG, JPG, JPEG, WEBP',
      'Try taking a screenshot if you have a PDF or document',
    ],
    hasSourcePage: false,
  },
  [ERROR_CODES.ERR_FILE_TOO_LARGE]: {
    userMessage: 'Image size must be less than 10MB',
    detailedExplanation: 'The image file you selected is too large. We support images up to 10MB in size.',
    suggestions: [
      'Resize the image before uploading',
      'Use an image compression tool to reduce file size',
      'Take a screenshot instead of uploading the original photo',
      'Try a different image with better compression',
    ],
    hasSourcePage: false,
  },
  [ERROR_CODES.ERR_NOT_A_URL]: {
    userMessage: 'Paste a recipe URL',
    detailedExplanation: 'This app imports recipes from recipe websites. Paste a full URL to get started.',
    suggestions: [
      'Copy the full URL from your browser\'s address bar',
      'Make sure the URL starts with http:// or https://',
      'Try a recipe from sites like AllRecipes, Food Network, or Bon App\u00e9tit',
    ],
    hasSourcePage: false,
  },
  [ERROR_CODES.ERR_RATE_LIMIT]: {
    userMessage: 'Too many requests',
    detailedExplanation: 'You\'ve hit the rate limit. Please wait a moment before trying again.',
    suggestions: [
      'Wait 30-60 seconds before trying again',
      'Try parsing a different recipe',
      'Rate limits reset automatically after a short time',
    ],
    hasSourcePage: false,
  },
  [ERROR_CODES.ERR_API_UNAVAILABLE]: {
    userMessage: 'Our service is temporarily down',
    detailedExplanation: "We're experiencing a brief outage \u2014 this usually resolves in a few minutes.",
    suggestions: [
      'Wait a few minutes and try again',
      'The service should be back online shortly',
      'Try a different recipe if the issue persists',
    ],
    hasSourcePage: false,
  },
};

// Helper function to get enhanced error info
export function getErrorDetails(code: string): EnhancedErrorInfo {
  return ERROR_DETAILS[code] || ERROR_DETAILS[ERROR_CODES.ERR_UNKNOWN];
}





































