# AGREE2MET — Digital Agreement Management SaaS Platform

[![Phase](https://img.shields.io/badge/Phase-1%20Foundation%20%26%20Infrastructure-success.svg)](file:///c:/Users/AnkitAccess/Agree2Met/IMPLEMENTATION_ROADMAP.md)
[![Status](https://img.shields.io/badge/Status-Phase%201%20Complete%20%E2%80%94%20Verified-brightgreen.svg)](file:///c:/Users/AnkitAccess/Agree2Met/DEVELOPMENT_PROGRESS.md)
[![Architecture](https://img.shields.io/badge/Architecture-Decoupled%20Multi--Tier-orange.svg)](file:///c:/Users/AnkitAccess/Agree2Met/SYSTEM_ARCHITECTURE.md)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20CSS%20Modules-61dafb.svg)](file:///c:/Users/AnkitAccess/Agree2Met/TECHNICAL_DECISIONS.md#adr-002)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20(LTS)%20%2B%20Express%20%2B%20TypeScript-339933.svg)](file:///c:/Users/AnkitAccess/Agree2Met/TECHNICAL_DECISIONS.md#adr-001)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2016%20%2B%20Prisma%20ORM-336791.svg)](file:///c:/Users/AnkitAccess/Agree2Met/DATABASE_DESIGN.md)

---

## 1. Product Overview & System Architecture

**Agree2Met** is an enterprise-oriented digital agreement management SaaS platform designed to govern the entire lifecycle of legal agreements and digital contracts—from guided multi-party creation, structured term definition, and draft collaboration, to electronic signature collection, automated expiration monitoring, and tamper-evident document archiving.

### Core Architecture Highlights:
- **Decoupled Architecture:** React 18 client (`client/`) powered by Vite and pure CSS Modules (no Tailwind/PostCSS), communicating via cookie-authenticated REST API with Express 4 TypeScript backend (`server/`).
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
| **S3 Storage** | `agree2met-storage` | **9000** | 8000 | S3 API endpoint (Bucket: `agree2met-dev`) |
| **Mailpit SMTP** | `agree2met-mailpit` | **1025** | 1025 | Local SMTP catcher port |
| **Mailpit UI** | `agree2met-mailpit` | **8025** | 8025 | Web inspection UI for dispatched emails |
| **Express API** | Host Node Process | **5000** | 5000 | Backend REST API (`/api/v1`) |
| **React Client** | Host Vite Process | **5173** | 5173 | Frontend Single Page Application |

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
Run all frontend component and API client tests:
```powershell
npm test --prefix client
```

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
