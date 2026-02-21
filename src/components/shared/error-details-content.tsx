'use client';

interface ToastErrorDetailsProps {
  detailedExplanation: string;
  suggestions: string[];
}

export function ToastErrorDetails({
  detailedExplanation,
  suggestions,
}: ToastErrorDetailsProps) {
  return (
    <div className="toast-error-details-wrapper">
      {/* Always show the detailed explanation */}
      <p className="toast-error-explanation">{detailedExplanation}</p>

      {/* Always show suggestions if they exist */}
      {suggestions && suggestions.length > 0 && (
        <div className="toast-error-suggestions">
          <ul className="toast-error-suggestions-list">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="toast-error-suggestion-item">
                <span className="toast-error-bullet">•</span>
                <span className="toast-error-suggestion-text">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

