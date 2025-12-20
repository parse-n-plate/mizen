export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export const formatError = (code: string, message: string): ErrorResponse => ({
  success: false,
  error: { code, message },
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
} as const;




























