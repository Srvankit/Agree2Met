// Agree2Met Client Mock Store (Version 4)
// Guarantees stable schema versioning, array return invariants, and zero undefined .map() calls

import { transition } from '../../domain/lifecycle';

export const MOCK_STORE_VERSION = 4;
export const MOCK_STORAGE_KEY = 'agree2met-demo-v4';

export const categories = [
  'Service Agreement',
  'Non-Disclosure',
  'Employment',
  'Partnership',
  'Sales',
  'Lease',
  'Consulting',
  'Licensing',
  'Other',
];

const titles = [
  'Website redesign agreement',
  'Mutual non-disclosure agreement',
  'Marketing services agreement',
  'Product design consulting',
  'Software licensing agreement',
  'Employment agreement — Sarah Chen',
  'Office lease agreement',
  'Strategic partnership agreement',
  'Brand identity project',
  'Cloud infrastructure services',
  'Content production agreement',
  'Consulting services agreement',
  'Vendor supply agreement',
  'Freelance development contract',
  'Data processing agreement',
  'Sales distribution agreement',
  'Mobile app development',
  'Research collaboration agreement',
  'Talent acquisition services',
  'Workspace lease renewal',
  'Analytics consulting agreement',
  'Creative services agreement',
  'Annual software subscription',
  'Equipment purchase agreement',
  'Community partnership agreement',
  'Operations consulting agreement',
  'Digital asset licensing',
  'Employee confidentiality agreement',
  'Event production agreement',
  'Financial advisory services',
];

const clients = [
  'Acme Inc.',
  'Notion Labs',
  'Orbit Studio',
  'Figma Inc.',
  'Linear',
  'Vercel',
  'Northstar Co.',
  'Arc Technologies',
];

export function normalizeAgreement(a: any) {
  if (!a) return a;
  return {
    ...a,
    parties: Array.isArray(a.parties) ? a.parties : [],
    clauses: Array.isArray(a.clauses) ? a.clauses : [],
    milestones: Array.isArray(a.milestones) ? a.milestones : [],
    files: Array.isArray(a.files) ? a.files : [],
    reminders: Array.isArray(a.reminders) ? a.reminders : [],
    audit: Array.isArray(a.audit) ? a.audit : [],
    versions: Array.isArray(a.versions) ? a.versions : [],
  };
}

export function seed() {
  const pattern = [
    'Awaiting Signatures', 'Completed', 'Draft', 'Partially Signed', 'Pending Review', 'Completed',
    'Sent', 'Expired', 'Rejected', 'Cancelled', 'Completed', 'Awaiting Signatures',
    'Completed', 'Draft', 'Completed', 'Partially Signed', 'Completed', 'Sent',
    'Pending Review', 'Completed', 'Awaiting Signatures', 'Completed', 'Draft', 'Completed',
    'Expired', 'Completed', 'Completed', 'Completed', 'Completed', 'Completed',
  ];

  return {
    _version: MOCK_STORE_VERSION,
    agreements: titles.map((title, i) =>
      normalizeAgreement({
        id: `AG-${2026}-${String(i + 1).padStart(3, '0')}`,
        title,
        client: clients[i % clients.length],
        category: categories[i % categories.length],
        status: pattern[i] || 'Draft',
        value: [4800, 0, 12500, 8500, 24000, 72000, 18000, 15000][i % 8] || 0,
        created: `2026-11-${String(Math.max(1, 26 - i)).padStart(2, '0')}`,
        deadline: `2026-${i % 7 === 0 ? '12' : '11'}-${String(i % 7 === 0 ? 2 : 27 + (i % 4)).padStart(2, '0')}`,
        org: i < 24 ? 'studio' : 'labs',
        archived: false,
        parties: [
          { name: 'Alex Morgan', email: 'alex@agree2met.com', signed: pattern[i] === 'Completed' },
          {
            name: clients[i % clients.length],
            email: `legal@${clients[i % clients.length]?.toLowerCase().replace(/[^a-z]/g, '')}.example`,
            signed: ['Completed', 'Partially Signed'].includes(pattern[i] || ''),
          },
        ],
        clauses: [
          {
            title: 'Scope of work',
            text: 'The service provider shall deliver the agreed services in accordance with the project scope and mutually agreed milestones.',
          },
          {
            title: 'Payment terms',
            text: 'Payment is due within 30 days of receipt of an invoice. All changes to the scope require written approval from both parties.',
          },
          {
            title: 'Confidentiality',
            text: 'Both parties agree to protect confidential information disclosed during the engagement.',
          },
        ],
        milestones: [{ title: 'Project completion', amount: [4800, 0, 12500, 8500, 24000, 72000, 18000, 15000][i % 8] || 0 }],
        files: [],
        reminders: [],
        audit: [],
        versions: [{ name: 'Version 1', date: '2026-11-20', text: 'Original agreement terms.' }],
        token: `demo-${i + 1}`,
      })
    ),
    notifications: [
      { id: 1, title: 'Acme Inc. is ready to sign', text: 'Website redesign agreement is awaiting a signature.', read: false, agreement: 'AG-2026-001' },
      { id: 2, title: 'Agreement completed', text: 'Notion Labs signed the mutual non-disclosure agreement.', read: false, agreement: 'AG-2026-002' },
      { id: 3, title: 'Deadline approaching', text: 'Product design consulting is due tomorrow.', read: false, agreement: 'AG-2026-004' },
      { id: 4, title: 'Welcome to Agree2Met', text: 'Your workspace is ready.', read: true },
    ],
    team: [
      { id: 1, name: 'Alex Morgan', email: 'alex@agree2met.com', role: 'Owner', status: 'Active' },
      { id: 2, name: 'Sarah Chen', email: 'sarah@agree2met.com', role: 'Admin', status: 'Active' },
      { id: 3, name: 'James Wilson', email: 'james@agree2met.com', role: 'Member', status: 'Active' },
      { id: 4, name: 'Olivia Bennett', email: 'olivia@agree2met.com', role: 'Viewer', status: 'Active' },
    ],
    categories: [...categories],
    conversations: [],
    preferences: {},
    org: 'studio',
    profile: { name: 'Alex Morgan', email: 'alex@agree2met.com' },
    organization: { studio: 'Studio Collective', labs: 'Northstar Labs' },
    demoRole: 'Owner',
  };
}

export function load() {
  try {
    if (typeof localStorage !== 'undefined') {
      // Clean up legacy storage keys
      localStorage.removeItem('agree2met-demo-v1');
      localStorage.removeItem('agree2met-demo-v2');
      localStorage.removeItem('agree2met-demo-v3');
      localStorage.removeItem('agree2met_mock_db');
      localStorage.removeItem('agree2met_mock_db_v2');
      localStorage.removeItem('agree2met_mock_db_v3');

      const raw = localStorage.getItem(MOCK_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (
          data &&
          data._version === MOCK_STORE_VERSION &&
          Array.isArray(data.agreements) &&
          Array.isArray(data.team) &&
          Array.isArray(data.categories) &&
          Array.isArray(data.notifications)
        ) {
          data.agreements = data.agreements.map(normalizeAgreement);
          return { ...seed(), ...data };
        }
      }
    }
  } catch (e) {
    console.warn('Could not load mock store from localStorage, using seed data:', e);
  }
  const fresh = seed();
  persist(fresh);
  return fresh;
}

export function persist(data: any) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // Storage quota or security error
  }
}

export function stats(rows: any[]) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const count = (s: string) => safeRows.filter((a) => a.status === s).length;
  return {
    total: safeRows.length,
    completed: count('Completed'),
    running: safeRows.filter((a) =>
      ['Pending Review', 'Sent', 'Awaiting Signatures', 'Partially Signed'].includes(a.status)
    ).length,
    pending: count('Awaiting Signatures') + count('Partially Signed'),
    expired: count('Expired'),
    rate: safeRows.length ? Math.round((count('Completed') / safeRows.length) * 100) : 0,
  };
}

export function download(name: string, text: string, type = 'text/plain') {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function documentText(a: any) {
  if (!a) return '';
  const parties = Array.isArray(a.parties) ? a.parties.map((p: any) => p.name).join(' and ') : '';
  const clauses = Array.isArray(a.clauses)
    ? a.clauses.map((c: any, i: number) => `${i + 1}. ${c.title}\n${c.text}`).join('\n\n')
    : '';
  return `${a.title || 'Untitled'}\n${a.id || ''}\n\nBetween ${parties}\n\n${clauses}\n\nTotal value: $${a.value || 0}\nDeadline: ${a.deadline || ''}`;
}

export async function hashEvent(event: any) {
  const { hash, ...payload } = event;
  const result = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)));
  return Array.from(new Uint8Array(result), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function appendAudit(agreement: any, action: string) {
  const safeAudit = Array.isArray(agreement?.audit) ? agreement.audit : [];
  const event = {
    action,
    date: new Date().toISOString(),
    actor: 'Alex Morgan',
    previous: safeAudit.at(-1)?.hash ?? 'GENESIS',
  };
  return { ...event, hash: await hashEvent(event) };
}

export async function verifyAudit(events: any[]) {
  if (!Array.isArray(events)) return true;
  let previous = 'GENESIS';
  for (const event of events) {
    if (event.previous !== previous || (await hashEvent(event)) !== event.hash) return false;
    previous = event.hash;
  }
  return true;
}

export function changeStatus(a: any, next: string) {
  return { ...a, status: transition(a.status, next) };
}

export const money = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    value || 0
  );

export const dateLabel = (value: string) => {
  if (!value) return '';
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return value;
  }
};
