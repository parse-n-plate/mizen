interface ErrorLog {
  timestamp: string;
  code: string;
  message: string;
  url?: string;
  userAgent: string;
}

const ERROR_LOG_KEY = 'parse-n-plate-error-logs';
const MAX_ERROR_LOGS = 50; // Keep only the last 50 errors

export const errorLogger = {
  /**
   * Log an error to localStorage for debugging
   */
  log: (code: string, message: string, url?: string) => {
    try {
      const errorLog: ErrorLog = {
        timestamp: new Date().toISOString(),
        code,
        message,
        url,
        userAgent: navigator.userAgent,
      };

      const existingLogs = errorLogger.getLogs();
      existingLogs.unshift(errorLog); // Add new error to the beginning

      // Keep only the last MAX_ERROR_LOGS
      if (existingLogs.length > MAX_ERROR_LOGS) {
        existingLogs.splice(MAX_ERROR_LOGS);
      }

      localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(existingLogs));

      // Also log to console for immediate debugging
      console.error('Error logged:', errorLog);
    } catch (error) {
      console.error('Failed to log error to localStorage:', error);
    }
  },

  /**
   * Get all error logs from localStorage
   */
  getLogs: (): ErrorLog[] => {
    try {
      const logs = localStorage.getItem(ERROR_LOG_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to get error logs from localStorage:', error);
      return [];
    }
  },

  /**
   * Clear all error logs
   */
  clear: () => {
    try {
      localStorage.removeItem(ERROR_LOG_KEY);
    } catch (error) {
      console.error('Failed to clear error logs from localStorage:', error);
    }
  },

  /**
   * Export error logs as JSON string
   */
  export: (): string => {
    try {
      const logs = errorLogger.getLogs();
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      console.error('Failed to export error logs:', error);
      return '[]';
    }
  },
};
