import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout/Layout';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  const content = (
    <div className="not-found-page">
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      <div className="glass-card not-found-card">
        <div className="not-found-icon" aria-hidden="true">
          🧭
        </div>
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-message">
          We couldn't find the page you're looking for. It might have been moved, deleted, or the URL might be incorrect.
        </p>
        <div className="not-found-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGoHome}
          >
            {user ? 'Back to Dashboard' : 'Go to Home'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );

  if (user) {
    return <Layout>{content}</Layout>;
  }

  return content;
};

export default NotFound;
