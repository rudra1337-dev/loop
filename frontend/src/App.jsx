import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute/ProtectedRoute";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import GuestRoute from "./components/auth/GuestRoute/GuestRoute";
import WorkspaceSettings from "./pages/WorkspaceSettings/WorkspaceSettings";
import Dashboard from "./pages/Dashboard/Dashboard";
import Trends from "./pages/Trends/Trends";
import FeedbackExplorer from "./pages/FeedbackExplorer/FeedbackExplorer";
import IngestFeedback from "./pages/IngestFeedback/IngestFeedback";
import Landing from "./pages/Landing/Landing";
import Layout from "./components/Layout/Layout";
import AskLoop from './pages/AskLoop/AskLoop';
import Reports from "./pages/Reports/Reports";


const Unauthorized = () => (
  <div style={{ padding: "40px", textAlign: "center" }}>
    <h1 style={{ color: "var(--color-neg)", marginBottom: "16px" }}>
      ⚠️ Unauthorized Access
    </h1>

    <p style={{ color: "var(--text-secondary)" }}>
      You do not have the required permissions to view this resource.
    </p>
  </div>
);

import { useAuth } from "./context/AuthContext";
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner";

const RootRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<RootRoute />} />

      {/* Guest-only routes */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* Authenticated routes — any logged-in user */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />

        <Route
          path="/trends"
          element={
            <Layout>
              <Trends />
            </Layout>
          }
        />

        <Route
          path="/feedback"
          element={
            <Layout>
              <FeedbackExplorer />
            </Layout>
          }
        />

        <Route
          path="/ask"
          element={
            <Layout>
              <AskLoop />
            </Layout>
          }
        />
      </Route>

      <Route
        path="/reports"
        element={
          <Layout>
            <Reports />
          </Layout>
        }
      />

      {/* Analyst + Admin only — Viewers cannot ingest */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ANALYST"]} />
        }
      >
        <Route
          path="/ingestion"
          element={
            <Layout>
              <IngestFeedback />
            </Layout>
          }
        />
      </Route>

      {/* Admin only */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]} />
        }
      >
        <Route
          path="/settings/workspace"
          element={
            <Layout>
              <WorkspaceSettings />
            </Layout>
          }
        />
      </Route>

      {/* Unauthorized page */}
      <Route
        path="/unauthorized"
        element={<Unauthorized />}
      />

      {/* Unknown routes */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;