import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/formatError';

export const useRecipeErrorHandler = () => {
  const handle = (code: string): string => {
    switch (code) {
      case ERROR_CODES.ERR_INVALID_URL:
        return ERROR_MESSAGES[ERROR_CODES.ERR_INVALID_URL];
      case ERROR_CODES.ERR_UNSUPPORTED_DOMAIN:
        return ERROR_MESSAGES[ERROR_CODES.ERR_UNSUPPORTED_DOMAIN];
      case ERROR_CODES.ERR_FETCH_FAILED:
        return ERROR_MESSAGES[ERROR_CODES.ERR_FETCH_FAILED];
      case ERROR_CODES.ERR_NO_RECIPE_FOUND:
        return ERROR_MESSAGES[ERROR_CODES.ERR_NO_RECIPE_FOUND];
      case ERROR_CODES.ERR_AI_PARSE_FAILED:
        return ERROR_MESSAGES[ERROR_CODES.ERR_AI_PARSE_FAILED];
      case ERROR_CODES.ERR_TIMEOUT:
        return ERROR_MESSAGES[ERROR_CODES.ERR_TIMEOUT];
      default:
        return ERROR_MESSAGES[ERROR_CODES.ERR_UNKNOWN];
    }
  };

  return { handle };
};




























