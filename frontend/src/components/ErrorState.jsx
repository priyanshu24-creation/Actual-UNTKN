import { AlertTriangle, RefreshCw } from "lucide-react";

function ErrorState({
  title = "SOMETHING WENT WRONG.",
  description = "We couldn't load this page. Please try again.",
  onRetry,
}) {
  return (
    <div className="error-state">
      <div className="error-state-icon">
        <AlertTriangle size={28} strokeWidth={1.2} />
      </div>

      <p className="eyebrow">ERROR</p>

      <h2>{title}</h2>

      <p className="error-state-description">
        {description}
      </p>

      {onRetry && (
        <button
          type="button"
          className="error-state-button"
          onClick={onRetry}
        >
          <RefreshCw size={16} strokeWidth={1.5} />
          TRY AGAIN
        </button>
      )}
    </div>
  );
}

export default ErrorState;