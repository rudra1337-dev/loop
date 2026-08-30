import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/hooks';
import Layout from '../../components/Layout/Layout';
import './Unauthorized.css';

const Unauthorized = () => {
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
    <div className="unauthorized-page">
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      <div className="glass-card unauthorized-card">
        <div className="unauthorized-icon" aria-hidden="true">
          🛡️
        </div>
        <div className="unauthorized-code">403</div>
        <h1 className="unauthorized-title">Access Denied</h1>
        <p className="unauthorized-message">
          You don't have the required permissions to view this resource. This page is restricted to roles higher than your current level. Please contact your workspace administrator.
        </p>
        <div className="unauthorized-actions">
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

export default Unauthorized;
