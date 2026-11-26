# AGREE2MET — REST API Documentation & Endpoint Catalogue

**Document Version:** 1.0.0  
**Phase:** Phase 0 — API Architecture & Interface Contracts  
**Protocol:** HTTPS / RESTful JSON  
**Base URL:** `/api/v1`  
**Status:** Draft — Awaiting User Approval  

---

## 1. Global API Conventions

### 1.1 Response Formats
All API responses follow a uniform JSON envelope:

#### Success Response Envelope (HTTP 200, 201)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully.",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8
  }
}
```

#### Error Response Envelope (HTTP 4xx, 5xx)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The provided agreement data is invalid.",
    "details": [
      {
        "field": "expirationDate",
        "issue": "Expiration date must be strictly after the effective date."
      }
    ]
  },
  "timestamp": "2026-11-26T06:45:00.000Z"
}
```

### 1.2 Authentication, Session Delivery & CSRF Defense
- **Tokens Delivered Exclusively via HttpOnly Cookies:**  
  Authentication tokens (`jwt_access`, `jwt_refresh`) are transported **strictly via `HttpOnly`, `Secure`, `SameSite=Strict` cookies**. Tokens are never transmitted in JSON response bodies or URL query parameters. Browser clients do not use Bearer authorization headers.
- **CSRF Defense Strategy:**  
  All state-modifying requests (`POST`, `PUT`, `PATCH`, `DELETE`) require the custom header:  
  `X-Requested-With: XMLHttpRequest`  
  Additionally, a double-submit CSRF cookie (`X-CSRF-Token`) is validated on mutating operations.
- **SameSite Deployment Context:**  
  Assumes that the client application (`app.agree2met.com`) and API (`api.agree2met.com`) are deployed on same-site domains. Deep links from transactional emails (e.g. `/sign/:token`) initiate standard top-level browser GET navigation to the frontend SPA, which then issues same-site API queries with custom headers.
- **Hashed Token Resolution:**  
  All endpoints accepting authentication or invitation tokens (e.g., password reset, email verification, guest signing) compute the SHA-256 hash of the incoming token before querying the database (`verification_token_hash`, `password_reset_token_hash`, `invitation_token_hash`). Plaintext tokens are never stored or logged.
- **No Sensitive Tokens in URL Query Strings:**  
  URLs must never include sensitive access tokens or secret keys in query parameters (such as `?token=...`), which leak via browser history, proxy server logs, and HTTP Referer headers. Document downloads use authenticated endpoints or short-lived, single-use signed download tickets.

---

## 2. Comprehensive Endpoint Index

| Module | Method | Endpoint Path | Description | Access Control |
|---|---|---|---|---|
| **System** | `GET` | `/health` | Health check verifying DB, Redis & S3 | Public |
| **Auth** | `POST` | `/auth/register` | Register new user account | Public |
| **Auth** | `POST` | `/auth/login` | Authenticate & issue HttpOnly JWT cookies | Public |
| **Auth** | `POST` | `/auth/logout` | Revoke active session & clear cookies | Authenticated |
| **Auth** | `POST` | `/auth/refresh-token` | Rotate refresh token cookie & issue new access cookie | Public (Cookie) |
| **Auth** | `GET` | `/auth/sessions` | List all active sessions for current user | Authenticated |
| **Auth** | `DELETE`| `/auth/sessions/:id` | Revoke specific session by ID | Authenticated |
| **Auth** | `GET` | `/auth/google` | Initiate Google OAuth 2.0 OIDC flow | Public |
| **Auth** | `GET` | `/auth/google/callback` | Handle Google OAuth callback & set cookies | Public |
| **Auth** | `POST` | `/auth/verify-email` | Verify email address using token | Public |
| **Auth** | `POST` | `/auth/forgot-password` | Request password reset email | Public |
| **Auth** | `POST` | `/auth/reset-password` | Submit new password using reset token | Public |
| **Auth** | `GET` | `/auth/me` | Fetch authenticated user profile & memberships | Authenticated |
| **Users** | `GET` | `/users/profile` | Retrieve detailed user profile & settings | Authenticated |
| **Users** | `PUT` | `/users/profile` | Update profile information | Authenticated |
| **Users** | `POST` | `/users/avatar` | Upload user profile avatar (Phase 1 S3) | Authenticated |
| **Users** | `PUT` | `/users/password` | Change account password | Authenticated |
| **Users** | `GET` | `/users/notification-preferences`| Retrieve notification preference toggles | Authenticated |
| **Users** | `PUT` | `/users/notification-preferences`| Update notification preference toggles | Authenticated |
| **Users** | `POST` | `/users/export-data` | Request complete JSON archive of personal data | Authenticated |
| **Users** | `DELETE`| `/users/account` | Request account deletion with safeguard checks | Authenticated |
| **Orgs** | `GET` | `/organizations` | List organizations user belongs to | Authenticated |
| **Orgs** | `POST` | `/organizations` | Create new organization workspace | Authenticated |
| **Orgs** | `GET` | `/organizations/:id/members` | List organization team members | Org Admin |
| **Orgs** | `POST` | `/organizations/:id/members` | Invite new member to organization | Org Admin |
| **Orgs** | `POST` | `/organizations/invitations/accept` | Accept an organization team invite | Authenticated |
| **Categories**| `GET` | `/categories` | List system & organization agreement categories | Authenticated |
| **Categories**| `POST` | `/categories` | Create custom agreement category | Org Admin |
| **Categories**| `GET` | `/categories/:id` | Get details of a single category | Authenticated |
| **Categories**| `PUT` | `/categories/:id` | Update custom category details | Org Admin |
| **Categories**| `DELETE`| `/categories/:id` | Delete custom category (if unused) | Org Admin |
| **Dashboard** | `GET` | `/dashboard/stats` | Retrieve aggregate KPI metrics | Authenticated |
| **Dashboard** | `GET` | `/dashboard/activity` | Retrieve recent activity stream | Authenticated |
| **Dashboard** | `GET` | `/dashboard/deadlines` | Retrieve agreements with upcoming deadlines | Authenticated |
| **Agreements**| `GET` | `/agreements` | Paginated list with filtering & search | Authenticated |
| **Agreements**| `POST` | `/agreements` | Create draft agreement (Wizard save) | Authenticated |
| **Agreements**| `GET` | `/agreements/:id` | Get full agreement details, clauses, parties | Authenticated |
| **Agreements**| `PUT` | `/agreements/:id` | Update agreement details and clauses (Drafts only)| Creator / Admin |
| **Agreements**| `PATCH`| `/agreements/:id/status` | Execute state transition (Send, Cancel) | Creator / Admin |
| **Agreements**| `POST` | `/agreements/:id/duplicate`| Clone existing agreement into a new draft | Authenticated |
| **Agreements**| `POST` | `/agreements/:id/archive` | Archive agreement (hide from active views) | Creator / Admin |
| **Agreements**| `POST` | `/agreements/:id/unarchive` | Unarchive agreement | Creator / Admin |
| **Agreements**| `DELETE`| `/agreements/:id` | Delete draft agreement (Draft only, no audit) | Creator / Admin |
| **Agreements**| `GET` | `/agreements/:id/pdf` | Stream or download compiled PDF | Authenticated |
| **Agreements**| `GET` | `/agreements/:id/audit` | Fetch complete tamper-evident audit trail | Authenticated |
| **Parties** | `POST` | `/agreements/:id/parties/:partyId/invite` | Send initial invitation email to participant | Creator / Admin |
| **Parties** | `POST` | `/agreements/:id/parties/:partyId/resend-invite` | Resend invitation email | Creator / Admin |
| **Parties** | `DELETE`| `/agreements/:id/parties/:partyId/invite` | Revoke invitation token | Creator / Admin |
| **Documents** | `POST` | `/agreements/:id/documents` | Upload supplementary document attachment | Creator / Admin |
| **Documents** | `GET` | `/agreements/:id/documents` | List all documents and versions for agreement | Authenticated |
| **Documents** | `GET` | `/agreements/:id/documents/:docId/download` | Get authenticated short-lived download URL | Authenticated |
| **Documents** | `DELETE`| `/agreements/:id/documents/:docId` | Delete supplementary attachment | Creator / Admin |
| **Versions** | `GET` | `/agreements/:id/versions` | List snapshot version history | Authenticated |
| **Versions** | `GET` | `/agreements/:id/versions/:versionNumber` | Get snapshot payload for specific version | Authenticated |
| **Signing** | `GET` | `/signing/invitation/:token` | Validate token & fetch agreement for signing | Public (Hashed) |
| **Signing** | `POST` | `/signing/consent` | Record affirmative electronic consent | Public (Hashed) |
| **Signing** | `POST` | `/signing/sign` | Submit electronic signature | Public (Hashed) |
| **Signing** | `POST` | `/signing/decline` | Decline agreement with reason | Public (Hashed) |
| **Reminders** | `GET` | `/agreements/:id/reminders` | List scheduled reminders for agreement | Creator / Admin |
| **Reminders** | `POST` | `/agreements/:id/reminders` | Schedule manual reminder for pending party | Creator / Admin |
| **Reminders** | `DELETE`| `/reminders/:id` | Cancel a scheduled reminder | Creator / Admin |
| **Notifications**|`GET`| `/notifications` | List user in-app notifications | Authenticated |
| **Notifications**|`PATCH`| `/notifications/:id/read` | Mark single notification as read | Authenticated |
| **Notifications**|`POST`| `/notifications/read-all`| Mark all notifications as read | Authenticated |
| **AI** | `GET` | `/ai/conversations` | List user AI assistant conversation threads | Authenticated |
| **AI** | `GET` | `/ai/conversations/:id` | Get message history for conversation thread | Authenticated |
| **AI** | `DELETE`| `/ai/conversations/:id` | Delete conversation thread | Authenticated |
| **AI** | `POST` | `/ai/draft-clause` | Generate legal clause from prompt | Authenticated |
| **AI** | `POST` | `/ai/explain-clause`| Translate legalese clause into plain English| Authenticated |
| **AI** | `POST` | `/ai/summarize` | Executive summary of agreement terms | Authenticated |
| **AI** | `POST` | `/ai/review-risks` | Identify missing standard clauses & risks | Authenticated |

---

## 3. Detailed Request / Response Payloads (Sample Contracts)

### 3.1 Health Check

#### `GET /api/v1/health`
- **Access Control:** Public
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-11-26T06:50:00.000Z",
    "services": {
      "database": "connected",
      "redis": "connected",
      "storage": "connected"
    }
  },
  "message": "All system services operational."
}
```
- **Error Codes:** `503 Service Unavailable` if PostgreSQL, Redis, or S3 connection fails.

---

### 3.2 Authentication & Sessions

#### `POST /api/v1/auth/login`
- **Access Control:** Public
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "email": "alex.rivera@example.com",
  "password": "SecurePassword!2026"
}
```
- **Response Headers:**  
  `Set-Cookie: jwt_access=eyJhbGciOi...; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900`  
  `Set-Cookie: jwt_refresh=sec_rf_...; Path=/api/v1/auth; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "c1f7b0a2-8923-4c91-b384-5a7e112d83b1",
      "email": "alex.rivera@example.com",
      "displayName": "Alex Rivera",
      "avatarUrl": "avatars/c1f7b0a2.jpg",
      "isEmailVerified": true
    },
    "organization": {
      "id": "e4b2d8c1-1234-4567-89ab-cdef01234567",
      "name": "Rivera Consulting",
      "role": "OWNER"
    }
  },
  "message": "Authentication successful. Session established."
}
```
- **Error Codes:** `400 Bad Request` (Invalid input), `401 Unauthorized` (Invalid credentials), `429 Too Many Requests` (Rate limit exceeded).

#### `GET /api/v1/auth/sessions`
- **Access Control:** Authenticated
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "b3e2a1d0-9988-7766-5544-33221100aabb",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "ipAddress": "192.168.1.105",
      "isCurrentSession": true,
      "createdAt": "2026-11-26T05:30:00.000Z",
      "expiresAt": "2026-12-03T05:30:00.000Z"
    }
  ]
}
```

#### `DELETE /api/v1/auth/sessions/:id`
- **Access Control:** Authenticated
- **Response Body (200 OK):**
```json
{
  "success": true,
  "message": "Session revoked successfully."
}
```
- **Error Codes:** `404 Not Found`, `403 Forbidden` (Cannot revoke another user's session).

---

### 3.3 Public Digital Signing Portal

#### `GET /api/v1/signing/invitation/:token`
- **Access Control:** Public (Token resolved by SHA-256 hash lookup in database)
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "agreement": {
      "id": "f8e7d6c5-b4a3-2109-8765-fedcba987654",
      "title": "Master Services Agreement - Q3 Development",
      "creatorName": "Alex Rivera",
      "status": "AWAITING_SIGNATURES",
      "expirationDate": "2026-12-15",
      "clauses": [
        {
          "sectionNumber": "1.0",
          "title": "Scope of Work",
          "content": "Contractor shall provide software design and engineering services."
        }
      ],
      "paymentTerms": {
        "totalAmount": 15000.00,
        "currency": "USD"
      }
    },
    "signer": {
      "partyId": "9a8b7c6d-5e4f-3a2b-1c0d-ef9876543210",
      "name": "TechVentures Global Inc.",
      "email": "procurement@techventures.com",
      "hasConsent": false
    }
  }
}
```
- **Error Codes:** `404 Not Found` (Invalid or expired token), `410 Gone` (Agreement already completed, expired, or cancelled).

#### `POST /api/v1/signing/sign`
- **Access Control:** Public (Token resolved via SHA-256 hash)
- **Request Headers:** `Content-Type: application/json`, `X-Requested-With: XMLHttpRequest`
- **Request Body:**
```json
{
  "token": "sec_tok_89fa32bc10de7890fe",
  "signatureType": "DRAWN",
  "signatureData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "typedSignatureText": null,
  "consentAcknowledged": true,
  "consentStatement": "I consent to transact electronically and to apply my electronic signature to this document."
}
```
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "SIGNED",
    "signedAt": "2026-11-26T06:55:30.123Z",
    "allSignersCompleted": true,
    "downloadUrl": "/api/v1/agreements/f8e7d6c5-b4a3-2109-8765-fedcba987654/documents/doc-executed/download"
  },
  "message": "Signature verified and recorded successfully."
}
```
- **Error Codes:** `400 Bad Request` (Missing consent or signature payload), `409 Conflict` (Simultaneous signing race detected; transaction aborted and rolled back), `410 Gone` (Agreement expired).

---

### 3.4 AI Agreement Assistant

#### `POST /api/v1/ai/explain-clause`
- **Access Control:** Authenticated
- **Request Headers:** `Content-Type: application/json`, `X-Requested-With: XMLHttpRequest`
- **Request Body:**
```json
{
  "clauseText": "Each party shall indemnify, defend, and hold harmless the other party and its officers, directors, employees, and agents from and against any third-party claims arising out of gross negligence or willful misconduct."
}
```
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": "Both parties agree to cover legal costs and liabilities if sued by a third party because of intentional wrongdoing or extreme recklessness.",
    "keyObligations": [
      "Pay legal fees if a lawsuit occurs due to your intentional misconduct.",
      "Cover damages if proven grossly negligent."
    ],
    "riskLevel": "MODERATE",
    "disclaimer": "Disclaimer: Agree2Met AI provides informational assistance only and does not constitute formal legal advice. Consult licensed legal counsel."
  }
}
```
- **Error Codes:** `400 Bad Request` (Empty clause), `429 Too Many Requests` (AI usage quota reached), `503 Service Unavailable` (Upstream AI provider error).
