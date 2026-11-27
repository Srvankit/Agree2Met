import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import { useEffect, type ReactNode } from 'react';
import appCss from '../styles.css?url';
import { WorkspaceProvider } from '../context/Workspace';
import { Shell } from '../components/demo/Shell';
import { Button, EmptyState } from '../components/demo/ui';
import s from '../pages/pages.module.css';

function NotFoundComponent() {
  return (
    <main className={s['auth']}>
      <EmptyState title="404 · Page not found" text="The page you’re looking for doesn’t exist.">
        <Link to="/" className={s['textLink']}>
          Back to Agree2Met →
        </Link>
      </EmptyState>
    </main>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  useEffect(() => {
    console.error('[Root ErrorComponent caught an error]:', error);
  }, [error]);

  return (
    <main className={s['auth']}>
      <EmptyState title="This page didn’t load" text="Try again, or head back to your workspace.">
        <Button
          onClick={() => {
            void router.invalidate();
            reset();
          }}
        >
          Try again
        </Button>
        <Link to="/" className={s['textLink']}>
          Go home
        </Link>
      </EmptyState>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Agree2Met · Digital agreements' },
      { name: 'description', content: 'A considered home for every agreement.' },
      { property: 'og:title', content: 'Agree2Met · Digital agreements' },
      { property: 'og:description', content: 'A considered home for every agreement.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const workspace =
    path === '/' ||
    path === '/app' ||
    path.startsWith('/app/') ||
    path === '/account';

  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceProvider>
        {workspace ? <Shell><Outlet /></Shell> : <Outlet />}
      </WorkspaceProvider>
    </QueryClientProvider>
  );
}
