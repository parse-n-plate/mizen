'use client';

import { toast } from 'sonner';
import { getErrorDetails, ERROR_CODES } from '@/utils/formatError';

interface ShowErrorOptions {
  code?: string;
  message?: string;
  retry?: () => void;
  retryAfter?: number; // Timestamp (milliseconds) when to retry after rate limit
  sourceUrl?: string; // The URL that was being parsed (for "Visit page" action)
}

/**
 * Custom hook for showing toast notifications
 * Provides consistent error handling
 */
export function useToast() {
  const showError = (options: ShowErrorOptions) => {
    const { code = ERROR_CODES.ERR_UNKNOWN, message, retry, retryAfter, sourceUrl } = options;
    const errorDetails = getErrorDetails(code);

    // Use provided message or fallback to user-friendly message
    const userMessage = message || errorDetails.userMessage;

    // Build description with retry time if available (for rate limit errors)
    let description = errorDetails.detailedExplanation;
    if (code === ERROR_CODES.ERR_RATE_LIMIT && retryAfter) {
      const retryDate = new Date(retryAfter);
      const now = new Date();
      const secondsUntilRetry = Math.ceil((retryAfter - now.getTime()) / 1000);

      // Format retry time nicely
      let retryTimeText: string;
      if (secondsUntilRetry <= 0) {
        retryTimeText = 'You can try again now.';
      } else if (secondsUntilRetry < 60) {
        retryTimeText = `Try again in ${secondsUntilRetry} second${secondsUntilRetry !== 1 ? 's' : ''}.`;
      } else {
        const minutes = Math.floor(secondsUntilRetry / 60);
        const seconds = secondsUntilRetry % 60;
        if (seconds === 0) {
          retryTimeText = `Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
        } else {
          retryTimeText = `Try again in ${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}.`;
        }
      }

      // Format the time (e.g., "at 2:45 PM")
      const timeString = retryDate.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      description = `${errorDetails.detailedExplanation} ${retryTimeText} (at ${timeString})`;
    }

    // Determine action button: retry takes priority, then "Visit page" for errors with a source page
    let action: { label: string; onClick: () => void } | undefined;
    if (retry) {
      action = { label: 'Retry', onClick: retry };
    } else if (sourceUrl && errorDetails.hasSourcePage) {
      action = {
        label: 'Visit page',
        onClick: () => window.open(sourceUrl, '_blank', 'noopener,noreferrer'),
      };
    }

    // Create the toast with title and description
    return toast.error(userMessage, {
      description,
      duration: code === ERROR_CODES.ERR_RATE_LIMIT && retryAfter ? 10000 : 5000, // Show rate limit toasts longer
      action,
    });
  };

  const showSuccess = (message: string, description?: string, sourceUrl?: string) => {
    return toast.success(message, {
      description: description || 'Operation completed successfully',
      duration: 3000,
      action: sourceUrl
        ? {
            label: 'View original',
            onClick: () => window.open(sourceUrl, '_blank', 'noopener,noreferrer'),
          }
        : undefined,
    });
  };

  const showWarning = (message: string, description?: string) => {
    return toast.warning(message, {
      description: description || 'Please review this warning',
      duration: 4000,
    });
  };

  const showInfo = (messageOrOptions: string | ShowErrorOptions, description?: string) => {
    // Support both string message and options object (like showError)
    if (typeof messageOrOptions === 'string') {
      return toast.info(messageOrOptions, {
        description: description || 'Additional information',
        duration: 4000,
      });
    }

    // Handle options object (for error codes like ERR_NOT_A_URL)
    const { code = ERROR_CODES.ERR_UNKNOWN, message } = messageOrOptions;
    const errorDetails = getErrorDetails(code);
    const userMessage = message || errorDetails.userMessage;
    // Use detailed explanation as description
    const descriptionText = errorDetails.detailedExplanation;

    return toast.info(userMessage, {
      description: descriptionText,
      duration: 5000,
    });
  };

  return {
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };
}

