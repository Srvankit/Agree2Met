# AGREE2MET — Architecture Decision Records (ADRs)

**Document Version:** 1.0.0  
**Phase:** Phase 0 — Technical Architecture Decisions  
**Status:** Draft — Awaiting User Approval  

---

## Index of Decisions

- [ADR-001: Backend Technology Stack Selection](#adr-001-backend-technology-stack-selection)
- [ADR-002: Frontend Technology Stack & Styling Architecture](#adr-002-frontend-technology-stack--styling-architecture)
- [ADR-003: Relational Database & ORM Selection](#adr-003-relational-database--orm-selection)
- [ADR-004: Authentication, Session, Cookie Delivery & CSRF Defense](#adr-004-authentication-session-cookie-delivery--csrf-defense)
- [ADR-005: Electronic Signature Workflow & Tamper-Evident Audit Model](#adr-005-electronic-signature-workflow--tamper-evident-audit-model)
- [ADR-006: Server-Side PDF Generation Pipeline & Worker Sandboxing](#adr-006-server-side-pdf-generation-pipeline--worker-sandboxing)
- [ADR-007: Background Processing & Queuing Architecture](#adr-007-background-processing--queuing-architecture)
- [ADR-008: AI Assistant Architecture & Safety Guardrails](#adr-008-ai-assistant-architecture--safety-guardrails)
- [ADR-009: File Storage Strategy & Access Control](#adr-009-file-storage-strategy--access-control)
- [ADR-010: Frontend Stack Migration to Lovable (React 19 + TypeScript + Vite + TanStack Start + Tailwind CSS + shadcn/ui)](#adr-010-frontend-stack-migration-to-lovable-react-19--typescript--vite--tanstack-start--tailwind-css--shadcnui)
- [Shared Contracts Plan & API Synchronization](#shared-contracts-plan--api-synchronization)
- [Frontend Service to Backend API Mapping](#frontend-service-to-backend-api-mapping)

---

## ADR-001: Backend Technology Stack Selection

### Context
Agree2Met requires a secure, high-throughput backend capable of handling RESTful API interactions, database transactions with row-level locks, asynchronous job queuing, PDF document rendering, and external AI service calls. The frontend is built with React 18 using JavaScript.

### Evaluated Alternatives
1. **Node.js (v20 LTS) + Express.js + TypeScript (Selected)**
2. Python 3.11 + FastAPI + Pydantic
3. Go + Gin + GORM

### Decision
Adopt **Node.js (v20 LTS) with Express.js and TypeScript** for the backend service.

### Rationale & Contract Validation Strategy
- **Ecosystem Parity:** Leveraging the Node.js runtime unifies tooling across the full-stack JavaScript ecosystem and provides mature libraries for PDF generation (Puppeteer) and queuing (BullMQ).
- **Interface Contracts Across JavaScript Frontend & TypeScript Backend:** Because the frontend is authored in JavaScript, compile-time TypeScript type sharing across the entire stack is not possible. Instead, interface contracts are enforced via **Zod schemas on the backend API layer** to validate all incoming payloads and query parameters strictly at runtime. On the frontend, JavaScript modules maintain matching client-side validation rules, and the complete REST API catalogue (`API_DOCUMENTATION.md`) serves as the single source of truth for contract synchronization.
- **Battle-Tested Security Middleware:** Express provides standard middleware (`helmet`, `cors`, `express-rate-limit`, `cookie-parser`).

### Consequences
- CPU-intensive tasks (e.g. PDF rendering) must be offloaded to dedicated background worker processes via BullMQ to avoid blocking the Express event loop.

---

## ADR-002: Frontend Technology Stack & Styling Architecture

### Context
The platform needs a responsive, modern SaaS dashboard with multi-step creation wizards, live document previews, and signature pads. Per the architectural mandate, Tailwind CSS and PostCSS are disallowed unless explicitly approved.

### Evaluated Alternatives
1. **React 18 + Vite (JavaScript) + CSS Modules + CSS Custom Properties (Selected)**
2. Next.js 14 App Router + Tailwind CSS
3. React 18 + Styled-Components (CSS-in-JS)

### Decision
Adopt **React 18 with Vite (JavaScript), React Router DOM, and standard CSS Modules paired with CSS Custom Properties** for the design system.

### Rationale
- **Ultra-Fast Development Experience:** Vite provides instantaneous HMR and clean production rollups.
- **Zero-Runtime Modular CSS:** CSS Modules eliminate class-name collisions without introducing runtime overhead or third-party CSS utility compilers.
- **Clean Theming Engine:** CSS custom properties (`var(--color-bg-primary)`, `var(--color-accent)`) allow instant, flicker-free Light/Dark theme switching via a simple `data-theme` attribute toggle.

### Consequences
- Component styles must be authored directly in modular `*.module.css` files, enforcing disciplined styling practices and clean HTML markup.

> [!NOTE]
> **Status Update (Superseded by ADR-010 for Client UI):**
> Following user authorization for the Frontend Import phase, the client application was migrated to the Lovable-produced stack (React 19 + TypeScript + Vite + TanStack Start + Tailwind CSS v4 + shadcn/ui) documented in ADR-010. The legacy CSS Modules implementation remains preserved in `client-legacy-backup/` for reference.

---

## ADR-003: Relational Database & ORM Selection

### Context
Agreement management involves strictly structured relationships: organizations, users, agreements, multiple parties, clauses, payment terms, signatures, and chained audit logs. Relational consistency and ACID transactions are paramount.

### Evaluated Alternatives
1. **PostgreSQL 16 + Prisma ORM (Selected)**
2. PostgreSQL 16 + TypeORM
3. MongoDB 7 + Mongoose

### Decision
Adopt **PostgreSQL 16 with Prisma ORM**.

### Rationale
- **Relational Integrity & ACID Compliance:** Complex state transitions across multi-party contracts require atomic transactions.
- **Prisma Developer Velocity & Type Safety:** Prisma provides compile-time TypeScript types synchronized with the database schema, minimizing runtime data mismatches.
- **Native JSONB & Full-Text Search:** PostgreSQL handles structured clause metadata in JSONB while providing high-speed GIN-indexed full-text search across agreement titles and terms.
- **Consistent UUID Primary Keys:** All tables use PostgreSQL `gen_random_uuid()` exclusively.

### Consequences
- Prisma interactive transactions (`$transaction`) must be used for concurrency-sensitive operations like simultaneous multi-party signing and audit event appending with row-level locks.

---

## ADR-004: Authentication, Session, Cookie Delivery & CSRF Defense

### Context
Agree2Met must protect sensitive legal documents and personal data from unauthorized access, session hijacking, CSRF, and XSS vulnerabilities.

### Decision
Implement a **Dual-Token System (Short-lived JWT Access Token + Stateful Refresh Token Rotation)** delivered **strictly via `HttpOnly`, `Secure`, `SameSite=Strict` cookies**. Passwords are hashed with **Argon2id**.

### Key Rules & Strategies:
1. **No Tokens in JSON Response Bodies:** Access tokens and refresh tokens are never returned in response bodies or query parameters. Browser clients do not use `Authorization: Bearer` headers.
2. **Hashed Token Storage:** Refresh tokens, email verification tokens, password reset tokens, and guest signing tokens are stored strictly as **SHA-256 hashes** in the database (`refresh_token_hash`, `verification_token_hash`, `password_reset_token_hash`, `invitation_token_hash`).
3. **Explicit CSRF Strategy:** Mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) require a custom request header (`X-Requested-With: XMLHttpRequest`) and validate a double-submit CSRF cookie (`X-CSRF-Token`). Browsers do not attach custom headers to cross-origin requests without an explicit CORS preflight check that respects origin whitelisting.
4. **SameSite Deployment Context:** The frontend application (`app.agree2met.com`) and API (`api.agree2met.com`) share a parent same-site domain (`agree2met.com`), ensuring cookies are included on same-site fetches.
5. **Handling Email Deep Links:** External deep links from emails (e.g. `/sign/:token`, `/verify-email?token=...`) route to the frontend SPA via standard top-level browser GET navigation. The client SPA then issues same-site API queries with custom headers.

---

## ADR-005: Electronic Signature Workflow & Tamper-Evident Audit Model

### Context
The platform must support electronic signatures and evidentiary audit trails without making unsubstantiated claims of statutory compliance or Qualified Electronic Signatures (QES).

### Decision
Implement a **workflow designed to support Basic Electronic Signatures (SES)** backed by a **Tamper-Evident Cryptographic Hash-Chained Audit Trail**.

### Rationale & Legal Disclaimers:
- **No Statutory Compliance Claim:** Agree2Met does not claim statutory legal validity or compliance under the US ESIGN Act, UETA, EU eIDAS, or other jurisdiction-specific laws.
- **Basic Electronic Signature Only:** This is a basic electronic signature workflow, not a Qualified Electronic Signature (QES) or digital certificate-based signature issued by an accredited Trust Service Provider.
- **Mandatory Legal Counsel Notice:** Legal validity, enforceability, and admissibility depend on jurisdiction, agreement subject matter, process integrity, and case-specific requirements; users must have agreements and workflows reviewed by qualified legal counsel.
- **Affirmative Electronic Consent:** Signers must check an explicit confirmation:  
  *"I consent to transact electronically and to apply my electronic signature to this document."*
- **Tamper-Evident Audit Chaining:** Each audit event references the SHA-256 hash of the preceding event:
  $$\text{Hash}_n = \text{SHA256}(\text{AgreementID} + \text{Timestamp} + \text{EventType} + \text{ActorEmail} + \text{IPAddress} + \text{Hash}_{n-1})$$
- **Technical Limitations of Hash Chaining:** While hash chaining makes unauthorized alterations detectable, a privileged actor with direct, unrestricted write access to the PostgreSQL database could theoretically recompute and overwrite the entire chain.
- **Per-Agreement Serialization:** Appending audit events requires acquiring a row-level lock on the agreement record (`SELECT id FROM agreements WHERE id = $1 FOR UPDATE`) within an interactive transaction to prevent chain forks under concurrent actions.
- **Audit Immutability & Retention:** `audit_events.agreement_id` uses `ON DELETE RESTRICT`. Agreements with audit records cannot be deleted; they must be archived.
- **Future Hardening:** The architecture supports optional periodic external anchoring of the latest agreement hash digest (e.g., to an RFC 3161 Timestamping Authority).

---

## ADR-006: Server-Side PDF Generation Pipeline & Worker Sandboxing

### Context
Agreement documents must be compiled into high-resolution, pixel-perfect PDF files with exact page breaks, headers, footers, page numbering, and digital signature stamps.

### Decision
Adopt a **Headless Chromium (Puppeteer) + pdf-lib compilation pipeline** running within a dedicated BullMQ background worker, hardened against security vulnerabilities.

### Mandatory Security Constraints:
1. **Server-Sanitized HTML Only:** User-provided clause content is sanitized and rendered strictly as text nodes; raw user HTML or embedded script execution is forbidden.
2. **Outbound Network Blocking:** Puppeteer request interception (`page.setRequestInterception(true)`) aborts all external HTTP/HTTPS requests and resource loads, eliminating SSRF and data exfiltration risks.
3. **Unprivileged Sandbox Execution:** Chromium processes execute under a dedicated, unprivileged non-root OS user with standard Chrome sandbox flags enabled (`--no-sandbox` disallowed in production).
4. **Execution & Memory Limits:** Strict execution timeout (10 seconds max per document) and worker memory limits (512MB max per process).

---

## ADR-007: Background Processing & Queuing Architecture

### Context
Asynchronous tasks like PDF compilation, sending transactional emails, processing scheduled expiration alerts, and long-running AI queries must not block HTTP request cycles. Furthermore, avatars, PDFs, and invitation emails in earlier phases must not depend on infrastructure introduced later.

### Decision
Initialize **Redis 7 with BullMQ and Nodemailer (SMTP/Ethereal local)** in **Phase 1** as foundational infrastructure.

### Rationale
- Setting up BullMQ queues (`transactional-email-queue`, `pdf-generation-queue`, `cron-scheduler-queue`) in Phase 1 ensures Phase 3 (email verification), Phase 6 (PDF compilation), and Phase 7 (invitation emails) operate on real infrastructure without forward dependency gaps.

---

## ADR-008: AI Assistant Architecture & Safety Guardrails

### Context
The AI assistant provides clause drafting, summarization, and explanation capabilities. Legal technology requires rigorous safeguards to avoid hallucinations and unauthorized practice of law.

### Decision
Integrate the **Google Gemini API** strictly via the **Node.js backend service**, enforcing structured JSON output schemas and non-negotiable legal disclaimers.

### Rationale
- **Credential Protection:** Frontend never has access to AI API keys.
- **Output Structuring:** Leveraging structured JSON mode ensures predictable, parseable responses for clause insertion.
- **Legal Safeguards:** System prompts and UI components mandate that all responses include an explicit disclaimer:  
  *“Disclaimer: Agree2Met AI provides informational assistance only and does not constitute formal legal advice. Consult licensed legal counsel.”*

---

## ADR-009: File Storage Strategy, S3 Engine Selection & Access Control

### Context
Agreement PDFs, signature assets, and user avatars must be stored securely, encrypted at rest, and protected from unauthorized public access without forward dependency issues.

### Decision
Provision an **S3-Compatible Object Storage Abstraction** in **Phase 1** using **Private Buckets and Time-Limited Presigned URLs**:
- **Local Development:** Scality CloudServer (`zenko/cloudserver:latest`).
- **Production Environments:** AWS S3 or Cloudflare R2.

### Local S3 Implementation: Why `zenko/cloudserver` instead of MinIO
- **Registry Availability & Licensing:** The official `minio/minio` image on Docker Hub has been restricted and quay.io images intermittently require authenticated pull credentials, causing pipeline fragility. `zenko/cloudserver` is a fully open-source, robust S3 API server that pulls without authentication, initializes instantly, and adheres to the AWS S3 REST specification.
- **SDK Compatibility:** Tested and verified against `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` with `forcePathStyle: true`.

### Behavioral Differences & Production Considerations (AWS S3 vs. Cloudflare R2 vs. Zenko)
1. **ACL Handling & Bucket Creation:**
   - *Zenko:* Accepts standard `CreateBucket` and `PutBucketAcl` commands locally.
   - *AWS S3:* Recommended setting is "Bucket Owner Enforced" (ACLs disabled). Object privacy is enforced via AWS Block Public Access and IAM bucket policies. The `storage.service.ts` gracefully ignores ACL command rejections.
   - *Cloudflare R2:* Does not implement S3 ACL APIs (`PutBucketAcl` returns an unsupported operation error). Buckets are private by default, and access is governed by Cloudflare API tokens.
2. **Addressing Style (Path-Style vs. Virtual-Hosted):**
   - *Zenko / Local:* Requires `forcePathStyle: true` (`http://localhost:9000/agree2met-dev/<key>`).
   - *AWS S3:* Uses virtual-hosted URLs (`https://<bucket>.s3.<region>.amazonaws.com/<key>`).
   - *Cloudflare R2:* Uses account-scoped endpoints (`https://<account-id>.r2.cloudflarestorage.com/<bucket>/<key>`).
3. **Presigned URL Signatures & Expiration:**
   - Both AWS S3, Cloudflare R2, and Zenko CloudServer support AWS SigV4 signed URLs (`getSignedUrl`). Expiration (default 300 seconds / 5 minutes) is enforced by the storage engine on request.
4. **Egress & Economics:**
   - AWS S3 imposes outbound data transfer fees; Cloudflare R2 features zero data egress fees, which may be advantageous for high-volume agreement viewing and downloads.

### Rationale & Security Rules
- Initializing S3 storage in Phase 1 allows Phase 3 user avatar uploads, Phase 6 compiled PDFs, and Phase 7 signature images to persist immediately to permanent object storage.
- Private buckets prevent unauthorized scraping or search engine indexing of confidential legal agreements.
- Access is granted exclusively through short-lived (5-minute) signed download URLs or backend streaming proxy following strict tenant authorization checks. All tokens are omitted from URL query strings.

---

## ADR-010: Frontend Stack Migration to Lovable (React 19 + TypeScript + Vite + TanStack Start + Tailwind CSS + shadcn/ui)

### Context
To accelerate product realization and enable comprehensive review of all visual screens, state flows, and interaction models across the Agree2Met SaaS platform, the complete user interface was designed and prototyped using Lovable. The generated application uses React 19, TypeScript, TanStack Start / Router (file-based routing), Tailwind CSS v4, and Radix UI / shadcn/ui component primitives. By user directive, this stack was approved to replace the vanilla CSS Modules client (`client/`), overriding ADR-002 for the frontend repository.

### Evaluated Alternatives
1. **Manual conversion to React 18 + CSS Modules:** High friction, manual labor to rewrite dozens of complex Radix-based UI components, losing Tailwind v4 theming tokens.
2. **Direct Adoption of Lovable Stack (Selected):** Retain React 19 + TypeScript + Vite + TanStack Start + Tailwind CSS v4 + shadcn/ui, clean out proprietary vendor dependencies, and integrate Agree2Met's security, API adapter, and mock store.

### Decision
Adopt the **Lovable-produced frontend stack (React 19, TypeScript 5, Vite, TanStack Start / TanStack Router, Tailwind CSS v4, and shadcn/ui)** for `client/`. Move the original Phase 1 client to `client-legacy-backup/` for complete historical preservation.

### Architecture & De-vendorization
1. **Purge Proprietary Vendor Tooling:** Removed `@lovable.dev/vite-tanstack-config`, `@lovable.dev/component-tagger`, and `lovable-tagger` Vite plugins. Standardized on native `@tanstack/react-start/plugin/vite`, `@vitejs/plugin-react`, and `@tailwindcss/vite`.
2. **Supabase Decoupling:** Completely deleted all Supabase client libraries (`@supabase/supabase-js`, `client/supabase/`, `client/drizzle/`, `src/integrations/supabase/`). Replaced all authentication, workspace, and data queries with native Agree2Met domain services.
3. **Self-Hosted Typography (No CDN / CSP Friendly):** Embedded `@fontsource-variable/inter`, `@fontsource/jetbrains-mono`, and `@fontsource/source-serif-4` directly into CSS bundles. Removed external Google Fonts links and inline theme scripts from HTML to ensure strict Content Security Policy (CSP) compliance.
4. **Preserved Core Infrastructure:** Maintained Vite dev server port at `5173`, integrated standard Agree2Met `apiClient` (`credentials: 'include'`, `X-Requested-With: XMLHttpRequest`, CSRF token reflection), and rebuilt the `/status` system diagnostic health dashboard.

### Mock-Adapter Strategy & Defensive State Handling
To guarantee high fidelity and zero crashes during frontend-first reviews:
- **Mock Store Versioning (`MOCK_STORE_VERSION = 4`):** Stored under localStorage key `agree2met-demo-v4`. On initialization, if the stored version does not match `4`, the store discards stale data and re-seeds cleanly from the canonical domain fixtures.
- **Array Invariant Enforcement:** Helper `normalizeAgreement()` ensures that collections (`parties`, `clauses`, `history`, `audit_events`, `activity`) are always initialized as arrays (`[]`), completely eliminating `"Cannot read properties of undefined (reading 'map')"` runtime errors.
- **Toggleable Transport Layer:** The API client operates with `VITE_USE_MOCK=true` (default), reading and mutating local state synchronously. Switching `VITE_USE_MOCK=false` dynamically connects the application to the Express backend (`http://localhost:5000/api/v1`).

### Consequences
- Frontend is authored in TypeScript, bringing full compile-time static type checking to components, props, hooks, and services.
- Tailwind CSS v4 provides token-driven Light/Dark mode styling via CSS variables and `.dark` class toggling.
- Full parity with backend roadmap: backend phases (Phases 2-10) remain decoupled and unblocked.

---

## Shared Contracts Plan & API Synchronization

With both the backend (`server/`) and frontend (`client/`) utilizing TypeScript, Agree2Met establishes a robust shared contract strategy to guarantee schema parity without code duplication:

### 1. Contract Strategy & Single Source of Truth
- **Zod Schema Authoring:** All data models, request payloads (body, params, query), and response envelopes are formally defined using Zod schemas.
- **Static Type Extraction:** TypeScript types are derived directly from the Zod schemas via `z.infer<typeof Schema>`, eliminating dual-maintenance overhead:
  ```typescript
  export const CreateAgreementSchema = z.object({
    title: z.string().min(3).max(120),
    category_id: z.string().uuid(),
    parties: z.array(PartySchema).min(1),
  });
  export type CreateAgreementDto = z.infer<typeof CreateAgreementSchema>;
  ```
- **Monorepo / Shared Package Architecture:** In Phase 2/3, shared schemas will reside in `shared/contracts/` (or a workspace package `@agree2met/contracts`), consumed directly by both `server/src/validators/` and `client/src/services/`.

### 2. Runtime & Compile-Time Boundary Defense
- **Backend Entrypoint Defense:** Express validation middleware validates all incoming HTTP requests (`validateBody(Schema)`), rejecting invalid payloads with structured 400 Bad Request responses before reaching controller handlers.
- **Frontend Type Safety:** The client-side `apiClient` enforces return types corresponding to the standard API envelope: `ApiResponse<T> = { success: boolean; data: T; meta?: Record<string, unknown> }`.

---

## Frontend Service to Backend API Mapping

The following table maps the frontend service layer (`client/src/services/`) to the target REST API endpoints defined in `API_DOCUMENTATION.md`:

| Service Module | Function | HTTP Method | Endpoint Path | Request Payload / Params | Response Data | Current Status |
|---|---|---|---|---|---|---|
| **api.ts** | `getHealth()` | `GET` | `/api/v1/health` | None | `{ status, uptime, dependencies: { database, redis, storage, smtp } }` | **Implemented** |
| **api.ts** | `sendTestEmail()` | `POST` | `/api/v1/dev/test-email` | `{ to: string, subject: string, text: string }` | `{ messageId, accepted: string[] }` | **Implemented** |
| **authService.ts** | `login()` | `POST` | `/api/v1/auth/login` | `{ email, password }` | `{ user: { id, email, full_name, role } }` | Mocked (Target Phase 3) |
| **authService.ts** | `register()` | `POST` | `/api/v1/auth/register` | `{ email, password, full_name, organization_name }` | `{ user, message }` | Mocked (Target Phase 3) |
| **authService.ts** | `logout()` | `POST` | `/api/v1/auth/logout` | None | `{ message: "Logged out successfully" }` | Mocked (Target Phase 3) |
| **authService.ts** | `getCurrentUser()` | `GET` | `/api/v1/auth/me` | None | `{ user: UserProfile }` | Mocked (Target Phase 3) |
| **agreementsService** | `getAgreements()` | `GET` | `/api/v1/agreements` | Query: `?status=&category=&search=&page=&limit=` | `{ agreements: Agreement[], total, page, limit }` | Mocked (Target Phase 6) |
| **agreementsService** | `getAgreementById()` | `GET` | `/api/v1/agreements/:id` | Route param: `id` | `{ agreement: AgreementDetail }` | Mocked (Target Phase 6) |
| **agreementsService** | `createAgreement()` | `POST` | `/api/v1/agreements` | `{ title, category_id, parties, clauses, ... }` | `{ agreement: Agreement }` | Mocked (Target Phase 5) |
| **agreementsService** | `updateAgreement()` | `PUT` | `/api/v1/agreements/:id` | `{ title, clauses, payment_terms, ... }` | `{ agreement: Agreement }` | Mocked (Target Phase 5) |
| **agreementsService** | `transitionState()`| `POST` | `/api/v1/agreements/:id/transition` | `{ action: "send" \| "archive" \| "cancel" }` | `{ agreement: Agreement, event: AuditEvent }` | Mocked (Target Phase 5) |
| **signingService** | `submitSignature()` | `POST` | `/api/v1/agreements/:id/sign` | `{ consent: boolean, signature_image_data, party_id }` | `{ signature: SignatureReceipt, audit_hash }` | Mocked (Target Phase 7) |
| **signingService** | `guestVerify()` | `GET` | `/api/v1/signing/verify/:token` | Route param: `token` | `{ agreement: GuestAgreementView, party: Party }` | Mocked (Target Phase 7) |
| **documentsService** | `generatePdf()` | `POST` | `/api/v1/agreements/:id/pdf` | None (Enqueues BullMQ job) | `{ job_id: string, status: "queued" }` | Mocked (Target Phase 6) |
| **documentsService** | `getPdfDownloadUrl()`| `GET` | `/api/v1/agreements/:id/pdf/download` | None | `{ download_url: string, expires_at: string }` | Mocked (Target Phase 6) |
| **aiService** | `draftClause()` | `POST` | `/api/v1/ai/draft-clause` | `{ prompt, category, context }` | `{ clause: { title, body, explanation } }` | Mocked (Target Phase 9) |
| **aiService** | `analyzeRisk()` | `POST` | `/api/v1/ai/analyze-risks` | `{ agreement_id }` | `{ risks: RiskItem[], disclaimer: string }` | Mocked (Target Phase 9) |
| **organizationsService**| `getOrgSettings()`| `GET` | `/api/v1/organizations/current` | None | `{ organization: OrgDetails, members: Member[] }` | Mocked (Target Phase 3) |
| **organizationsService**| `updateSettings()` | `PATCH`| `/api/v1/organizations/current` | `{ name, branding: { logo, color } }` | `{ organization: OrgDetails }` | Mocked (Target Phase 3) |
| **notificationsService**| `listNotifications()`| `GET` | `/api/v1/notifications` | Query: `?read=false` | `{ notifications: Notification[], unread_count }`| Mocked (Target Phase 8) |
