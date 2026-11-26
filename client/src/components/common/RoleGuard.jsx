import { useAuth } from '../../context/AuthContext';
import { Banner } from '../ui/Feedback/Banner';

export function RoleGuard({ allowedRoles = [], children, fallback = null }) {
  const { user } = useAuth();

  if (!user) return fallback;

  const userRole = (user.role || 'VIEWER').toUpperCase();
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

  if (userRole === 'OWNER' || normalizedAllowed.includes(userRole)) {
    return children;
  }

  if (fallback) return fallback;

  return (
    <div style={{ padding: '24px' }}>
      <Banner
        variant="warning"
        title="Access Restricted"
        message={`Your account role (${userRole}) does not have permission to view or manage this resource. Contact your workspace administrator.`}
      />
    </div>
  );
}
