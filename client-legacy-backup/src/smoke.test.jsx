import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import { mockStore } from './services/mock/mockStore';
import { apiClient } from './services/api';
import { CURRENT_USER } from './services/mock/seedData';

describe('Frontend Route Smoke Tests (Zero Undefined Map Crashes)', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // Reset mock store to clean initial state before each test
    mockStore.reset();

    // Mock apiClient.getHealth for /status route
    vi.spyOn(apiClient, 'getHealth').mockResolvedValue({
      success: true,
      data: {
        status: 'healthy',
        uptimeSeconds: 100,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        services: { database: true, redis: true, storage: true, smtp: true },
      },
    });

    // Spy on console.error to catch any ErrorBoundary or React component crashes
    consoleErrorSpy = vi.spyOn(console, 'error');
  });

  afterEach(() => {
    // Ensure no uncaught React or ErrorBoundary errors were logged during render
    const crashErrors = consoleErrorSpy.mock.calls.filter(([arg]) => {
      const msg = typeof arg === 'string' ? arg : arg?.message || '';
      return (
        msg.includes('[ErrorBoundary caught an error]') ||
        msg.includes('Cannot read properties of undefined') ||
        msg.includes('The above error occurred in the') ||
        msg.includes('Element type is invalid')
      );
    });
    expect(crashErrors).toHaveLength(0);
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  const renderRoute = (route) => {
    const res = render(
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    return res;
  };

  describe('1. Public & Guest Routes (Unauthenticated)', () => {
    beforeEach(() => {
      mockStore.state.user = null;
    });

    const publicRoutes = [
      { path: '/', label: 'Landing Page' },
      { path: '/login', label: 'Login Page' },
      { path: '/register', label: 'Register Page' },
      { path: '/verify-email', label: 'Verify Email Page' },
      { path: '/forgot-password', label: 'Forgot Password Page' },
      { path: '/reset-password', label: 'Reset Password Page' },
      { path: '/legal/terms', label: 'Terms Page' },
      { path: '/legal/privacy', label: 'Privacy Page' },
      { path: '/status', label: 'Diagnostic Status Page' },
      { path: '/dev/components', label: 'Component Showcase' },
      { path: '/403', label: 'Forbidden Page' },
      { path: '/500', label: 'Server Error Page' },
      { path: '/non-existent-route-404', label: 'Not Found Page' },
    ];

    publicRoutes.forEach(({ path, label }) => {
      it(`renders ${label} at ${path} without error`, async () => {
        const { container } = renderRoute(path);
        expect(container).toBeInTheDocument();
        expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
      });
    });

    it('renders guest signing portal at /sign/tok_msa_starlight_p1 without crashing', async () => {
      mockStore.reset();
      const { container } = renderRoute('/sign/tok_msa_starlight_p1');
      expect(container).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('2. Authenticated Routes Across All 4 Roles', () => {
    const roles = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];
    const appRoutes = [
      { path: '/app/dashboard', label: 'Dashboard' },
      { path: '/app/agreements', label: 'Agreements List' },
      { path: '/app/agreements/new', label: 'New Agreement Wizard' },
      { path: '/app/agreements/agr-01', label: 'Agreement Details' },
      { path: '/app/agreements/agr-01/edit', label: 'Edit Agreement Wizard' },
      { path: '/app/documents', label: 'Documents Repository' },
      { path: '/app/templates', label: 'Templates' },
      { path: '/app/deadlines', label: 'Deadlines Calendar' },
      { path: '/app/notifications', label: 'Notifications Center' },
      { path: '/app/analytics', label: 'Analytics' },
      { path: '/app/ai', label: 'AI Assistant' },
      { path: '/app/team', label: 'Team & RBAC' },
      { path: '/app/settings', label: 'Organization Settings' },
      { path: '/app/archive', label: 'Archived Agreements' },
    ];

    roles.forEach((role) => {
      describe(`Role: ${role}`, () => {
        beforeEach(() => {
          mockStore.reset();
          mockStore.state.user = {
            ...CURRENT_USER,
            role,
          };
        });

        appRoutes.forEach(({ path, label }) => {
          it(`renders ${label} (${path}) for role ${role} cleanly`, async () => {
            const { container } = renderRoute(path);
            expect(container).toBeInTheDocument();
            await waitFor(() => {
              expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
            });
          });
        });
      });
    });
  });

  describe('3. Empty Store Resilience (Zero Agreements, Zero Categories, Zero Templates)', () => {
    beforeEach(() => {
      mockStore.reset();
      mockStore.state.user = { ...CURRENT_USER, role: 'OWNER' };
      // Completely wipe all collections to verify safe fallbacks
      mockStore.state.agreements = [];
      mockStore.state.categories = [];
      mockStore.state.templates = [];
      mockStore.state.notifications = [];
      mockStore.state.reminders = [];
      mockStore.state.archivedAgreements = [];
    });

    const emptyStoreRoutes = [
      { path: '/app/dashboard', label: 'Empty Dashboard' },
      { path: '/app/agreements', label: 'Empty Agreements List' },
      { path: '/app/agreements/new', label: 'New Agreement with Empty Templates/Categories' },
      { path: '/app/documents', label: 'Empty Documents Page' },
      { path: '/app/templates', label: 'Empty Templates Page' },
      { path: '/app/deadlines', label: 'Empty Deadlines Page' },
      { path: '/app/notifications', label: 'Empty Notifications Page' },
      { path: '/app/analytics', label: 'Empty Analytics Page' },
      { path: '/app/ai', label: 'Empty AI Assistant Page' },
      { path: '/app/team', label: 'Team Page' },
      { path: '/app/settings', label: 'Settings Page' },
      { path: '/app/archive', label: 'Empty Archive Page' },
    ];

    emptyStoreRoutes.forEach(({ path, label }) => {
      it(`gracefully renders ${label} without any undefined .map() crash`, async () => {
        const { container } = renderRoute(path);
        expect(container).toBeInTheDocument();
        await waitFor(() => {
          expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
        });
      });
    });
  });
});
