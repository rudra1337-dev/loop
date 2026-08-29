import './ErrorState.css';

const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="alert alert-error error-state-container">
      <div className="error-state-message">
        <span className="error-state-icon">❌</span>
        <span>{message || 'An unexpected error occurred. Please try again.'}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-secondary error-state-retry-btn"
        >
          🔄 Retry
        </button>
      )}
    </div>
  );
};

export default ErrorState;
