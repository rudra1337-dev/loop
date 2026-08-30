import LoadingSpinner from "../../LoadingSpinner/LoadingSpinner";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../../store/hooks";

const GuestRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default GuestRoute;