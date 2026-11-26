# AGREE2MET — Comprehensive Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Phase:** Phase 0 — Project Discovery & Requirements Definition  
**Date:** November 2026  
**Status:** Draft — Awaiting User Approval  

---

## 1. Executive Summary & Product Vision

### 1.1 Product Overview
**Agree2Met** is an enterprise-oriented, multi-tenant Digital Agreement Management Software-as-a-Service (SaaS) platform. The platform is designed to govern the complete lifecycle of digital agreements—from multi-step creation and structured drafting, collaborative review, electronic signing, and automated milestone tracking, to secure document archiving and tamper-evident audit verification.

Unlike single-purpose signature tools or basic document generators, Agree2Met provides a comprehensive agreement management ecosystem for freelancers, startups, medium businesses, enterprise legal operations, and external counterparties.

### 1.2 Core Value Propositions
1. **End-to-End Agreement Lifecycle:** Seamless transition from drafting, party negotiation, and structured terms definition through execution, completion, and expiration.
2. **Designed to Support Standard Electronic Signature (SES) Workflows:** Built to support basic electronic signature workflows with tamper-evident audit logging, IP verification, and cryptographic hash chaining (SHA-256). *Note: Legal validity and enforceability depend on jurisdiction, document type, process, and case-specific requirements; users must seek review from qualified legal counsel.*
3. **Structured Terms & Contract Data:** Agreements stored as structured relational records (parties, terms, milestones, values) rather than opaque static PDFs.
4. **Context-Aware AI Assistant:** Secure server-mediated AI capabilities for clause drafting, simplification, translation to plain English, and missing-risk detection.
5. **Multi-Tenancy & Collaboration:** Organization workspaces, fine-grained Role-Based Access Control (RBAC), and tokenized external guest signer portals.

---

## 2. User Personas & Target Audiences

| Persona | Role & Description | Primary Needs | Critical Touchpoints |
|---|---|---|---|
| **Alex Rivera (Freelancer / Consultant)** | Independent contractor creating client agreements, NDAs, and project scopes. | Fast setup, pre-built clause templates, professional PDF output, quick client signing without mandatory account sign-up. | Agreement Wizard, PDF Preview, Client Signing Link, Status Tracking. |
| **Samantha Reed (Startup Founder / SMB Owner)** | Managing vendor contracts, employee offer letters, partnership agreements. | Centralized dashboard, multi-party signing, deadline reminders, agreement duplication. | Dashboard KPIs, Party Manager, Reminders & Notifications, Duplication. |
| **Marcus Vance (Legal Ops / HR Manager)** | Overseeing 50+ monthly agreements, operational review, and document retention. | Granular tamper-evident audit trail, version history, organization team roles, search and filtering. | Audit Log Inspector, Organization RBAC, Export & Archival, Advanced Filters. |
| **Elena Rostova (External Signer / Counterparty)** | External client or vendor receiving an agreement to review and sign. | Frictionless experience, mobile responsiveness, clear terms display, transparent e-sign consent. | Guest Signing Portal, OTP / Verification link, PDF Certificate Download. |

---

## 3. Core Functional Modules (Deep-Dive Specifications)

### Module A: Authentication, Organization & Identity Management
- **User Registration:** Email, password (min 10 chars, mixed case, numbers, special characters), full name, terms consent.
- **Credential Authentication:** Secure login with rate-limited attempts (5 failures / 15 mins), password hashing via Argon2id.
- **Session & Token Architecture:** Short-lived JWT access tokens (15 minutes) paired with rolling refresh tokens (7 days). Tokens are delivered **exclusively via `HttpOnly`, `Secure`, `SameSite=Strict` cookies** (never in JSON response bodies or URL query parameters). Browser requests do not use Bearer authorization headers.
- **CSRF Defense:** Cookie-based mutating requests require explicit CSRF protection (custom request header check e.g. `X-Requested-With: XMLHttpRequest` and double-submit token).
- **SameSite Deployment Context:** Assumes application and API reside on same-site domains (e.g. `app.agree2met.com` and `api.agree2met.com`). External deep links from emails route to frontend URL paths, which then initiate same-site API queries.
- **Hashed Token Storage:** Email verification, password reset, and refresh tokens are stored strictly as SHA-256 hashes of cryptographically random values (`verification_token_hash`, `password_reset_token_hash`, `refresh_token_hash`), never in plaintext.
- **Email Verification:** Cryptographic token sent via transactional email; required before sending or signing agreements.
- **Password Recovery:** Time-limited (1 hour) single-use reset tokens with secure invalidation upon password update.
- **OAuth2 / Google Sign-In:** Direct Google OpenID Connect flow, federating identity and automatically linking verified email addresses.
- **User Profile Management:** Avatar upload (validated MIME types: JPG, PNG, WebP; max 2MB; stored in Phase 1 S3 storage), contact phone, job title, timezone, and locale settings.
- **Multi-Tenant Organization Workspaces:** Users belong to organizations exclusively through `organization_members`. Roles: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`.
- **Data Isolation:** Strict multi-tenant row-level boundary. Every query is scoped to `organization_id` or user ownership.

### Module B: Main Dashboard & Real-Time Operational Overview
- **Real-Time KPI Counters (Computed via DB Aggregations):**
  - Total Agreements created/received.
  - Active / Running Agreements (In Progress / Partially Signed).
  - Awaiting User Action (Pending signatures required from current user).
  - Completed Agreements.
  - Expired / Cancelled Agreements.
- **Agreement Activity Feed:** Chronological stream of recent actions (e.g., "John Doe viewed NDA", "Agreement #A2M-104 signed by Client").
- **Recent Agreements Grid/Table:** Quick-access list with status pill badges, counterparty names, category, and action buttons.
- **Upcoming Deadlines & Expiration Alerts:** Visual flags for agreements expiring within 7, 14, or 30 days.
- **Quick Action Bar:** "New Agreement", "Draft NDA", "Invite Collaborator", "AI Clause Assistant".

### Module C: Agreement Creation Engine
- **Guided 6-Step Multi-Stage Wizard:**
  1. *Step 1: Agreement Details:* Title, Category (NDA, Service Agreement, Employment, Partnership, Sales, Lease, Custom), Reference Number, Effective Date, Expiration Date.
  2. *Step 2: Parties Information:* Primary party (Creator/Company), Counterparties (Name, Email, Role: Signer/Reviewer/Viewer, Signing Order).
  3. *Step 3: Terms & Clauses:* Structured sections (Scope of Work, Confidentiality, Intellectual Property, Termination, Governing Law, Custom Clauses). Drag-and-drop / re-orderable clauses.
  4. *Step 4: Financial & Commercial Conditions:* Agreement Value, Currency, Payment Milestones, Invoicing Terms, Late Payment Penalties.
  5. *Step 5: Review & Form Validation:* Comprehensive schema validation, side-by-side live formatted preview.
  6. *Step 6: Finalization & Dispatch:* Options to save as Draft, publish for internal review, or dispatch directly to signers.
- **Draft Auto-Saving:** Debounced (1500ms) background persistence to draft state.
- **Basic Version Snapshots:** Creates a baseline version record (`agreement_versions`) upon initial finalization and major draft updates, capturing structured clause and party JSON payloads.
- **Dynamic PDF Compilation:** Generated via server-side Puppeteer worker with integrity checksum calculation.

### Module D: Agreement Management & Repository
- **Data Grid & List Views:** Paginated list (10, 25, 50, 100 per page) with server-side sorting by creation date, title, status, and expiration.
- **Full-Text Search:** Postgres Full-Text Search (`tsvector` / GIN index) indexing agreement title, reference number, counterparty name, and clause text.
- **Multi-Parameter Filtering:** Filter by status (Draft, Sent, Completed, etc.), category, date ranges, and counterparty.
- **Agreement Actions:**
  - *View Details:* Comprehensive tabbed overview (Document, Parties & Status, Audit Trail, Versions, Financial Terms).
  - *Edit:* Permitted only in `DRAFT` or `PENDING_REVIEW` states.
  - *Duplicate:* Clones structure, terms, and conditions into a new `DRAFT` while stripping previous party signatures.
  - *Archive / Unarchive:* Explicit archive and unarchive state toggles, distinct from deletion.
  - *Delete:* Hard delete strictly restricted to `DRAFT` status without associated audit logs; agreements with audit history cannot be hard deleted (`ON DELETE RESTRICT`), preserving audit record integrity.
  - *Download PDF:* Authenticated streaming or short-lived presigned URL access (no sensitive tokens in URL query strings).

### Module E: Agreement Lifecycle State Machine
Strict transition rules enforced at database and service layers:
```
[DRAFT] 
   ├──> [PENDING_REVIEW] 
   │        ├──> [DRAFT] (Changes requested)
   │        └──> [SENT]
   └──> [SENT] (Direct send by authorized owner)
          └──> [AWAITING_SIGNATURES]
                   ├──> [PARTIALLY_SIGNED] (1 of N signers completed)
                   │        ├──> [COMPLETED] (All N signers completed)
                   │        ├──> [REJECTED] (Any signer declines)
                   │        └──> [EXPIRED] (Deadline elapsed)
                   ├──> [COMPLETED] (Single signer completes)
                   ├──> [REJECTED] (Signer declines)
                   ├──> [CANCELLED] (Creator revokes agreement)
                   └──> [EXPIRED] (Deadline reached)
```
- **State Invariants:**
  - No edits permitted once status is `SENT` or beyond.
  - An agreement in `COMPLETED` is cryptographically sealed; fields and documents become permanently immutable.
  - Rejection requires the declining party to submit a mandatory text explanation.

### Module F: Parties & Collaboration
- **Participant Roles:**
  - `CREATOR`: Originator with full management and cancellation rights.
  - `SIGNER`: Required to review, electronically consent, and execute a signature.
  - `REVIEWER`: Can read and add internal annotations/comments; cannot sign.
  - `VIEWER`: Read-only observer receiving completed copy.
- **Secure Guest Signing Access:**
  - High-entropy cryptographic token generated per signature request. The plaintext token is transmitted in the email link, and only its SHA-256 hash (`invitation_token_hash`) is stored in the database.
  - Optional One-Time Passcode (OTP) verification sent to signer's email for enhanced authentication.
  - Expiration timestamp on invitation links (default: 14 days, configurable).

### Module G: Digital Signing Workflow & Legal Framework
- **Electronic Signature Workflow Disclaimer:**
  - Agree2Met is **designed to support basic electronic signature (SES) workflows**.
  - **Important Legal Notice:** Agree2Met does not provide Qualified Electronic Signatures (QES) or certificate-based digital signatures issued by an accredited Trust Service Provider. The platform does not claim statutory legal validity under the US ESIGN Act, UETA, EU eIDAS, or other jurisdiction-specific statutes. Legal validity and enforceability depend on jurisdiction, document type, process integrity, and case-specific requirements; users must seek review from qualified legal counsel.
- **Electronic Consent Statement:**
  - Signers must check an explicit opt-in confirmation before viewing the signature pad:  
    > *"I consent to transact electronically and to apply my electronic signature to this document."*
- **Signature Input Modes:**
  - *Draw:* HTML5 responsive signature canvas with smoothing algorithms, exporting vector/PNG data to Phase 1 S3 storage.
  - *Type:* Formatted cursive typographic rendering with user verification.
  - *Upload:* Scanned physical signature image with format and size validation.
- **Evidence & Telemetry Collection:**
  - Signer IP address (IPv4/IPv6).
  - User-Agent header (Browser, OS, Device).
  - Exact UTC timestamp (ISO 8601 with millisecond precision).
  - Cryptographic hash (SHA-256) of agreement document at the moment of signing.
- **Certificate of Completion:** Automatically appended to the finalized agreement PDF, containing:
  - Document Title, Unique Agreement ID, and Original Document SHA-256 Hash.
  - List of signatories, respective email addresses, signing methods, timestamps, and IP addresses.
  - Summary audit seal.

### Module H: Reminders & Notification System
- **Foundational Infrastructure (Phase 1):** Utilizes Redis + BullMQ background queues (`transactional-email-queue`) and the Phase 1 email service (SMTP/Ethereal/MailHog in dev, transactional provider in prod).
- **In-App Notification Center:**
  - Real-time notification badge and dropdown drawer.
  - Categorized alerts: Action Required, Signature Completed, Expiration Warning, System Alert.
  - Read/Unread toggles, bulk mark-as-read, and user notification preference management.
- **Transactional Email Notifications:**
  - Agreement Invitation: "You have been requested to review and sign [Agreement Name]".
  - Signature Confirmation: "You have successfully signed [Agreement Name]".
  - Agreement Completed: "All parties have signed. Download your executed agreement".
  - Rejection Notice: "Signer [Name] has declined [Agreement Name] with comment".
  - Automated Reminder: "Friendly reminder: [Agreement Name] requires your signature in 3 days".
- **Background Cron Engine:** Hourly automated scan identifying agreements expiring or requiring signature reminders based on user-configured cadence.

### Module I: Agreement Analytics & Reporting
- **Quantitative Metrics (Calculated from real DB records):**
  - Agreement Completion Rate (%) = `(Completed / (Sent + Awaiting + Completed + Rejected)) * 100`.
  - Average Time to Execution (Hours/Days from `SENT` to `COMPLETED`).
  - Monthly Volume Breakdown (Line/Bar trend of agreements initiated vs completed).
  - Distribution by Category (Pie/Donut of NDA vs Service vs Employment).
  - Signer Turnaround Benchmarking.

### Module J: Context-Aware AI Agreement Assistant
- **Functional AI Capabilities:**
  - *Clause Drafter:* Generate standard clauses based on prompt parameters (e.g., "Draft a non-solicitation clause for 12 months in California").
  - *Plain English Translator / Explainer:* Converts complex legalese into accessible bullet points.
  - *Agreement Summarizer:* Produces an executive 1-page summary of rights, duties, payment dates, and liabilities.
  - *Risk & Gap Analyzer:* Checks for missing essential boilerplate (Governing Law, Severability, Force Majeure).
- **Security & Safety Guardrails:**
  - Backend API intermediary (Frontend never holds or calls AI credentials).
  - Strict PII sanitization before external API transmission.
  - Non-Negotiable Legal Disclaimer: Every AI response displays:  
    *“Disclaimer: Agree2Met AI provides informational assistance only and does not constitute formal legal advice. Consult licensed legal counsel for binding jurisdictional advice.”*

### Module K: Document Management & Cryptographic Integrity
- **Core Storage Infrastructure (Phase 1):** Built on S3-compatible storage (MinIO local, S3/R2 prod) initialized in Phase 1, supporting private buckets, server-side encryption, and signed streaming URLs.
- **PDF Compilation Pipeline:** Headless Chromium / PDFKit compilation generating consistent typography, margins, header/footer page numbers, and embedded signature stamps.
- **Advanced Document Management (Phase 10):** Visual version diffing, supplementary document attachment uploads, document retention policies, and SHA-256 verification.
- **Integrity Verification:** SHA-256 checksum calculated on document creation and verified on download to ensure zero tampering.

### Module L: User & Workspace Settings
- **User Account Settings:** Personal details, avatar management, password changes, account deletion, and data export.
- **Workspace Settings:** Organization name, logo, default currency, default agreement jurisdiction, team member invites.
- **Notification Preferences:** Granular email notification toggles (Immediate, Daily Digest, Disable Reminders).
- **Theme Settings:** Instant toggle between Light Mode and Dark Mode with persistent client-side storage and system default synchronization.

---

## 4. Non-Functional Requirements (NFR)

| Area | Requirement Specification | Metric / Target |
|---|---|---|
| **Performance** | API endpoint response time for standard CRUD queries. | $p95 < 150\text{ ms}$ |
| **PDF Generation** | Server-side PDF compilation turnaround time. | $< 2.5\text{ seconds}$ for documents under 15 pages |
| **Availability** | Operational system uptime excluding planned maintenance. | $99.9\%$ SLA target |
| **Security** | Industry standard encryption for data in transit and at rest. | TLS 1.3, AES-256 for document store, Argon2id for auth |
| **Data Isolation** | Multi-tenant tenant segregation. | Zero cross-tenant data leakage via strict tenant query scoping |
| **Accessibility** | Frontend UI accessibility compliance. | WCAG 2.1 Level AA conformance (contrast, keyboard navigation) |
| **Scalability** | Horizontal stateless backend scaling. | Stateless API pods with centralized Redis session/cache store |

---

## 5. Potential Edge Cases & Failure Mitigation Strategies

1. **Simultaneous Signing Race Condition:**
   - *Problem:* Two signers execute a multi-party agreement at the exact same millisecond, leading to inconsistent partial sign counters.
   - *Mitigation:* Database-level row locking (`SELECT ... FOR UPDATE` on `agreements` via Prisma interactive transaction `$transaction`) during signing commits.
2. **Expired Invitation Link Usage:**
   - *Problem:* A signer attempts to open an invitation link after agreement expiration or cancellation.
   - *Mitigation:* Explicit token validation endpoint checking both token validity and agreement status before rendering signing interface, serving friendly explanation screen.
3. **Draft Loss during Connection Drop:**
   - *Problem:* User experiences network failure while drafting a complex 10-clause agreement.
   - *Mitigation:* Dual-layer persistence: local browser `localStorage` draft backup combined with debounced background server sync.
4. **Malicious File Uploads:**
   - *Problem:* Attackers upload disguised executable binaries or oversized files to avatar or document upload endpoints.
   - *Mitigation:* Magic-number MIME-type inspection, file size hard caps (2MB for images, 15MB for documents), randomized server-generated storage keys, and private S3 buckets.
5. **AI API Outage or Rate Limit:**
   - *Problem:* Upstream AI provider experiences rate limits or downtime.
   - *Mitigation:* Graceful UI degradation with clear notification, exponential backoff, and circuit breaker patterns without blocking core agreement workflows.
