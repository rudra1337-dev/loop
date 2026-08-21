import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import GuestRoute from "./components/auth/GuestRoute";
import WorkspaceSettings from "./pages/WorkspaceSettings";
import Dashboard from "./pages/Dashboard";
import Trends from "./pages/Trends";
import FeedbackExplorer from "./pages/FeedbackExplorer";
import IngestFeedback from "./pages/IngestFeedback";
import Layout from "./components/Layout";

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

function App() {
  return (
    <Routes>
      {/* Guest-only routes */}
      <Route element={<GuestRoute />}>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

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
      </Route>

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