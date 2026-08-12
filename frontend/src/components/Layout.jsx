import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    <div class="app-container">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span>🌀</span> LOOP
        </div>
        <nav class="sidebar-menu">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span>📊</span> Dashboard
          </NavLink>
          <NavLink 
            to="/feedback" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span>💬</span> Feedback Explorer
          </NavLink>
          <NavLink 
            to="/ingestion" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span>📥</span> Ingest Feedback
          </NavLink>
          {user?.role === 'ADMIN' && (
            <NavLink 
              to="/settings/workspace" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span>⚙️</span> Workspace Settings
            </NavLink>
          )}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="sidebar-user-name">{user?.name || 'User'}</div>
            <div class="sidebar-user-email">{user?.email || 'email@example.com'}</div>
            <div style={{ color: 'var(--color-primary)', fontSize: '10px', marginTop: '2px', fontWeight: 'bold' }}>
              💼 {user?.workspaceName || 'Default Workspace'} ({user?.role})
            </div>
          </div>
          <button onClick={handleLogout} class="btn-logout">
            Log Out
          </button>
        </div>
      </aside>
      <main class="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
