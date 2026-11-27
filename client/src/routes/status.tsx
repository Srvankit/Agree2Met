import { createFileRoute } from '@tanstack/react-router';
import { StatusPage } from '@/pages/StatusPage';
import { pageHead } from '@/lib/page-head';

export const Route = createFileRoute('/status')({
  head: () => pageHead('System Status', 'Agree2Met Phase 1 Infrastructure Diagnostics and Health Monitor.'),
  component: StatusPage,
});
