import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createRouter, RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "@/routeTree.gen";
import { seed, persist, load } from "@/services/mock";
import { apiClient } from "@/services/api";

describe("Frontend Route Smoke Tests (TanStack Router & Mock Store)", () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Reset to clean seed before each test
    persist(seed());

    // Mock apiClient.getHealth for /status route
    vi.spyOn(apiClient, "getHealth").mockResolvedValue({
      success: true,
      data: {
        status: "healthy",
        uptimeSeconds: 120,
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        services: { database: true, redis: true, storage: true, smtp: true },
      },
    });

    consoleErrorSpy = vi.spyOn(console, "error");
  });

  afterEach(() => {
    // Assert zero uncaught React or component crash errors occurred
    const crashErrors = consoleErrorSpy.mock.calls.filter(([arg]: any[]) => {
      const msg = typeof arg === "string" ? arg : arg?.message || "";
      return (
        msg.includes("Cannot read properties of undefined") ||
        msg.includes("Element type is invalid") ||
        msg.includes("[Root ErrorComponent caught an error]") ||
        msg.includes("The above error occurred in the")
      );
    });

    expect(crashErrors).toHaveLength(0);
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  const renderRoute = async (path: string) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const history = createMemoryHistory({ initialEntries: [path] });
    const router = createRouter({
      routeTree,
      history,
      context: { queryClient },
    });

    const result = render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    // Ensure error screen did not trigger
    expect(screen.queryByText(/This page didn’t load/i)).not.toBeInTheDocument();
    return result;
  };

  describe("1. Public and Informational Routes", () => {
    const publicRoutes = [
      { path: "/", label: "Home / Workspace" },
      { path: "/landing", label: "Landing Showcase" },
      { path: "/auth", label: "Auth Portal" },
      { path: "/login", label: "Login Page" },
      { path: "/register", label: "Register Page" },
      { path: "/forgot-password", label: "Forgot Password" },
      { path: "/reset-password", label: "Reset Password" },
      { path: "/verify-email", label: "Verify Email" },
      { path: "/terms", label: "Terms of Use" },
      { path: "/privacy", label: "Privacy Policy" },
      { path: "/status", label: "System Status Diagnostics" },
      { path: "/sign/demo-1", label: "Public Signing Portal" },
    ];

    publicRoutes.forEach(({ path, label }) => {
      it(`renders ${label} at ${path} cleanly without errors`, async () => {
        const { container } = await renderRoute(path);
        expect(container).toBeInTheDocument();
        expect(screen.queryByText(/This page didn’t load/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("2. Authenticated Routes Across All 4 Roles", () => {
    const roles = ["Owner", "Admin", "Member", "Viewer"];
    const workspaceRoutes = [
      { path: "/app", label: "App Dashboard" },
      { path: "/app/agreements", label: "Agreements List" },
      { path: "/app/agreements/AG-2026-001", label: "Agreement Details" },
      { path: "/app/new", label: "New Agreement Wizard" },
      { path: "/app/documents", label: "Documents Repository" },
      { path: "/app/templates", label: "Templates Library" },
      { path: "/app/deadlines", label: "Deadlines Calendar" },
      { path: "/app/notifications", label: "Notifications Center" },
      { path: "/app/analytics", label: "Analytics Dashboard" },
      { path: "/app/team", label: "Team Management" },
      { path: "/app/settings", label: "Settings Page" },
      { path: "/app/archive", label: "Archived Agreements" },
      { path: "/app/ai", label: "AI Assistant" },
      { path: "/account", label: "Account Profile" },
    ];

    roles.forEach((role) => {
      describe(`Role: ${role}`, () => {
        beforeEach(() => {
          const state = seed();
          state.demoRole = role;
          state.profile = {
            name: `Alex Morgan (${role})`,
            email: "alex@agree2met.com",
          };
          persist(state);
        });

        workspaceRoutes.forEach(({ path, label }) => {
          it(`renders ${label} (${path}) for ${role} cleanly`, async () => {
            const { container } = await renderRoute(path);
            expect(container).toBeInTheDocument();
            expect(screen.queryByText(/This page didn’t load/i)).not.toBeInTheDocument();
          });
        });
      });
    });
  });

  describe("3. Empty Store Resilience (Zero Agreements, Zero Categories, Zero Team)", () => {
    beforeEach(() => {
      const state = seed();
      state.agreements = [];
      state.team = [];
      state.categories = [];
      state.notifications = [];
      state.conversations = [];
      persist(state);
    });

    const emptyStoreRoutes = [
      { path: "/app", label: "Empty Dashboard" },
      { path: "/app/agreements", label: "Empty Agreements List" },
      { path: "/app/new", label: "Wizard with Empty Store" },
      { path: "/app/documents", label: "Empty Documents" },
      { path: "/app/templates", label: "Empty Templates" },
      { path: "/app/deadlines", label: "Empty Deadlines" },
      { path: "/app/notifications", label: "Empty Notifications" },
      { path: "/app/analytics", label: "Empty Analytics" },
      { path: "/app/team", label: "Empty Team" },
      { path: "/app/settings", label: "Settings with Empty Store" },
      { path: "/app/archive", label: "Empty Archive" },
      { path: "/app/ai", label: "Empty AI" },
      { path: "/account", label: "Account with Empty Store" },
    ];

    emptyStoreRoutes.forEach(({ path, label }) => {
      it(`gracefully renders ${label} (${path}) without undefined errors`, async () => {
        const { container } = await renderRoute(path);
        expect(container).toBeInTheDocument();
        expect(screen.queryByText(/This page didn’t load/i)).not.toBeInTheDocument();
      });
    });
  });
});
