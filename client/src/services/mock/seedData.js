import { computeAuditEventHash } from './cryptoChain';

export const CURRENT_USER = {
  id: 'usr-alex-rivera',
  name: 'Alex Rivera',
  email: 'alex.rivera@agree2met.demo',
  title: 'Chief Legal Officer & General Counsel',
  role: 'OWNER',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  twoFactorEnabled: true,
  theme: 'light',
  emailVerified: true,
  createdAt: '2025-01-15T09:00:00Z',
};

export const ORGANIZATIONS = [
  {
    id: 'org-acme',
    name: 'Acme Global Technologies',
    slug: 'acme-global',
    plan: 'Enterprise',
    membersCount: 12,
    currentUserRole: 'OWNER',
    logo: '🏢',
    settings: {
      defaultCurrency: 'USD',
      requireTwoFactor: true,
      autoReminders: true,
      retentionDays: 90,
    },
    members: [
      { id: 'usr-alex-rivera', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'OWNER', title: 'General Counsel' },
      { id: 'usr-sarah-c', name: 'Sarah Connor', email: 'sarah.c@acmeglobal.demo', role: 'ADMIN', title: 'VP of Operations' },
      { id: 'usr-david-m', name: 'David Miller', email: 'david.m@acmeglobal.demo', role: 'MEMBER', title: 'Head of Procurement' },
      { id: 'usr-elena-r', name: 'Elena Rostova', email: 'elena.r@acmeglobal.demo', role: 'MEMBER', title: 'Senior Commercial Counsel' },
      { id: 'usr-marcus-v', name: 'Marcus Vance', email: 'marcus.v@acmeglobal.demo', role: 'VIEWER', title: 'Financial Analyst' },
    ],
  },
  {
    id: 'org-rivera',
    name: 'Rivera Legal Advisory',
    slug: 'rivera-legal',
    plan: 'Pro',
    membersCount: 2,
    currentUserRole: 'OWNER',
    logo: '⚖️',
    settings: {
      defaultCurrency: 'USD',
      requireTwoFactor: false,
      autoReminders: true,
      retentionDays: 30,
    },
    members: [
      { id: 'usr-alex-rivera', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'OWNER', title: 'Managing Partner' },
      { id: 'usr-jessica-p', name: 'Jessica Pearson', email: 'jessica@riveralegal.demo', role: 'ADMIN', title: 'Partner' },
    ],
  },
];

export const CATEGORIES = [
  { id: 'cat-vendor', name: 'Vendor Agreements', color: '#4f46e5', icon: 'Building2' },
  { id: 'cat-emp', name: 'Employment & Freelance', color: '#0284c7', icon: 'UserCheck' },
  { id: 'cat-nda', name: 'Non-Disclosure (NDA)', color: '#059669', icon: 'Lock' },
  { id: 'cat-re', name: 'Real Estate Lease', color: '#d97706', icon: 'Home' },
  { id: 'cat-consult', name: 'Consulting & Advisory', color: '#7c3aed', icon: 'Briefcase' },
  { id: 'cat-license', name: 'Software Licensing', color: '#dc2626', icon: 'Code' },
  { id: 'cat-partner', name: 'Strategic Partnerships', color: '#2563eb', icon: 'Handshake' },
  { id: 'cat-sla', name: 'Service Level Agreements', color: '#0891b2', icon: 'Clock' },
  { id: 'cat-invest', name: 'Investment & Financing', color: '#16a34a', icon: 'TrendingUp' },
];

export const TEMPLATES = [
  {
    id: 'tmpl-nda',
    title: 'Standard Mutual Non-Disclosure Agreement',
    description: 'Bilateral confidentiality agreement protecting proprietary information and trade secrets.',
    categoryId: 'cat-nda',
    orgId: 'org-acme',
    clausesCount: 6,
    defaultClauses: [
      { id: 'c1', title: '1. Definition of Confidential Information', content: 'Confidential Information includes all non-public technical, commercial, financial, and product data disclosed by either party.' },
      { id: 'c2', title: '2. Standard of Care & Obligations', content: 'Recipient agrees to hold and maintain disclosing party\'s Confidential Information in strictest confidence exercising at least reasonable care.' },
      { id: 'c3', title: '3. Exclusions from Confidentiality', content: 'Obligations do not apply to information that is publicly known through no breach, or independently developed.' },
      { id: 'c4', title: '4. Non-Use Restrictions', content: 'Recipient shall not use Confidential Information for any purpose other than evaluating potential commercial collaboration.' },
      { id: 'c5', title: '5. Term and Survival', content: 'Confidentiality obligations survive for a period of three (3) years from the effective date of execution.' },
      { id: 'c6', title: '6. Governing Law & Jurisdiction', content: 'This Agreement shall be governed in accordance with the laws of the State of Delaware without regard to conflict principles.' },
    ],
  },
  {
    id: 'tmpl-msa',
    title: 'Master Services Agreement (MSA)',
    description: 'Comprehensive umbrella agreement establishing terms for professional development and enterprise deliverables.',
    categoryId: 'cat-vendor',
    orgId: 'org-acme',
    clausesCount: 5,
    defaultClauses: [
      { id: 'c1', title: '1. Scope of Services & Statements of Work', content: 'Provider will perform services described in mutually executed Statements of Work (SOWs) governed under this Master Agreement.' },
      { id: 'c2', title: '2. Fees, Invoicing & Payment Terms', content: 'Client will pay undisputed fees within thirty (30) calendar days of invoice date via electronic wire transfer.' },
      { id: 'c3', title: '3. Intellectual Property Rights & Work for Hire', content: 'Upon receipt of full payment, all custom deliverables created under SOWs shall vest exclusively with Client.' },
      { id: 'c4', title: '4. Warranties and Limitation of Liability', content: 'Neither party shall be liable for indirect, incidental, special, or consequential damages arising from service execution.' },
      { id: 'c5', title: '5. Term and Termination for Cause', content: 'Either party may terminate for material breach remaining uncured after thirty (30) days written notice.' },
    ],
  },
  {
    id: 'tmpl-exec-emp',
    title: 'Executive Employment Agreement',
    description: 'Officer-level employment contract with compensation, equity acceleration, and restrictive covenants.',
    categoryId: 'cat-emp',
    orgId: 'org-acme',
    clausesCount: 5,
    defaultClauses: [
      { id: 'c1', title: '1. Position and Executive Duties', content: 'Executive shall serve with fiduciary loyalty, reporting directly to the Board of Directors or Chief Executive Officer.' },
      { id: 'c2', title: '2. Base Salary, Bonus & Equity Grants', content: 'Executive receives annual base compensation with discretionary performance bonus and stock option grant subject to 4-year vesting.' },
      { id: 'c3', title: '3. Severance Benefits upon Change of Control', content: 'In the event of double-trigger termination following acquisition, Executive receives 12 months salary continuation.' },
      { id: 'c4', title: '4. Proprietary Information & Assignment', content: 'Executive agrees to assign all inventions developed during tenure to the Company.' },
      { id: 'c5', title: '5. Non-Solicitation Covenants', content: 'Executive agrees not to solicit employees or key clients for twelve (12) months following separation.' },
    ],
  },
  {
    id: 'tmpl-saas-lic',
    title: 'Software License & SaaS Subscription Agreement',
    description: 'Commercial cloud software terms of service, SLA guarantees, uptime commitments, and data protection.',
    categoryId: 'cat-license',
    orgId: 'org-acme',
    clausesCount: 4,
    defaultClauses: [
      { id: 'c1', title: '1. SaaS Access Grant & License', content: 'Provider grants Client a non-exclusive, non-transferable subscription license to access the hosted platform.' },
      { id: 'c2', title: '2. Service Level Agreement (99.9% Uptime)', content: 'Provider guarantees monthly uptime of 99.9% excluding scheduled maintenance windows.' },
      { id: 'c3', title: '3. Data Security & SOC2 Compliance', content: 'Provider maintains SOC 2 Type II compliance, encryption in transit (TLS 1.3) and at rest (AES-256).' },
      { id: 'c4', title: '4. Subscription Renewal and Cancellation', content: 'Annual subscriptions renew automatically unless notice of non-renewal is provided sixty (60) days prior.' },
    ],
  },
  {
    id: 'tmpl-sow',
    title: 'Consulting Services Statement of Work (SOW)',
    description: 'Project-specific scope, milestone delivery dates, acceptance criteria, and fee schedule.',
    categoryId: 'cat-consult',
    orgId: 'org-acme',
    clausesCount: 4,
    defaultClauses: [
      { id: 'c1', title: '1. Project Objectives & Deliverables', content: 'Detailed technical roadmap, milestone schedule, and sprint cadence agreed upon by both project leads.' },
      { id: 'c2', title: '2. Acceptance Testing Period', content: 'Client has ten (10) business days following milestone delivery to verify conformance with technical specs.' },
      { id: 'c3', title: '3. Milestone Fee Schedule', content: 'Payments tied directly to validated milestones as set forth in Exhibit A.' },
      { id: 'c4', title: '4. Change Control Procedure', content: 'Any material modification to project scope requires written Change Order signed by authorized representatives.' },
    ],
  },
  {
    id: 'tmpl-piia',
    title: 'Proprietary Information & Inventions Assignment (PIIA)',
    description: 'Contractor and employee invention assignment and trade secret protection agreement.',
    categoryId: 'cat-emp',
    orgId: 'org-acme',
    clausesCount: 3,
    defaultClauses: [
      { id: 'c1', title: '1. Assignment of Inventions', content: 'All intellectual property created during relationship is hereby assigned to Company as work made for hire.' },
      { id: 'c2', title: '2. Disclosure of Prior Inventions', content: 'Contractor lists all prior inventions excluded from this assignment in Exhibit 1.' },
      { id: 'c3', title: '3. Return of Materials upon Termination', content: 'All hardware, tokens, files, and proprietary records shall be returned immediately upon termination.' },
    ],
  },
];

// Helper to build a chain of audit events with valid SHA-256 hashes
function createAuditTrail(agreementId, events) {
  let prevHash = 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000';
  return events.map((ev, idx) => {
    const record = {
      id: `aud-${agreementId}-${idx + 1}`,
      agreementId,
      timestamp: ev.timestamp || new Date(Date.now() - (events.length - idx) * 3600000).toISOString(),
      actor: ev.actor || 'Alex Rivera (General Counsel)',
      action: ev.action,
      details: ev.details,
      previousHash: prevHash,
    };
    record.hash = computeAuditEventHash(record, prevHash);
    prevHash = record.hash;
    return record;
  });
}

// Generate ~40 realistic agreements
const rawAgreements = [
  // 1-4 Drafts
  {
    id: 'agr-01',
    orgId: 'org-acme',
    number: 'AGR-2026-001',
    title: 'Series B Preferred Stock Purchase Agreement',
    categoryId: 'cat-invest',
    status: 'draft',
    value: 15000000,
    effectiveDate: '2026-04-01',
    expirationDate: '2026-12-31',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Counsel', signingOrder: 1, status: 'pending' },
      { id: 'p2', name: 'Marcus Sterling', email: 'm.sterling@sequoia-demo.vc', role: 'Lead Investor', signingOrder: 2, status: 'pending' },
    ],
    summary: 'Financing documents for $15M Series B round led by Sequoia Demo Ventures.',
  },
  {
    id: 'agr-02',
    orgId: 'org-acme',
    number: 'AGR-2026-002',
    title: 'Commercial Office Lease — 500 Howard St Floor 4',
    categoryId: 'cat-re',
    status: 'draft',
    value: 720000,
    effectiveDate: '2026-06-01',
    expirationDate: '2029-05-31',
    parties: [
      { id: 'p1', name: 'Sarah Connor', email: 'sarah.c@acmeglobal.demo', role: 'Tenant', signingOrder: 1, status: 'pending' },
      { id: 'p2', name: 'Beacon Properties LLC', email: 'leasing@beaconprop.demo', role: 'Landlord', signingOrder: 2, status: 'pending' },
    ],
    summary: '3-year lease for San Francisco headquarters expansion comprising 12,500 sq ft.',
  },
  {
    id: 'agr-03',
    orgId: 'org-rivera',
    number: 'AGR-2026-003',
    title: 'General Legal Retainer Agreement — Starlight AI',
    categoryId: 'cat-consult',
    status: 'draft',
    value: 96000,
    effectiveDate: '2026-03-01',
    expirationDate: '2027-02-28',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Counsel', signingOrder: 1, status: 'pending' },
      { id: 'p2', name: 'Elena Chen', email: 'elena@starlight-ai.demo', role: 'Client CEO', signingOrder: 2, status: 'pending' },
    ],
    summary: 'Monthly advisory retainer for intellectual property and governance counsel.',
  },
  {
    id: 'agr-04',
    orgId: 'org-acme',
    number: 'AGR-2026-004',
    title: 'Enterprise Software Reseller Agreement — APAC',
    categoryId: 'cat-partner',
    status: 'draft',
    value: 450000,
    effectiveDate: '2026-05-01',
    expirationDate: '2027-04-30',
    parties: [
      { id: 'p1', name: 'David Miller', email: 'david.m@acmeglobal.demo', role: 'Vendor', signingOrder: 1, status: 'pending' },
      { id: 'p2', name: 'Kenji Sato', email: 'k.sato@mitsui-partner.demo', role: 'Reseller', signingOrder: 2, status: 'pending' },
    ],
    summary: 'Distribution rights and tier-1 reseller commission terms for Japan & Singapore.',
  },

  // 5-8 In Review
  {
    id: 'agr-05',
    orgId: 'org-acme',
    number: 'AGR-2026-005',
    title: 'Executive Employment Agreement — VP Marketing',
    categoryId: 'cat-emp',
    status: 'in_review',
    value: 285000,
    effectiveDate: '2026-03-15',
    expirationDate: null,
    parties: [
      { id: 'p1', name: 'Sarah Connor', email: 'sarah.c@acmeglobal.demo', role: 'Employer', signingOrder: 1, status: 'pending' },
      { id: 'p2', name: 'Rachel Zane', email: 'rachel.zane@exec-talent.demo', role: 'Executive', signingOrder: 2, status: 'pending' },
    ],
    summary: 'Officer appointment with compensation package, bonus targets, and severance covenants.',
  },
  {
    id: 'agr-06',
    orgId: 'org-acme',
    number: 'AGR-2026-006',
    title: 'Master Cloud Infrastructure SOW — AWS EMEA',
    categoryId: 'cat-vendor',
    status: 'in_review',
    value: 640000,
    effectiveDate: '2026-04-01',
    expirationDate: '2027-03-31',
    parties: [
      { id: 'p1', name: 'David Miller', email: 'david.m@acmeglobal.demo', role: 'Client', signingOrder: 1, status: 'pending' },
      { id: 'p2', name: 'Enterprise Cloud AWS', email: 'contracts@aws-partner.demo', role: 'Provider', signingOrder: 2, status: 'pending' },
    ],
    summary: 'Cloud compute reservation, reserved instances, and premium enterprise support tier.',
  },
  {
    id: 'agr-07',
    orgId: 'org-rivera',
    number: 'AGR-2026-007',
    title: 'Cross-Border Licensing Terms — Lexis Corp',
    categoryId: 'cat-license',
    status: 'in_review',
    value: 120000,
    effectiveDate: '2026-03-01',
    expirationDate: '2028-02-29',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Licensor', signingOrder: 1, status: 'pending' },
      { id: 'p2', name: 'Dieter Braun', email: 'dbraun@lexis-dach.demo', role: 'Licensee', signingOrder: 2, status: 'pending' },
    ],
    summary: 'Legal taxonomy database licensing for German, Swiss, and Austrian courts.',
  },
  {
    id: 'agr-08',
    orgId: 'org-acme',
    number: 'AGR-2026-008',
    title: 'Vendor Security & Data Processing Addendum (GDPR)',
    categoryId: 'cat-vendor',
    status: 'in_review',
    value: 35000,
    effectiveDate: '2026-03-10',
    expirationDate: '2027-03-09',
    parties: [
      { id: 'p1', name: 'Elena Rostova', email: 'elena.r@acmeglobal.demo', role: 'Controller', signingOrder: 1, status: 'pending' },
      { id: 'p2', name: 'Datadog EMEA Legal', email: 'dpa@datadog-demo.com', role: 'Processor', signingOrder: 2, status: 'pending' },
    ],
    summary: 'Standard contractual clauses (SCCs) for international customer data transfers.',
  },

  // 9-12 Approved
  {
    id: 'agr-09',
    orgId: 'org-acme',
    number: 'AGR-2026-009',
    title: 'Mutual Non-Disclosure Agreement — Cyberdyne AI',
    categoryId: 'cat-nda',
    status: 'approved',
    value: null,
    effectiveDate: '2026-02-15',
    expirationDate: '2028-02-14',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Party A', signingOrder: 1, status: 'pending' },
      { id: 'p2', name: 'Dr. Miles Dyson', email: 'mdyson@cyberdyne.demo', role: 'Party B', signingOrder: 2, status: 'pending' },
    ],
    summary: 'Confidentiality protections preceding algorithmic co-development discussions.',
  },
  {
    id: 'agr-10',
    orgId: 'org-acme',
    number: 'AGR-2026-010',
    title: 'Enterprise SLA Addendum — Tier 1 99.99%',
    categoryId: 'cat-sla',
    status: 'approved',
    value: 180000,
    effectiveDate: '2026-03-01',
    expirationDate: '2027-02-28',
    parties: [
      { id: 'p1', name: 'David Miller', email: 'david.m@acmeglobal.demo', role: 'Provider', signingOrder: 1, status: 'pending' },
      { id: 'p2', name: 'Citigroup Global Markets', email: 'procurement@citi-demo.com', role: 'Enterprise Client', signingOrder: 2, status: 'pending' },
    ],
    summary: 'High-availability service credits and dedicated tier-1 incident response times.',
  },
  {
    id: 'agr-11',
    orgId: 'org-acme',
    number: 'AGR-2026-011',
    title: 'Software Development SOW — Mobile App v3.0',
    categoryId: 'cat-consult',
    status: 'approved',
    value: 145000,
    effectiveDate: '2026-03-01',
    expirationDate: '2026-09-30',
    parties: [
      { id: 'p1', name: 'Sarah Connor', email: 'sarah.c@acmeglobal.demo', role: 'Client', signingOrder: 1, status: 'pending' },
      { id: 'p2', name: 'Apex Labs Inc', email: 'contracts@apexlabs.demo', role: 'Developer', signingOrder: 2, status: 'pending' },
    ],
    summary: 'iOS and Android client overhaul with offline signing and biometric passkeys.',
  },
  {
    id: 'agr-12',
    orgId: 'org-rivera',
    number: 'AGR-2026-012',
    title: 'Expert Witness Retainer — Patent Infringement',
    categoryId: 'cat-consult',
    status: 'approved',
    value: 80000,
    effectiveDate: '2026-02-20',
    expirationDate: '2026-11-30',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Counsel', signingOrder: 1, status: 'pending' },
      { id: 'p2', name: 'Dr. Gregory House', email: 'ghouse@stanford-faculty.demo', role: 'Expert', signingOrder: 2, status: 'pending' },
    ],
    summary: 'Technical testimony and deposition prep for US District Court Delaware case.',
  },

  // 13-17 Awaiting Signatures
  {
    id: 'agr-13',
    orgId: 'org-acme',
    number: 'AGR-2026-013',
    title: 'Master Services Agreement — Starlight Fintech',
    categoryId: 'cat-vendor',
    status: 'awaiting_signatures',
    value: 320000,
    effectiveDate: '2026-03-01',
    expirationDate: '2027-02-28',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Signer', signingOrder: 1, status: 'pending', token: 'tok_msa_starlight_p1' },
      { id: 'p2', name: 'Julian Bell', email: 'julian@starlight-fintech.demo', role: 'Client Signer', signingOrder: 2, status: 'pending', token: 'tok_msa_starlight_p2' },
    ],
    summary: 'Multi-year enterprise core banking modernization and contract compliance suite.',
  },
  {
    id: 'agr-14',
    orgId: 'org-acme',
    number: 'AGR-2026-014',
    title: 'Senior DevOps Architect Offer Letter & PIIA',
    categoryId: 'cat-emp',
    status: 'awaiting_signatures',
    value: 195000,
    effectiveDate: '2026-03-15',
    expirationDate: '2026-03-10', // deadline soon
    parties: [
      { id: 'p1', name: 'Sarah Connor', email: 'sarah.c@acmeglobal.demo', role: 'Hiring Manager', signingOrder: 1, status: 'pending', token: 'tok_offer_devops_p1' },
      { id: 'p2', name: 'Tomas Lindqvist', email: 'tomas.l@cloudops-nordic.demo', role: 'Candidate', signingOrder: 2, status: 'pending', token: 'tok_offer_devops_p2' },
    ],
    summary: 'Full-time employment offer including equity incentive grant and PIIA assignment.',
  },
  {
    id: 'agr-15',
    orgId: 'org-rivera',
    number: 'AGR-2026-015',
    title: 'Mutual NDA — Apex Biomedical Innovations',
    categoryId: 'cat-nda',
    status: 'awaiting_signatures',
    value: null,
    effectiveDate: '2026-02-28',
    expirationDate: '2028-02-27',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Party A', signingOrder: 1, status: 'pending', token: 'tok_nda_apex_p1' },
      { id: 'p2', name: 'Claire Bennet', email: 'cbennet@apex-bio.demo', role: 'Party B', signingOrder: 2, status: 'pending', token: 'tok_nda_apex_p2' },
    ],
    summary: 'Clinical trial licensing and intellectual property due diligence.',
  },
  {
    id: 'agr-16',
    orgId: 'org-acme',
    number: 'AGR-2026-016',
    title: 'Office Equipment Fleet Lease — Xerox Corp',
    categoryId: 'cat-re',
    status: 'awaiting_signatures',
    value: 48000,
    effectiveDate: '2026-04-01',
    expirationDate: '2029-03-31',
    parties: [
      { id: 'p1', name: 'David Miller', email: 'david.m@acmeglobal.demo', role: 'Lessee', signingOrder: 1, status: 'pending', token: 'tok_xerox_p1' },
      { id: 'p2', name: 'Xerox Enterprise Financial', email: 'commercial@xerox-demo.com', role: 'Lessor', signingOrder: 2, status: 'pending', token: 'tok_xerox_p2' },
    ],
    summary: 'Managed print service and secure document destruction hardware.',
  },
  {
    id: 'agr-17',
    orgId: 'org-acme',
    number: 'AGR-2026-017',
    title: 'Customer Data Analytics SOW — Global Logistics',
    categoryId: 'cat-consult',
    status: 'awaiting_signatures',
    value: 110000,
    effectiveDate: '2026-03-05',
    expirationDate: '2026-08-31',
    parties: [
      { id: 'p1', name: 'Elena Rostova', email: 'elena.r@acmeglobal.demo', role: 'Lead Counsel', signingOrder: 1, status: 'pending', token: 'tok_logistics_p1' },
      { id: 'p2', name: 'Arthur Pendelton', email: 'apendelton@maersk-demo.com', role: 'Client Executive', signingOrder: 2, status: 'pending', token: 'tok_logistics_p2' },
    ],
    summary: 'Container tracking predictive analytics pipeline implementation.',
  },

  // 18-21 Partially Signed
  {
    id: 'agr-18',
    orgId: 'org-acme',
    number: 'AGR-2026-018',
    title: 'Software Licensing Agreement — Oracle EMEA',
    categoryId: 'cat-license',
    status: 'partially_signed',
    value: 260000,
    effectiveDate: '2026-03-01',
    expirationDate: '2027-02-28',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Signer', signingOrder: 1, status: 'signed', signedAt: '2026-02-25T14:22:00Z', ipAddress: '198.51.100.44', token: 'tok_ora_p1' },
      { id: 'p2', name: 'Gavin Belson', email: 'gbelson@hooli-oracle.demo', role: 'Client Signer', signingOrder: 2, status: 'pending', token: 'tok_ora_p2' },
    ],
    summary: 'Database cluster core license renewals and enterprise support agreement.',
  },
  {
    id: 'agr-19',
    orgId: 'org-rivera',
    number: 'AGR-2026-019',
    title: 'M&A Legal Due Diligence Engagement — TechCorp',
    categoryId: 'cat-consult',
    status: 'partially_signed',
    value: 175000,
    effectiveDate: '2026-02-20',
    expirationDate: '2026-06-30',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Counsel', signingOrder: 1, status: 'signed', signedAt: '2026-02-22T10:15:00Z', ipAddress: '198.51.100.44', token: 'tok_mna_p1' },
      { id: 'p2', name: 'Victor Vance', email: 'vvance@techcorp-demo.com', role: 'Acquiring CEO', signingOrder: 2, status: 'pending', token: 'tok_mna_p2' },
    ],
    summary: 'Target company IP clearance, employment compliance, and litigation audit.',
  },
  {
    id: 'agr-20',
    orgId: 'org-acme',
    number: 'AGR-2026-020',
    title: 'Strategic Channel Distribution — EMEA Nordics',
    categoryId: 'cat-partner',
    status: 'partially_signed',
    value: 520000,
    effectiveDate: '2026-03-01',
    expirationDate: '2028-02-29',
    parties: [
      { id: 'p1', name: 'David Miller', email: 'david.m@acmeglobal.demo', role: 'Signer', signingOrder: 1, status: 'signed', signedAt: '2026-02-24T18:00:00Z', ipAddress: '198.51.100.44', token: 'tok_dist_p1' },
      { id: 'p2', name: 'Astrid Lind', email: 'astrid@nordictech-partner.demo', role: 'Distributor', signingOrder: 2, status: 'pending', token: 'tok_dist_p2' },
    ],
    summary: 'Co-marketing and localized SaaS distribution agreement in Scandinavian countries.',
  },
  {
    id: 'agr-21',
    orgId: 'org-acme',
    number: 'AGR-2026-021',
    title: 'Annual Security Penetration Testing SOW',
    categoryId: 'cat-vendor',
    status: 'partially_signed',
    value: 65000,
    effectiveDate: '2026-03-10',
    expirationDate: '2026-05-31',
    parties: [
      { id: 'p1', name: 'Sarah Connor', email: 'sarah.c@acmeglobal.demo', role: 'Client', signingOrder: 1, status: 'signed', signedAt: '2026-02-26T09:30:00Z', ipAddress: '198.51.100.44', token: 'tok_pentest_p1' },
      { id: 'p2', name: 'ZeroDay Defense LLC', email: 'ops@zeroday-defense.demo', role: 'Security Vendor', signingOrder: 2, status: 'pending', token: 'tok_pentest_p2' },
    ],
    summary: 'Black-box, white-box and cloud architecture threat modeling and pen test.',
  },

  // 22-26 Signed
  {
    id: 'agr-22',
    orgId: 'org-acme',
    number: 'AGR-2026-022',
    title: 'Customer Subscription Agreement — Stripe Inc',
    categoryId: 'cat-license',
    status: 'signed',
    value: 240000,
    effectiveDate: '2026-02-01',
    expirationDate: '2027-01-31',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Signer', signingOrder: 1, status: 'signed', signedAt: '2026-01-30T16:00:00Z', ipAddress: '198.51.100.44' },
      { id: 'p2', name: 'Patrick Collison', email: 'patrick@stripe-demo.com', role: 'Customer', signingOrder: 2, status: 'signed', signedAt: '2026-01-31T11:20:00Z', ipAddress: '54.215.12.98' },
    ],
    summary: 'Agree2Met enterprise contract automation platform deployment across legal teams.',
  },
  {
    id: 'agr-23',
    orgId: 'org-acme',
    number: 'AGR-2026-023',
    title: 'Consulting Addendum — Data Pipeline Migration',
    categoryId: 'cat-consult',
    status: 'signed',
    value: 95000,
    effectiveDate: '2026-02-10',
    expirationDate: '2026-07-31',
    parties: [
      { id: 'p1', name: 'Sarah Connor', email: 'sarah.c@acmeglobal.demo', role: 'Client', signingOrder: 1, status: 'signed', signedAt: '2026-02-08T15:10:00Z', ipAddress: '198.51.100.44' },
      { id: 'p2', name: 'Snowflake Professional', email: 'services@snowflake-demo.com', role: 'Provider', signingOrder: 2, status: 'signed', signedAt: '2026-02-09T18:40:00Z', ipAddress: '34.201.88.14' },
    ],
    summary: 'Snowflake warehouse optimization and streaming telemetry ingest pipeline.',
  },
  {
    id: 'agr-24',
    orgId: 'org-rivera',
    number: 'AGR-2026-024',
    title: 'Corporate Formation & Equity Structure — BioVault',
    categoryId: 'cat-consult',
    status: 'signed',
    value: 45000,
    effectiveDate: '2026-01-15',
    expirationDate: '2026-06-30',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Counsel', signingOrder: 1, status: 'signed', signedAt: '2026-01-14T10:00:00Z', ipAddress: '198.51.100.44' },
      { id: 'p2', name: 'Dr. Evelyn Reed', email: 'ereed@biovault-health.demo', role: 'Founder', signingOrder: 2, status: 'signed', signedAt: '2026-01-14T14:30:00Z', ipAddress: '12.180.45.2' },
    ],
    summary: 'Delaware C-Corp incorporation, founder restriction agreements, and option pool.',
  },
  {
    id: 'agr-25',
    orgId: 'org-acme',
    number: 'AGR-2026-025',
    title: 'Marketing Agency Retainer — Ogilvy Growth',
    categoryId: 'cat-vendor',
    status: 'signed',
    value: 180000,
    effectiveDate: '2026-02-01',
    expirationDate: '2026-12-31',
    parties: [
      { id: 'p1', name: 'David Miller', email: 'david.m@acmeglobal.demo', role: 'Client', signingOrder: 1, status: 'signed', signedAt: '2026-01-28T11:00:00Z', ipAddress: '198.51.100.44' },
      { id: 'p2', name: 'Samantha Sterling', email: 'ssterling@ogilvy-growth.demo', role: 'Agency Partner', signingOrder: 2, status: 'signed', signedAt: '2026-01-29T09:15:00Z', ipAddress: '151.101.65.140' },
    ],
    summary: 'Brand repositioning, developer advocacy, and enterprise demand generation.',
  },
  {
    id: 'agr-26',
    orgId: 'org-acme',
    number: 'AGR-2026-026',
    title: 'Co-Marketing & Joint Webinar Sponsorship',
    categoryId: 'cat-partner',
    status: 'signed',
    value: 25000,
    effectiveDate: '2026-02-15',
    expirationDate: '2026-05-15',
    parties: [
      { id: 'p1', name: 'Elena Rostova', email: 'elena.r@acmeglobal.demo', role: 'Sponsor', signingOrder: 1, status: 'signed', signedAt: '2026-02-12T13:45:00Z', ipAddress: '198.51.100.44' },
      { id: 'p2', name: 'TechCrunch Events', email: 'sponsorships@techcrunch-demo.com', role: 'Organizer', signingOrder: 2, status: 'signed', signedAt: '2026-02-13T10:05:00Z', ipAddress: '192.0.78.24' },
    ],
    summary: 'Lead sponsorship of Enterprise Legal Tech Stage at Disrupt 2026.',
  },

  // 27-32 Active
  {
    id: 'agr-27',
    orgId: 'org-acme',
    number: 'AGR-2026-027',
    title: 'Master Cloud Services Agreement — Google Cloud',
    categoryId: 'cat-vendor',
    status: 'active',
    value: 1200000,
    effectiveDate: '2025-06-01',
    expirationDate: '2027-05-31',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Client', signingOrder: 1, status: 'signed', signedAt: '2025-05-28T16:00:00Z', ipAddress: '198.51.100.44' },
      { id: 'p2', name: 'Sundar Pichai', email: 'cloud-deals@google-demo.com', role: 'Provider', signingOrder: 2, status: 'signed', signedAt: '2025-05-29T14:15:00Z', ipAddress: '172.217.16.206' },
    ],
    summary: 'Global multi-region Google Cloud Platform compute, BigQuery data warehouse, and Gemini API commitment.',
  },
  {
    id: 'agr-28',
    orgId: 'org-acme',
    number: 'AGR-2026-028',
    title: 'Enterprise Software Subscription — Salesforce',
    categoryId: 'cat-license',
    status: 'active',
    value: 360000,
    effectiveDate: '2025-09-01',
    expirationDate: '2026-08-31',
    parties: [
      { id: 'p1', name: 'Sarah Connor', email: 'sarah.c@acmeglobal.demo', role: 'Client', signingOrder: 1, status: 'signed', signedAt: '2025-08-25T11:00:00Z', ipAddress: '198.51.100.44' },
      { id: 'p2', name: 'Marc Benioff', email: 'sales-enterprise@salesforce-demo.com', role: 'Provider', signingOrder: 2, status: 'signed', signedAt: '2025-08-26T17:30:00Z', ipAddress: '136.147.20.12' },
    ],
    summary: 'Enterprise CRM licenses, Service Cloud tier, and Slack Enterprise Grid.',
  },
  {
    id: 'agr-29',
    orgId: 'org-acme',
    number: 'AGR-2026-029',
    title: 'Cybersecurity Insurance Policy — Lloyd\'s of London',
    categoryId: 'cat-vendor',
    status: 'active',
    value: 125000,
    effectiveDate: '2025-11-01',
    expirationDate: '2026-10-31',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Insured', signingOrder: 1, status: 'signed', signedAt: '2025-10-28T09:00:00Z', ipAddress: '198.51.100.44' },
      { id: 'p2', name: 'Underwriting Syndicate 42', email: 'cyber@lloyds-syndicate.demo', role: 'Insurer', signingOrder: 2, status: 'signed', signedAt: '2025-10-29T16:45:00Z', ipAddress: '80.75.12.1' },
    ],
    summary: '$20M coverage limit for ransomware, data breach, and business interruption liabilities.',
  },
  {
    id: 'agr-30',
    orgId: 'org-rivera',
    number: 'AGR-2026-030',
    title: 'Outside General Counsel Retainer — CyberVault',
    categoryId: 'cat-consult',
    status: 'active',
    value: 144000,
    effectiveDate: '2025-10-01',
    expirationDate: '2026-09-30',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Counsel', signingOrder: 1, status: 'signed', signedAt: '2025-09-28T12:00:00Z', ipAddress: '198.51.100.44' },
      { id: 'p2', name: 'Jonathan Archer', email: 'jarcher@cybervault-sec.demo', role: 'CEO', signingOrder: 2, status: 'signed', signedAt: '2025-09-29T10:15:00Z', ipAddress: '198.51.100.80' },
    ],
    summary: 'Standing corporate governance, board minutes, and commercial agreement review.',
  },
  {
    id: 'agr-31',
    orgId: 'org-acme',
    number: 'AGR-2026-031',
    title: 'Global Telephony & SIP Trunking — Twilio Inc',
    categoryId: 'cat-vendor',
    status: 'active',
    value: 85000,
    effectiveDate: '2025-08-01',
    expirationDate: '2026-07-31',
    parties: [
      { id: 'p1', name: 'David Miller', email: 'david.m@acmeglobal.demo', role: 'Client', signingOrder: 1, status: 'signed', signedAt: '2025-07-25T14:30:00Z', ipAddress: '198.51.100.44' },
      { id: 'p2', name: 'Twilio Enterprise Sales', email: 'contracts@twilio-demo.com', role: 'Provider', signingOrder: 2, status: 'signed', signedAt: '2025-07-26T11:00:00Z', ipAddress: '52.94.76.1' },
    ],
    summary: 'Worldwide SMS OTP delivery and voice calling infrastructure for platform notifications.',
  },
  {
    id: 'agr-32',
    orgId: 'org-acme',
    number: 'AGR-2026-032',
    title: 'Co-Location & Direct Fiber Link — Equinix SV5',
    categoryId: 'cat-re',
    status: 'active',
    value: 210000,
    effectiveDate: '2025-07-01',
    expirationDate: '2027-06-30',
    parties: [
      { id: 'p1', name: 'Sarah Connor', email: 'sarah.c@acmeglobal.demo', role: 'Tenant', signingOrder: 1, status: 'signed', signedAt: '2025-06-25T10:00:00Z', ipAddress: '198.51.100.44' },
      { id: 'p2', name: 'Equinix Data Centers', email: 'sv5-leasing@equinix-demo.com', role: 'Operator', signingOrder: 2, status: 'signed', signedAt: '2025-06-26T16:20:00Z', ipAddress: '199.19.104.1' },
    ],
    summary: 'Dedicated 4-rack cage and redundant 10Gbps Cross Connect links in San Jose.',
  },

  // 33-35 Completed
  {
    id: 'agr-33',
    orgId: 'org-acme',
    number: 'AGR-2026-033',
    title: 'Brand Refresh & Design System v1 — Pentagram',
    categoryId: 'cat-consult',
    status: 'completed',
    value: 120000,
    effectiveDate: '2025-01-15',
    expirationDate: '2025-08-31',
    parties: [
      { id: 'p1', name: 'Sarah Connor', email: 'sarah.c@acmeglobal.demo', role: 'Client', signingOrder: 1, status: 'signed' },
      { id: 'p2', name: 'Paula Scher', email: 'pscher@pentagram-demo.com', role: 'Partner', signingOrder: 2, status: 'signed' },
    ],
    summary: 'Full corporate brand design, typography guidelines, and web design tokens.',
  },
  {
    id: 'agr-34',
    orgId: 'org-rivera',
    number: 'AGR-2026-034',
    title: 'Series A Venture Financing Advisory — NeuroSync',
    categoryId: 'cat-invest',
    status: 'completed',
    value: 85000,
    effectiveDate: '2025-03-01',
    expirationDate: '2025-10-31',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Counsel', signingOrder: 1, status: 'signed' },
      { id: 'p2', name: 'Dr. Michael Chang', email: 'mchang@neurosync-tech.demo', role: 'Founder', signingOrder: 2, status: 'signed' },
    ],
    summary: 'Closed $8M Series A round with Khosla Ventures; all closing conditions fulfilled.',
  },
  {
    id: 'agr-35',
    orgId: 'org-acme',
    number: 'AGR-2026-035',
    title: 'Hardware Procurement SOW — Apple Enterprise',
    categoryId: 'cat-vendor',
    status: 'completed',
    value: 140000,
    effectiveDate: '2025-04-01',
    expirationDate: '2025-07-31',
    parties: [
      { id: 'p1', name: 'David Miller', email: 'david.m@acmeglobal.demo', role: 'Purchaser', signingOrder: 1, status: 'signed' },
      { id: 'p2', name: 'Apple Business Team', email: 'enterprise@apple-demo.com', role: 'Vendor', signingOrder: 2, status: 'signed' },
    ],
    summary: 'MacBook Pro M3 Max fleet deployment for engineering and security personnel.',
  },

  // 36-37 Expired
  {
    id: 'agr-36',
    orgId: 'org-acme',
    number: 'AGR-2026-036',
    title: 'Office Sublease Letter of Intent — 201 Mission St',
    categoryId: 'cat-re',
    status: 'expired',
    value: 280000,
    effectiveDate: '2025-06-01',
    expirationDate: '2025-12-31',
    parties: [
      { id: 'p1', name: 'Sarah Connor', email: 'sarah.c@acmeglobal.demo', role: 'Subtenant', signingOrder: 1, status: 'signed' },
      { id: 'p2', name: 'WeWork Real Estate', email: 'enterprise@wework-demo.com', role: 'Sublessor', signingOrder: 2, status: 'pending' },
    ],
    summary: 'Letter of intent expired without execution of definitive sublease.',
  },
  {
    id: 'agr-37',
    orgId: 'org-rivera',
    number: 'AGR-2026-037',
    title: 'Special Counsel Advisory Retainer — Helix Health',
    categoryId: 'cat-consult',
    status: 'expired',
    value: 60000,
    effectiveDate: '2025-01-01',
    expirationDate: '2025-12-31',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Counsel', signingOrder: 1, status: 'signed' },
      { id: 'p2', name: 'Dr. Aaron Ross', email: 'aross@helix-health.demo', role: 'Client', signingOrder: 2, status: 'signed' },
    ],
    summary: '12-month regulatory consulting agreement expired upon term completion.',
  },

  // 38-39 Terminated
  {
    id: 'agr-38',
    orgId: 'org-acme',
    number: 'AGR-2026-038',
    title: 'Search Optimization Vendor Contract — SEO Blitz',
    categoryId: 'cat-vendor',
    status: 'terminated',
    value: 72000,
    effectiveDate: '2025-05-01',
    expirationDate: '2026-04-30',
    parties: [
      { id: 'p1', name: 'David Miller', email: 'david.m@acmeglobal.demo', role: 'Client', signingOrder: 1, status: 'signed' },
      { id: 'p2', name: 'SEO Blitz LLC', email: 'contracts@seoblitz-demo.com', role: 'Agency', signingOrder: 2, status: 'signed' },
    ],
    summary: 'Terminated for convenience with 30-day notice following underperformance.',
  },
  {
    id: 'agr-39',
    orgId: 'org-acme',
    number: 'AGR-2026-039',
    title: 'Customer Data Ingestion Pilot — Delta Retail',
    categoryId: 'cat-license',
    status: 'terminated',
    value: 50000,
    effectiveDate: '2025-03-01',
    expirationDate: '2025-09-01',
    parties: [
      { id: 'p1', name: 'Elena Rostova', email: 'elena.r@acmeglobal.demo', role: 'Provider', signingOrder: 1, status: 'signed' },
      { id: 'p2', name: 'Delta Retail Ops', email: 'pilot@deltaretail-demo.com', role: 'Customer', signingOrder: 2, status: 'signed' },
    ],
    summary: 'Mutual termination prior to production deployment due to retail budget freeze.',
  },

  // 40 Disputed
  {
    id: 'agr-40',
    orgId: 'org-acme',
    number: 'AGR-2026-040',
    title: 'Custom ERP Integration Services — Apex Solutions',
    categoryId: 'cat-consult',
    status: 'disputed',
    value: 230000,
    effectiveDate: '2025-08-01',
    expirationDate: '2026-06-30',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Client', signingOrder: 1, status: 'signed' },
      { id: 'p2', name: 'Apex Solutions Corp', email: 'legal@apex-erp.demo', role: 'Contractor', signingOrder: 2, status: 'signed' },
    ],
    summary: 'Disputed milestone #3 deliverables due to SAP API synchronization latency.',
  },

  // 41-42 Cancelled
  {
    id: 'agr-41',
    orgId: 'org-acme',
    number: 'AGR-2026-041',
    title: 'Proposed Joint Venture Agreement — Horizon AI',
    categoryId: 'cat-partner',
    status: 'cancelled',
    value: 800000,
    effectiveDate: '2026-01-01',
    expirationDate: '2028-12-31',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Partner A', signingOrder: 1, status: 'pending' },
      { id: 'p2', name: 'Horizon AI Ventures', email: 'deals@horizon-ai.demo', role: 'Partner B', signingOrder: 2, status: 'pending' },
    ],
    summary: 'Cancelled during final term negotiations prior to signatures.',
  },
  {
    id: 'agr-42',
    orgId: 'org-rivera',
    number: 'AGR-2026-042',
    title: 'Advisory Retainer — Zenith Capital Partners',
    categoryId: 'cat-consult',
    status: 'cancelled',
    value: 75000,
    effectiveDate: '2026-02-01',
    expirationDate: '2027-01-31',
    parties: [
      { id: 'p1', name: 'Alex Rivera', email: 'alex.rivera@agree2met.demo', role: 'Counsel', signingOrder: 1, status: 'pending' },
      { id: 'p2', name: 'Zenith Capital Lead', email: 'partners@zenith-cap.demo', role: 'Client', signingOrder: 2, status: 'pending' },
    ],
    summary: 'Cancelled due to conflict of interest with competing institutional fund.',
  },
];

export const INITIAL_AGREEMENTS = rawAgreements.map((item, idx) => {
  const isSignedState = ['signed', 'active', 'completed'].includes(item.status);
  const auditEvents = [
    {
      action: 'AGREEMENT_CREATED',
      details: `Initialized agreement ${item.number}: "${item.title}"`,
      timestamp: new Date(Date.now() - (idx + 10) * 86400000).toISOString(),
    },
    {
      action: 'METADATA_UPDATED',
      details: `Configured terms, category and initial counterparties.`,
      timestamp: new Date(Date.now() - (idx + 8) * 86400000).toISOString(),
    },
  ];

  if (item.status !== 'draft') {
    auditEvents.push({
      action: 'SUBMITTED_FOR_REVIEW',
      details: 'Internal review workflow initiated.',
      timestamp: new Date(Date.now() - (idx + 6) * 86400000).toISOString(),
    });
  }

  if (['approved', 'awaiting_signatures', 'partially_signed', 'signed', 'active', 'completed'].includes(item.status)) {
    auditEvents.push({
      action: 'AGREEMENT_APPROVED',
      details: 'Approved by General Counsel Alex Rivera.',
      timestamp: new Date(Date.now() - (idx + 5) * 86400000).toISOString(),
    });
  }

  if (['awaiting_signatures', 'partially_signed', 'signed', 'active', 'completed'].includes(item.status)) {
    auditEvents.push({
      action: 'SIGNING_INVITATIONS_SENT',
      details: `Invitations sent to ${item.parties.length} recipient counterparties.`,
      timestamp: new Date(Date.now() - (idx + 4) * 86400000).toISOString(),
    });
  }

  if (isSignedState || item.status === 'partially_signed') {
    auditEvents.push({
      action: 'PARTY_SIGNED',
      details: `Electronic signature captured from Alex Rivera (General Counsel). IP: 198.51.100.44`,
      timestamp: new Date(Date.now() - (idx + 3) * 86400000).toISOString(),
    });
  }

  if (isSignedState) {
    auditEvents.push({
      action: 'PARTY_SIGNED',
      details: `Electronic signature captured from counterparty. Verification certificate generated.`,
      timestamp: new Date(Date.now() - (idx + 2) * 86400000).toISOString(),
    });
    auditEvents.push({
      action: 'EXECUTION_FINALIZED',
      details: 'All required parties signed. Agreement fully executed.',
      timestamp: new Date(Date.now() - (idx + 1) * 86400000).toISOString(),
    });
  }

  const auditTrail = createAuditTrail(item.id, auditEvents);

  return {
    ...item,
    currency: 'USD',
    createdAt: auditEvents[0].timestamp,
    updatedAt: auditEvents[auditEvents.length - 1].timestamp,
    clauses: [
      { id: 'c1', title: '1. Engagement and Scope', content: item.summary, order: 0 },
      { id: 'c2', title: '2. Payment Terms and Schedule', content: item.value ? `Total commercial consideration of $${item.value.toLocaleString()} USD payable according to agreed milestone schedules.` : 'No direct monetary consideration required.', order: 1 },
      { id: 'c3', title: '3. Confidentiality and Data Security', content: 'Each party agrees to hold all disclosed trade secrets in strict confidence and comply with applicable privacy standards.', order: 2 },
      { id: 'c4', title: '4. Term and Termination', content: 'This agreement remains in full force and effect through the specified expiration date unless terminated earlier.', order: 3 },
      { id: 'c5', title: '5. Electronic Signatures and Counterparts', content: 'The parties agree that this agreement may be electronically signed and executed in counterparts, each of which shall be deemed an original.', order: 4 },
    ],
    paymentMilestones: item.value ? [
      { id: 'm1', title: 'Initial Deposit (30%)', amount: Math.round(item.value * 0.3), dueDate: item.effectiveDate, status: isSignedState ? 'completed' : 'pending' },
      { id: 'm2', title: 'Milestone Delivery (40%)', amount: Math.round(item.value * 0.4), dueDate: '2026-06-15', status: 'pending' },
      { id: 'm3', title: 'Final Acceptance (30%)', amount: Math.round(item.value * 0.3), dueDate: item.expirationDate || '2026-12-01', status: 'pending' },
    ] : [],
    versions: [
      {
        version: 'v1.0',
        createdAt: auditEvents[0].timestamp,
        author: 'Alex Rivera',
        summary: 'Initial draft based on standard template.',
      },
      ...(auditEvents.length > 3 ? [{
        version: 'v2.0',
        createdAt: auditEvents[3].timestamp,
        author: 'Alex Rivera',
        summary: 'Incorporated external counsel redlines and payment milestone revisions.',
      }] : []),
    ],
    documents: [
      {
        id: `doc-${item.id}-pdf`,
        name: `${item.number}_Execution_Copy.pdf`,
        sizeBytes: 245000 + idx * 8200,
        uploadedAt: auditEvents[0].timestamp,
        status: 'ready',
      },
    ],
    auditTrail,
  };
});

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Agreement Executed',
    message: 'Patrick Collison signed "Customer Subscription Agreement — Stripe Inc". Execution complete.',
    type: 'success',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    link: '/app/agreements/agr-22',
  },
  {
    id: 'notif-2',
    title: 'Signature Required',
    message: 'Your signature is requested on "Master Services Agreement — Starlight Fintech".',
    type: 'info',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    link: '/app/agreements/agr-13',
  },
  {
    id: 'notif-3',
    title: 'Upcoming Expiration Deadline',
    message: 'Offer letter for Senior DevOps Architect expires in 48 hours.',
    type: 'warning',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    link: '/app/agreements/agr-14',
  },
  {
    id: 'notif-4',
    title: 'Tamper-Evident Audit Record Logged',
    message: 'Audit hash 4a9f...b2 verified for Oracle EMEA software license.',
    type: 'info',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    link: '/app/agreements/agr-18',
  },
  {
    id: 'notif-5',
    title: 'Payment Milestone Due',
    message: 'Milestone #2 for Apex Solutions ERP integration is scheduled for verification.',
    type: 'warning',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    link: '/app/agreements/agr-40',
  },
];

export const INITIAL_REMINDERS = [
  {
    id: 'rem-1',
    agreementId: 'agr-14',
    agreementTitle: 'Senior DevOps Architect Offer Letter',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    type: 'expiration',
    note: 'Follow up with Tomas Lindqvist regarding compensation acceptance.',
  },
  {
    id: 'rem-2',
    agreementId: 'agr-18',
    agreementTitle: 'Software Licensing Agreement — Oracle EMEA',
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
    type: 'signature',
    note: 'Resend signature reminder to Gavin Belson.',
  },
  {
    id: 'rem-3',
    agreementId: 'agr-28',
    agreementTitle: 'Enterprise Software Subscription — Salesforce',
    dueDate: '2026-07-01',
    type: 'renewal',
    note: 'Notify sales ops 60 days before auto-renewal window.',
  },
];
