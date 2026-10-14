
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({
  adminOnly = false,
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p>Verificando sua sessão...</p>;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
