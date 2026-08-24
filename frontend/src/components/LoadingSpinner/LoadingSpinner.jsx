import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner-container" role="status" aria-live="polite">
      <div className="spinner-glow"></div>
      <div className="spinner-core"></div>
      <span className="visually-hidden">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
