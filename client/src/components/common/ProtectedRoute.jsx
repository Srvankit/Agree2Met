import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../ui/Feedback/Skeleton';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <Skeleton height="32px" width="300px" />
        <div style={{ marginTop: '20px' }}>
          <Skeleton height="200px" width="100%" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
