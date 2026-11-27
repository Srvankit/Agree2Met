import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { authService } from '@/services/authService';

export const Route = createFileRoute('/_authenticated')({
  ssr: false,
  beforeLoad: async () => {
    const session = await authService.getSession();
    if (!session) {
      throw redirect({ to: '/auth' });
    }
    return { user: session };
  },
  component: () => <Outlet />,
});
