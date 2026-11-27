import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { load } from '@/services/mock';

export const Route = createFileRoute('/_authenticated')({
  ssr: false,
  beforeLoad: async () => {
    const state = load();
    if (!state?.profile) {
      throw redirect({ to: '/auth' });
    }
    return {
      user: {
        id: 'usr-demo-01',
        name: state.profile.name || 'Alex Morgan',
        email: state.profile.email || 'alex@agree2met.com',
        role: state.demoRole || 'Owner',
      },
    };
  },
  component: () => <Outlet />,
});
