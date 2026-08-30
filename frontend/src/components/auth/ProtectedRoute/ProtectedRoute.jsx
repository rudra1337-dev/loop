import "./ProtectedRoute.css";
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../store/hooks';
import LoadingSpinner from "../../LoadingSpinner/LoadingSpinner";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;