import "./Layout.css";
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>🌀</span> LOOP
        </div>
        <nav className="sidebar-menu">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span>📊</span> Dashboard
          </NavLink>
          <NavLink 
            to="/trends" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span>📈</span> Trends
          </NavLink>
          <NavLink 
            to="/feedback" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span>📥</span> Feedback Inbox
          </NavLink>
          {/* Viewers are read-only per brief C2 — hide ingest link so they don't
              hit a dead-end 403 by clicking into a page they can't use. */}
          {['ADMIN', 'ANALYST'].includes(user?.role) && (
            <NavLink 
              to="/ingestion" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span>📥</span> Ingest Feedback
            </NavLink>
          )}
          {user?.role === 'ADMIN' && (
            <NavLink 
              to="/settings/workspace" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span>⚙️</span> Workspace Settings
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-email">{user?.email || 'email@example.com'}</div>
            <div style={{ color: 'var(--color-primary)', fontSize: '10px', marginTop: '2px', fontWeight: 'bold' }}>
              💼 {user?.workspaceName || 'Default Workspace'} ({user?.role})
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Log Out
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
