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
  ERR_FEEDBACK_SUBMIT_FAILED: 'ERR_FEEDBACK_SUBMIT_FAILED',
  ERR_FEEDBACK_UPLOAD_FAILED: 'ERR_FEEDBACK_UPLOAD_FAILED',
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.ERR_INVALID_URL]: 'Please enter a valid recipe URL.',
  [ERROR_CODES.ERR_UNSUPPORTED_DOMAIN]:
    "We can't parse recipes from this site yet.",
  [ERROR_CODES.ERR_FETCH_FAILED]:
    "We couldn't fetch that page. Try again later.",
  [ERROR_CODES.ERR_NO_RECIPE_FOUND]: "We couldn't find a recipe on this page.",
  [ERROR_CODES.ERR_AI_PARSE_FAILED]: 'Something went wrong reading the recipe.',
  [ERROR_CODES.ERR_TIMEOUT]: 'The page took too long to respond.',
  [ERROR_CODES.ERR_UNKNOWN]: 'An unexpected error occurred.',
  [ERROR_CODES.ERR_INVALID_FILE_TYPE]: 'Please select a valid image file',
  [ERROR_CODES.ERR_FILE_TOO_LARGE]: 'Image size must be less than 10MB',
  [ERROR_CODES.ERR_NOT_A_URL]: 'Paste a recipe URL',
  [ERROR_CODES.ERR_RATE_LIMIT]: 'Too many requests',
  [ERROR_CODES.ERR_API_UNAVAILABLE]: 'Service temporarily unavailable',
  [ERROR_CODES.ERR_FEEDBACK_SUBMIT_FAILED]: 'Failed to submit feedback',
  [ERROR_CODES.ERR_FEEDBACK_UPLOAD_FAILED]: 'Failed to upload screenshots',
} as const;

// Enhanced error information with details and suggestions
export const ERROR_DETAILS: Record<string, EnhancedErrorInfo> = {
  [ERROR_CODES.ERR_INVALID_URL]: {
    userMessage: 'Please enter a valid recipe URL',
    detailedExplanation: 'The URL format isn\'t recognized. Make sure you\'re copying the full URL from your browser.',
    suggestions: [
      'Make sure to include http:// or https://',
      'Check for typos in the URL',
      'Try copying the URL directly from your browser\'s address bar',
      'Ensure the URL is complete and not truncated',
    ],
  },
  [ERROR_CODES.ERR_UNSUPPORTED_DOMAIN]: {
    userMessage: 'We can\'t parse recipes from this site yet',
    detailedExplanation: 'This website uses a format that we don\'t currently support.',
    suggestions: [
      'Try a recipe from a different website',
      'Check if the site has a standard recipe format',
      'Some sites may require special handling - we\'re working on adding more support',
    ],
  },
  [ERROR_CODES.ERR_FETCH_FAILED]: {
    userMessage: 'We couldn\'t fetch that page',
    detailedExplanation: 'There was a network error connecting to the website. This could be due to connectivity issues or the site being temporarily unavailable.',
    suggestions: [
      'Check your internet connection',
      'The website might be down - try again later',
      'Try a different recipe site',
      'Some sites block automated access - try manually copying the recipe content',
    ],
  },
  [ERROR_CODES.ERR_NO_RECIPE_FOUND]: {
    userMessage: 'We couldn\'t find a recipe on this page',
    detailedExplanation: 'The page might not contain recipe content, or the recipe format isn\'t recognized by our parser.',
    suggestions: [
      'Make sure the URL points to a recipe page, not a homepage or category page',
      'Try a different recipe from the same website',
      'Some sites require you to be logged in to view recipes',
      'The recipe might be in an unusual format - try another recipe',
    ],
  },
  [ERROR_CODES.ERR_AI_PARSE_FAILED]: {
    userMessage: 'Something went wrong reading the recipe',
    detailedExplanation: 'We encountered an issue while processing the recipe content. This might be due to an unusual format or incomplete data.',
    suggestions: [
      'The recipe format might be unusual - try a different recipe',
      'Make sure the recipe page is fully loaded before parsing',
      'Try a recipe from a more standard recipe website',
      'Some recipes with complex formatting may not parse correctly',
    ],
  },
  [ERROR_CODES.ERR_TIMEOUT]: {
    userMessage: 'The page took too long to respond',
    detailedExplanation: 'The website didn\'t respond within 30 seconds. This could be due to slow server response or high traffic.',
    suggestions: [
      'The site might be experiencing high traffic - try again in a few moments',
      'Try a different recipe from a faster site',
      'Check if the website is accessible in your browser',
      'Some sites are slower to respond - wait a moment and retry',
    ],
  },
  [ERROR_CODES.ERR_UNKNOWN]: {
    userMessage: 'An unexpected error occurred',
    detailedExplanation: 'Something went wrong that we didn\'t anticipate. This is unusual and might be a temporary issue.',
    suggestions: [
      'Try again in a few moments',
      'Try a different recipe URL',
      'Check your internet connection',
      'If the problem persists, the recipe format might not be supported',
    ],
  },
  [ERROR_CODES.ERR_INVALID_FILE_TYPE]: {
    userMessage: 'Please select a valid image file',
    detailedExplanation: 'Only image files are supported (PNG, JPG, WEBP).',
    suggestions: [
      'Make sure you\'re uploading an image file',
      'Supported formats: PNG, JPG, JPEG, WEBP',
      'Try taking a screenshot if you have a PDF or document',
    ],
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
  },
  [ERROR_CODES.ERR_NOT_A_URL]: {
    userMessage: 'Paste a recipe URL',
    detailedExplanation: 'This app imports recipes from recipe websites. Paste a full URL to get started.',
    suggestions: [
      'Copy the full URL from your browser\'s address bar',
      'Make sure the URL starts with http:// or https://',
      'Try a recipe from sites like AllRecipes, Food Network, or Bon Appétit',
    ],
  },
  [ERROR_CODES.ERR_RATE_LIMIT]: {
    userMessage: 'Too many requests',
    detailedExplanation: 'You\'ve hit the rate limit. Please wait a moment before trying again.',
    suggestions: [
      'Wait 30-60 seconds before trying again',
      'Try parsing a different recipe',
      'Rate limits reset automatically after a short time',
    ],
  },
  [ERROR_CODES.ERR_API_UNAVAILABLE]: {
    userMessage: 'Service temporarily unavailable',
    detailedExplanation: 'Our AI service is experiencing issues. Please try again in a few moments.',
    suggestions: [
      'Wait a few minutes and try again',
      'The service should be back online shortly',
      'Try a different recipe if the issue persists',
    ],
  },
  [ERROR_CODES.ERR_FEEDBACK_SUBMIT_FAILED]: {
    userMessage: 'Failed to submit feedback',
    detailedExplanation: 'We encountered an error while submitting your feedback. Please try again.',
    suggestions: [
      'Check your internet connection',
      'Try submitting again in a few moments',
      'Make sure all required fields are filled',
    ],
  },
  [ERROR_CODES.ERR_FEEDBACK_UPLOAD_FAILED]: {
    userMessage: 'Failed to upload screenshots',
    detailedExplanation: 'We encountered an error while uploading your screenshots. Your feedback may still be submitted without images.',
    suggestions: [
      'Try uploading smaller images',
      'Check your internet connection',
      'You can submit without screenshots and add them later',
    ],
  },
};

// Helper function to get enhanced error info
export function getErrorDetails(code: string): EnhancedErrorInfo {
  return ERROR_DETAILS[code] || ERROR_DETAILS[ERROR_CODES.ERR_UNKNOWN];
}





































