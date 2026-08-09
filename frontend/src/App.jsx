import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
// import Dashboard from './pages/Dashboard';
// import Unauthorized from './pages/Unauthorized';
import { useAuth } from './context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: '40px' }}>
      <h1>Dashboard (placeholder)</h1>
      <p>Logged in as: <strong>{user?.name}</strong> ({user?.email})</p>
      <p>Role: {user?.role}</p>
      <p>Workspace ID: {user?.workspaceId}</p>
      <button onClick={logout}>Log out</button>
    </div>
  );
};

const Unauthorized = () => (
  <div style={{ padding: '40px' }}>
    <h1>403 — Not authorized</h1>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        {/* <Route path="/settings/members" element={<MemberSettings />} /> */}
      </Route>

      {/* Catch-all for unmatched routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;