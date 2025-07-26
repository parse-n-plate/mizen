'use client';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorDisplay({
  message,
  onRetry,
  className = '',
}: ErrorDisplayProps) {
  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-red-700 font-medium">{message}</p>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
