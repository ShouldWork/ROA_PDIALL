import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

/**
 * Wraps a route requiring authentication + an active role.
 * allowedRoles — if provided, only those roles may pass.
 */
export default function AuthGuard({ children, allowedRoles }) {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!userProfile?.active) {
    return <Navigate to="/pending" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
