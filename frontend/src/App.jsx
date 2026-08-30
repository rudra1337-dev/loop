import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute/ProtectedRoute";
import GuestRoute from "./components/auth/GuestRoute/GuestRoute";
import Layout from "./components/Layout/Layout";

import { useEffect, lazy, Suspense } from "react";
import { useDispatch } from "react-redux";
import { fetchMe } from "./store/slices/authSlice";
import { useAuth } from "./store/hooks";
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner";

// Lazy-loaded page components
const Login = lazy(() => import("./pages/Login/Login"));
const Signup = lazy(() => import("./pages/Signup/Signup"));
const WorkspaceSettings = lazy(() => import("./pages/WorkspaceSettings/WorkspaceSettings"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const Trends = lazy(() => import("./pages/Trends/Trends"));
const FeedbackExplorer = lazy(() => import("./pages/FeedbackExplorer/FeedbackExplorer"));
const IngestFeedback = lazy(() => import("./pages/IngestFeedback/IngestFeedback"));
const Landing = lazy(() => import("./pages/Landing/Landing"));
const AskLoop = lazy(() => import("./pages/AskLoop/AskLoop"));
const Reports = lazy(() => import("./pages/Reports/Reports"));
const ReportView = lazy(() => import("./pages/ReportView/ReportView"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound"));
const Unauthorized = lazy(() => import("./pages/Unauthorized/Unauthorized"));

const RootRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
};

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return (
    <Suspense fallback={<LoadingSpinner />}>

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

        <Route
          path="/reports"
          element={
            <Layout>
              <Reports />
            </Layout>
          }
        />

        <Route
          path="/reports/:id"
          element={
            <Layout>
              <ReportView />
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
        element={<NotFound />}
      />
    </Routes>
    </Suspense>
  );
}

export default App;