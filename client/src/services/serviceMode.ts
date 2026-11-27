// Agree2Met Service Mode Helper
// Supports full demo mode (VITE_USE_MOCK=true), full backend mode (VITE_USE_MOCK=false),
// and incremental phase-wise real services (VITE_REAL_SERVICES=auth,users,organizations)

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';
const rawRealServices = import.meta.env?.VITE_REAL_SERVICES || 'auth,users,organizations';
const REAL_SERVICES = rawRealServices
  .split(',')
  .map((s: string) => s.trim().toLowerCase())
  .filter(Boolean);

export function isServiceReal(serviceName: string): boolean {
  // If demo mode is explicitly disabled, every service connects to real backend
  if (!USE_MOCK) {
    return true;
  }
  // If incremental services are specified, check membership
  return REAL_SERVICES.includes(serviceName.toLowerCase());
}

export function isFullDemoMode(): boolean {
  return USE_MOCK && REAL_SERVICES.length === 0;
}
