import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { useAuth } from "./context/AuthContext";
import GuestRoute from "./components/auth/GuestRoute";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard</h1>

      <p>
        Logged in as: {user?.name} ({user?.email})
      </p>

      <p>Role: {user?.role}</p>
      <p>Workspace ID: {user?.workspaceId}</p>

      <button onClick={logout}>Log out</button>
    </div>
  );
};

const Unauthorized = () => (
  <div style={{ padding: "40px" }}>
    <h1>Unauthorized</h1>
  </div>
);

function App() {
  return (
    <Routes>
      {/* Guest-only routes */}
      <Route element={<GuestRoute />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* Authenticated routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;