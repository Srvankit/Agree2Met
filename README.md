# AGREE2MET — Digital Agreement Management SaaS Platform

[![Phase](https://img.shields.io/badge/Phase-1%20Foundation%20%26%20Infrastructure-success.svg)](file:///c:/Users/AnkitAccess/Agree2Met/IMPLEMENTATION_ROADMAP.md)
[![Status](https://img.shields.io/badge/Status-Phase%201%20Complete%20%E2%80%94%20Verified-brightgreen.svg)](file:///c:/Users/AnkitAccess/Agree2Met/DEVELOPMENT_PROGRESS.md)
[![Architecture](https://img.shields.io/badge/Architecture-Decoupled%20Multi--Tier-orange.svg)](file:///c:/Users/AnkitAccess/Agree2Met/SYSTEM_ARCHITECTURE.md)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript%20%2B%20Tailwind%20v4-61dafb.svg)](file:///c:/Users/AnkitAccess/Agree2Met/TECHNICAL_DECISIONS.md#adr-010)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20(LTS)%20%2B%20Express%20%2B%20TypeScript-339933.svg)](file:///c:/Users/AnkitAccess/Agree2Met/TECHNICAL_DECISIONS.md#adr-001)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2016%20%2B%20Prisma%20ORM-336791.svg)](file:///c:/Users/AnkitAccess/Agree2Met/DATABASE_DESIGN.md)

---

## 1. Product Overview & System Architecture

**Agree2Met** is an enterprise-oriented digital agreement management SaaS platform designed to govern the entire lifecycle of legal agreements and digital contracts—from guided multi-party creation, structured term definition, and draft collaboration, to electronic signature collection, automated expiration monitoring, and tamper-evident document archiving.

### Core Architecture Highlights:
- **Decoupled Architecture:** React 19 client (`client/`) powered by TypeScript, Vite, TanStack Start / Router, Tailwind CSS v4, and shadcn/ui (ADR-010), communicating via cookie-authenticated REST API with Express 4 TypeScript backend (`server/`).
- **Comprehensive Mock & Offline Layer:** The client features a versioned mock store (`MOCK_STORE_VERSION = 4`) allowing full standalone exploration of all SaaS screens and state transitions with demo credentials without requiring backend services to be active.
- **Security by Default:** Zod environment validation, helmet HTTP security headers, CORS origin restrictions with credentials, cookie-only JWT delivery scaffold, and active CSRF protection (`X-Requested-With` header check + double-submit token).
- **Relational Data Tier:** PostgreSQL 16 managed via Prisma 5 ORM with baseline migrations.
- **Asynchronous Task Runtime:** Redis 7 powering BullMQ queues (`transactional-email-queue`, `pdf-generation-queue`, `cron-scheduler-queue`) and decoupled background workers.
- **S3-Compatible Document Storage:** S3 SDK client configured for private bucket access (local Zenko/MinIO storage) with pre-signed download and upload URLs.
- **Local Mail Catcher:** Nodemailer SMTP integration routing local mail to Mailpit (Web UI on port 8025).

---

## 2. Infrastructure & Port Mapping

The local development environment runs containerized backing services defined in `docker-compose.yml`:

| Service | Container Name | Host Port | Internal Port | Description |
|---|---|---|---|---|
| **PostgreSQL 16** | `agree2met-postgres` | **5433** | 5432 | Relational DB (*Port 5433 avoided host port 5432 collision*) |
| **Redis 7** | `agree2met-redis` | **6379** | 6379 | In-memory queue broker & cache |
| **S3 Storage** | `agree2met-storage` | **9000** | 8000 | S3 API endpoint (Bucket: `agree2met-dev`, powered by Zenko CloudServer) |
| **Mailpit SMTP** | `agree2met-mailpit` | **1025** | 1025 | Local SMTP catcher port |
| **Mailpit UI** | `agree2met-mailpit` | **8025** | 8025 | Web inspection UI for dispatched emails |
| **Express API** | Host Node Process | **5000** | 5000 | Backend REST API (`/api/v1`) |
| **React Client** | Host Vite Process | **5173** | 5173 | Frontend Single Page Application |

> [!NOTE]
> **S3-Compatible Storage Selection: Scality CloudServer (`zenko/cloudserver:latest`) vs MinIO:**
> Due to Docker Hub pulling restrictions on official MinIO images and authentication gates on quay.io, Agree2Met adopts `zenko/cloudserver` for local development. It is 100% open-source, requires zero registry credentials, and implements standard AWS S3 REST endpoints (`@aws-sdk/client-s3`).
> 
> **Production Behavior Differences (AWS S3 vs. Cloudflare R2 vs. Zenko):**
> - **Bucket ACLs:** Zenko supports local `PutBucketAcl`. AWS S3 uses Bucket Owner Enforced policies (ACLs disabled by default), while Cloudflare R2 does not implement ACL APIs at all. Our `storage.service.ts` gracefully handles ACL rejections.
> - **URL Addressing:** Zenko requires `forcePathStyle: true` (`http://localhost:9000/bucket/key`), AWS S3 uses virtual-host addressing (`https://bucket.s3.region.amazonaws.com/key`), and Cloudflare R2 uses account-specific endpoints (`https://<account-id>.r2.cloudflarestorage.com/bucket/key`).
> - **Presigned URLs:** All three support AWS SigV4 presigned download/upload URLs (default 300s expiry). Expiration is enforced by the storage engine on request.
> - **Data Egress:** AWS S3 incurs standard egress fees; Cloudflare R2 features zero data egress fees.

---

## 3. Quickstart & Local Development

### Prerequisites
- [Docker Desktop](https://www.docker.com/) running on Windows / macOS / Linux.
- [Node.js](https://nodejs.org/) v20+ LTS (or v24).
- npm v10+.

### Step 1: Clone & Configure Environment Variables
Copy the root `.env.example` to `.env` and `server/.env`:
```powershell
cp .env.example .env
cp .env.example server/.env
```

### Step 2: Start Containerized Infrastructure
```powershell
docker-compose up -d
```
Verify container health:
```powershell
docker-compose ps
```

### Step 3: Initialize Database Migrations
Run Prisma migration to initialize the baseline schema on PostgreSQL (port 5433):
```powershell
npm run prisma:migrate --prefix server
```

### Step 4: Run Development Services
You can run client, server, and background workers in separate terminal tabs:

**Terminal 1 — Backend Express Server:**
```powershell
npm run dev:server
# Server starts at http://localhost:5000
```

**Terminal 2 — Background BullMQ Worker:**
```powershell
npm run dev:worker
# Email worker starts and listens on transactional-email-queue
```

**Terminal 3 — Frontend React Client:**
```powershell
npm run dev:client
# Vite client starts at http://localhost:5173
```

### Frontend Demo Mode & Credentials
The frontend operates with mock support out of the box (`VITE_USE_MOCK=true`), making all pages, state transitions, signers, and wizards interactable immediately:
- **Default Login Email:** `alex@agree2met.com`
- **Default Password:** `Demo@1234`
- **Supported Roles:** Owner, Admin, Member, Viewer (switchable inside the workspace settings or mock seed)
- **Backend Toggle:** Set `VITE_USE_MOCK=false` in `client/.env` to switch from local mock store to live Express API (`http://localhost:5000/api/v1`).

---

## 4. Verification & Testing

### Diagnostic System Status UI
Navigate to [http://localhost:5173/status](http://localhost:5173/status) in your browser. The client invokes `GET /api/v1/health` and displays the live operational status of PostgreSQL, Redis, Storage, and SMTP.

### API Health Check Endpoint
```powershell
curl http://localhost:5000/api/v1/health
```
Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptimeSeconds": 42,
    "services": {
      "database": true,
      "redis": true,
      "storage": true,
      "smtp": true
    }
  },
  "message": "All system services operational."
}
```

### Enqueue Test Email (Requires CSRF Header)
```powershell
curl -X POST http://localhost:5000/api/v1/dev/test-email `
  -H "Content-Type: application/json" `
  -H "X-Requested-With: XMLHttpRequest" `
  -d '{"to": "user@example.com", "name": "Test User"}'
```
Inspect the delivered email in the Mailpit Web UI at [http://localhost:8025](http://localhost:8025).

### Automated Test Suites
Run all backend integration and unit tests:
```powershell
npm test --prefix server
```
Run all frontend component, lifecycle, and route smoke tests (92 tests passed across 4 suites):
```powershell
npm test --prefix client
```

### Frontend Application Routes & Living Showcase
The frontend Single Page Application is fully built with accessible CSS Modules and interactive mock services on branch `feat/frontend-ui`:

| Route | Description |
|---|---|
| `/` | Marketing landing page with value proposition, interactive mock preview, and SES legal notice |
| `/login` | Authentication page with one-click demo login autofill |
| `/register`, `/verify-email`, `/forgot-password`, `/reset-password` | Complete auth lifecycle screens |
| `/app/dashboard` | Executive KPI cards, sparklines, volume trends (`LineChart`), status breakdown (`DonutChart`), category distribution (`BarChart`), deadlines, and crypto integrity indicator |
| `/app/agreements` | Agreement repository with grid/table view toggle, search, status & category filters, bulk actions, and pagination |
| `/app/agreements/new` | 6-step creation wizard (Details, Parties, Terms with AI drafter, Milestones, Paper Review, Dispatch) |
| `/app/agreements/:id` | Agreement detail view with 7 tabs, including in-browser SHA-256 tamper-evident audit verifier and "Simulate Tamper" button |
| `/sign/:token` | Public guest signing portal with mandatory legal consent checkbox, signature canvas pad, and certificate generation |
| `/app/documents` | Storage utilization progress bar and central agreement documents repository |
| `/app/templates` | Standard legal template library with clause preview drawer and 1-click wizard launcher |
| `/app/deadlines` | Deadlines & reminders management with interactive `Calendar` view |
| `/app/notifications` | Real-time notification center with category filtering and unread tracking |
| `/app/analytics` | Contract lifecycle intelligence with RFC 4180 CSV export |
| `/app/ai` | Dedicated AI assistant hub with clause drafter, risk & obligation analyzer, and chat |
| `/app/team` | Team member roster, role badges, and invitation modal with RoleGuard |
| `/app/settings` | User profile, organization settings, password change, 2FA toggle, appearance theme toggle, and JSON backup export |
| `/dev/components` | Living accessible UI component library showcase |
| `/status` | Diagnostic system health probe calling backend `/api/v1/health` |

### Lint and Production Build
```powershell
npm run lint --prefix server
npm run build --prefix server
npm run lint --prefix client
npm run build --prefix client
```

---

## 5. Engineering Documentation Index

| Document | Purpose & Key Content | Direct File Link |
|---|---|---|
| **Project Requirements** | Detailed functional requirements for all 12 modules, user personas, non-functional requirements, and failure modes. | [PROJECT_REQUIREMENTS.md](file:///c:/Users/AnkitAccess/Agree2Met/PROJECT_REQUIREMENTS.md) |
| **System Architecture** | Multi-tier system architecture, Mermaid diagrams, tech stack evaluation, Puppeteer security, and security frameworks. | [SYSTEM_ARCHITECTURE.md](file:///c:/Users/AnkitAccess/Agree2Met/SYSTEM_ARCHITECTURE.md) |
| **Database Design** | Relational schema with 20 normalized application tables, Mermaid ERD, column constraints, indexing strategies, and seed plans. | [DATABASE_DESIGN.md](file:///c:/Users/AnkitAccess/Agree2Met/DATABASE_DESIGN.md) |
| **REST API Documentation** | Complete REST endpoint catalogue with OpenAPI-style request/response payloads, authentication, and error models. | [API_DOCUMENTATION.md](file:///c:/Users/AnkitAccess/Agree2Met/API_DOCUMENTATION.md) |
| **Implementation Roadmap** | 13-phase master execution plan (Phase 0 to 12) detailing scope, components, security, testing, and acceptance criteria. | [IMPLEMENTATION_ROADMAP.md](file:///c:/Users/AnkitAccess/Agree2Met/IMPLEMENTATION_ROADMAP.md) |
| **Technical Decisions (ADRs)** | 9 Architecture Decision Records detailing rationale for stack selections, security models, PDF generation, and AI guardrails. | [TECHNICAL_DECISIONS.md](file:///c:/Users/AnkitAccess/Agree2Met/TECHNICAL_DECISIONS.md) |
| **Development Progress** | Living project status matrix, Phase 1 deliverable inventory, verification results, and risk register. | [DEVELOPMENT_PROGRESS.md](file:///c:/Users/AnkitAccess/Agree2Met/DEVELOPMENT_PROGRESS.md) |
