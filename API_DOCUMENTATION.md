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
  Authentication tokens (`access_token`, `refresh_token`) are transported **strictly via `HttpOnly`, `SameSite=Strict` cookies** (`Secure` in production). Tokens are never transmitted in JSON response bodies or URL query parameters. Browser clients do not use Bearer authorization headers.
  - `access_token`: 15-minute lifetime, `HttpOnly`, `SameSite=Strict`, `Path=/`.
  - `refresh_token`: 14-day rolling lifetime, `HttpOnly`, `SameSite=Strict`, `Path=/api/v1/auth`. Enforces token family reuse detection: using a previously-rotated token revokes all active sessions in the family immediately.
  - `csrf_token`: 14-day lifetime, `HttpOnly: false` (accessible to client JavaScript), `SameSite=Strict`, `Path=/`.
- **CSRF Defense Strategy:**  
  All state-modifying requests (`POST`, `PUT`, `PATCH`, `DELETE`) require the custom header:  
  `X-Requested-With: XMLHttpRequest`  
  Additionally, a double-submit CSRF token (`X-CSRF-Token`) matching the `csrf_token` cookie is validated on mutating operations.
- **SameSite Deployment Context:**  
  Assumes that the client application (`app.agree2met.com`) and API (`api.agree2met.com`) are deployed on same-site domains. Deep links from transactional emails (e.g. `/sign/:token`, `/verify-email?token=...`) initiate standard top-level browser GET navigation to the frontend SPA, which then issues same-site API queries with custom headers.
- **Hashed Token Resolution:**  
  All endpoints accepting authentication or invitation tokens (e.g., password reset, email verification, guest signing) compute the SHA-256 hash of the incoming token before querying the database (`verification_token_hash`, `password_reset_token_hash`, `invitation_token_hash`, `refresh_token_hash`). Plaintext tokens are never stored or logged.
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
| **Categories**| `GET` | `/agreement-categories` | List system & organization agreement categories | Authenticated |
| **Categories**| `POST` | `/categories` | Create custom agreement category | Org Admin |
| **Categories**| `GET` | `/categories/:id` | Get details of a single category | Authenticated |
| **Categories**| `PUT` | `/categories/:id` | Update custom category details | Org Admin |
| **Categories**| `DELETE`| `/categories/:id` | Delete custom category (if unused) | Org Admin |
| **Dashboard** | `GET` | `/dashboard/stats` | Retrieve aggregate KPI metrics (total, running, deltas) | Authenticated |
| **Dashboard** | `GET` | `/dashboard/activity` | Retrieve recent activity stream (cursor pagination) | Authenticated |
| **Dashboard** | `GET` | `/dashboard/deadlines` | Retrieve agreements with upcoming deadlines | Authenticated |
| **Dashboard** | `GET` | `/dashboard/recent` | Retrieve latest agreements created | Authenticated |
| **Analytics** | `GET` | `/analytics/overview` | Time series, distributions, percentiles, financial totals | Authenticated |
| **Analytics** | `GET` | `/analytics/export.csv` | Stream RFC 4180 CSV with formula injection defense | Authenticated |
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

#### `POST /api/v1/auth/register`
- **Access Control:** Public
- **Request Headers:** `Content-Type: application/json`, `X-Requested-With: XMLHttpRequest`
- **Request Body:**
```json
{
  "email": "alex.rivera@example.com",
  "password": "SecurePassword!2026",
  "firstName": "Alex",
  "lastName": "Rivera",
  "organizationName": "Rivera Consulting"
}
```
- **Response Body (201 Created):**
```json
{
  "success": true,
  "data": {
    "message": "If this email is not already registered, a verification link has been sent."
  }
}
```
- **Anti-Enumeration:** Always returns the same 201 message even if the email already exists.
- **Error Codes:** `400 Bad Request` (Password < 10 characters or too common).

#### `POST /api/v1/auth/login`
- **Access Control:** Public
- **Request Headers:** `Content-Type: application/json`, `X-Requested-With: XMLHttpRequest`
- **Request Body:**
```json
{
  "email": "alex.rivera@example.com",
  "password": "SecurePassword!2026"
}
```
- **Response Headers:**  
  `Set-Cookie: access_token=eyJhbGciOi...; Path=/; HttpOnly; SameSite=Strict; Max-Age=900`  
  `Set-Cookie: refresh_token=sec_rf_...; Path=/api/v1/auth; HttpOnly; SameSite=Strict; Max-Age=1209600`  
  `Set-Cookie: csrf_token=...; Path=/; SameSite=Strict; Max-Age=1209600`
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "c1f7b0a2-8923-4c91-b384-5a7e112d83b1",
      "email": "alex.rivera@example.com",
      "isEmailVerified": true,
      "profile": {
        "displayName": "Alex Rivera",
        "avatarUrl": "https://..."
      }
    }
  },
  "message": "Authentication successful. Session established."
}
```
- **Security Protections:**
  - Tokens are never returned in JSON response bodies.
  - Progressive lockout: 5 consecutive failed attempts lock the account for 15 minutes (`423 ACCOUNT_LOCKED`).
  - Unverified email accounts are blocked (`403 EMAIL_NOT_VERIFIED`).

#### `POST /api/v1/auth/refresh-token`
- **Access Control:** Public (requires `refresh_token` cookie and `X-CSRF-Token` header)
- **Response Headers:** Rotates `access_token` and `refresh_token` cookies with new cryptographically generated tokens in the same family.
- **Token Family Reuse Detection:** If a previously-rotated refresh token is presented again (indicating token compromise), all active sessions in the token family are immediately revoked and the request is rejected with `401 REFRESH_TOKEN_REUSE_DETECTED`.

#### `POST /api/v1/auth/verify-email`
- **Access Control:** Public
- **Request Headers:** `Content-Type: application/json`, `X-Requested-With: XMLHttpRequest`
- **Request Body:** `{ "token": "raw_hex_token_from_email" }`
- **Response Body (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully. You may now log in."
}
```
- **Error Codes:** `400 Bad Request` (Invalid or expired token).

#### `POST /api/v1/auth/resend-verification`
- **Access Control:** Public
- **Request Headers:** `Content-Type: application/json`, `X-Requested-With: XMLHttpRequest`
- **Request Body:** `{ "email": "alex.rivera@example.com" }`
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "If this email exists and is not verified, a new link has been sent."
  }
}
```
- **Anti-Enumeration:** Uniform response regardless of whether the email exists.

#### `POST /api/v1/auth/forgot-password`
- **Access Control:** Public
- **Request Headers:** `Content-Type: application/json`, `X-Requested-With: XMLHttpRequest`
- **Request Body:** `{ "email": "alex.rivera@example.com" }`
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "If an account exists with this email, a password reset link has been sent."
  }
}
```
- **Anti-Enumeration:** Uniform response regardless of whether the email exists.

#### `POST /api/v1/auth/reset-password`
- **Access Control:** Public
- **Request Headers:** `Content-Type: application/json`, `X-Requested-With: XMLHttpRequest`
- **Request Body:**
```json
{
  "token": "raw_hex_token_from_email",
  "password": "NewStrongPassword!2026"
}
```
- **Response Body (200 OK):**
```json
{
  "success": true,
  "message": "Password has been successfully reset. All existing sessions have been revoked."
}
```
- **Security Protections:** Enforces password minimum 10 characters and common-password blacklist check. All existing sessions in `user_sessions` are revoked immediately.

#### `POST /api/v1/auth/logout`
- **Access Control:** Authenticated
- **Response Headers:** Clears `access_token`, `refresh_token`, and `csrf_token` cookies (`Max-Age=0`).
- **Response Body (200 OK):**
```json
{
  "success": true,
  "message": "Session terminated successfully."
}
```

#### `GET /api/v1/auth/me`
- **Access Control:** Authenticated
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "c1f7b0a2-8923-4c91-b384-5a7e112d83b1",
    "email": "alex.rivera@example.com",
    "isEmailVerified": true,
    "profile": {
      "displayName": "Alex Rivera",
      "avatarUrl": "https://..."
    },
    "organization": {
      "id": "e4b2d8c1-1234-4567-89ab-cdef01234567",
      "name": "Acme Corporation",
      "role": "OWNER"
    }
  }
}
```

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

### 3.3 Users & Account Management

#### `GET /api/v1/users/profile`
- **Access Control:** Authenticated
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "c1f7b0a2-8923-4c91-b384-5a7e112d83b1",
    "email": "alex.rivera@example.com",
    "displayName": "Alex Rivera",
    "avatarUrl": "https://...",
    "jobTitle": "Lead Legal Counsel",
    "phoneNumber": "+1-555-0199",
    "timezone": "America/New_York",
    "dateFormat": "YYYY-MM-DD",
    "language": "en"
  }
}
```

#### `PUT /api/v1/users/profile`
- **Access Control:** Authenticated
- **Request Body:**
```json
{
  "displayName": "Alex Rivera, Esq.",
  "jobTitle": "General Counsel",
  "phoneNumber": "+1-555-0199",
  "timezone": "America/New_York",
  "dateFormat": "MM/DD/YYYY",
  "language": "en"
}
```
- **Response Body (200 OK):** Returns updated user profile.

#### `POST /api/v1/users/avatar`
- **Access Control:** Authenticated
- **Content-Type:** `multipart/form-data` (field: `avatar`)
- **Constraints:** Maximum 2MB, allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://..."
  },
  "message": "Avatar uploaded successfully."
}
```

#### `PUT /api/v1/users/password`
- **Access Control:** Authenticated
- **Request Body:**
```json
{
  "currentPassword": "OldPassword!2026",
  "newPassword": "NewStrongPassword!2026"
}
```
- **Response Body (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully."
}
```
- **Validation:** Verifies current password, enforces min 10 characters and blacklist on new password.

#### `POST /api/v1/users/export-data`
- **Access Control:** Authenticated (Account Data Export)
- **Response Body (200 OK):** JSON containing user profile, session history, organization memberships, and active agreement references.

#### `DELETE /api/v1/users/account`
- **Access Control:** Authenticated
- **Request Body:**
```json
{
  "confirmation": "DELETE",
  "password": "SecurePassword!2026"
}
```
- **Sole-Owner Protection:** If the user is the sole owner of an organization with active members, deletion is blocked with `400 SOLE_OWNER_CANNOT_DELETE` until ownership is transferred.

---

### 3.4 Organizations & Team Management

#### `GET /api/v1/organizations`
- **Access Control:** Authenticated
- **Response Body (200 OK):** List of organizations the authenticated user belongs to with role (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`).

#### `POST /api/v1/organizations`
- **Access Control:** Authenticated
- **Request Body:** `{ "name": "New Venture LLC" }`
- **Response Body (201 Created):** Creates organization and assigns creator as `OWNER`.

#### `GET /api/v1/organizations/:id`
- **Access Control:** Authenticated (Member of organization)
- **Response Body (200 OK):** Organization details and member count.

#### `GET /api/v1/organizations/:id/members`
- **Access Control:** Authenticated (Member of organization)
- **Response Body (200 OK):** List of active members with user profiles and roles, plus pending invitations.

#### `POST /api/v1/organizations/:id/members`
- **Access Control:** Org Owner or Admin
- **Request Body:**
```json
{
  "email": "teammate@example.com",
  "role": "MEMBER"
}
```
- **Response Body (201 Created):** Dispatches transactional invitation email with secure token.

#### `PATCH /api/v1/organizations/:id/members/:memberId`
- **Access Control:** Org Owner or Admin
- **Request Body:** `{ "role": "ADMIN" | "MEMBER" | "VIEWER" }`
- **Hierarchy Protection:**
  - Admins cannot demote or remove Owners (`403 INSUFFICIENT_PERMISSIONS`).
  - The last Owner of an organization cannot be demoted (`400 CANNOT_DEMOTE_LAST_OWNER`).

#### `DELETE /api/v1/organizations/:id/members/:memberId`
- **Access Control:** Org Owner or Admin
- **Hierarchy Protection:**
  - Admins cannot remove Owners (`403 INSUFFICIENT_PERMISSIONS`).
  - The last Owner cannot be removed (`400 CANNOT_REMOVE_LAST_OWNER`).

#### `POST /api/v1/organizations/invitations/accept`
- **Access Control:** Public or Authenticated
- **Request Body:** `{ "token": "raw_invitation_token" }`
- **Response Body (200 OK):** Adds user to organization with specified role and marks invitation accepted.

#### `POST /api/v1/organizations/:id/invitations/:invitationId/resend`
- **Access Control:** Org Owner or Admin
- **Response Body (200 OK):** Re-issues invitation email with refreshed token expiry.

#### `DELETE /api/v1/organizations/:id/invitations/:invitationId`
- **Access Control:** Org Owner or Admin
- **Response Body (200 OK):** Revokes pending invitation.

---

### 3.5 Dashboard Endpoints

#### `GET /api/v1/dashboard/stats`
- **Access Control:** Authenticated (Member of Organization)
- **Description:** Single-query SQL aggregation calculating KPI counts, rates, turnaround durations, and month-over-month deltas.
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 62,
    "completed": 16,
    "running": 23,
    "pendingSignatures": 10,
    "expired": 4,
    "completionRate": 25.8,
    "avgTurnaroundHours": 42.4,
    "deltas": {
      "totalDeltaPercent": 8.5,
      "completedDeltaPercent": 14.2,
      "runningDeltaPercent": -3.1
    }
  },
  "message": "Dashboard statistics retrieved successfully."
}
```

#### `GET /api/v1/dashboard/activity`
- **Access Control:** Authenticated (Member of Organization)
- **Query Parameters:**
  - `limit` (optional, integer 1-50, default: 20)
  - `type` (optional, string: `ALL`, `AGREEMENT`, `SIGNATURE`, `SYSTEM`, default: `ALL`)
  - `cursor` (optional, ISO datetime string for cursor pagination)
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "e4f8d9c2-...",
        "action": "AGREEMENT_SIGNED",
        "entityType": "AGREEMENT",
        "entityId": "a1b2c3d4-...",
        "metadata": {
          "title": "Master Services Agreement",
          "signerName": "Sarah Jenkins"
        },
        "createdAt": "2026-11-27T14:30:00.000Z",
        "user": {
          "id": "u1v2w3x4-...",
          "email": "sarah@partner.com",
          "name": "Sarah Jenkins"
        }
      }
    ],
    "nextCursor": "2026-11-26T18:15:00.000Z",
    "hasMore": true
  },
  "message": "Activity stream retrieved successfully."
}
```

#### `GET /api/v1/dashboard/deadlines`
- **Access Control:** Authenticated (Member of Organization)
- **Query Parameters:**
  - `days` (optional, integer 1-90, default: 14)
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "windowDays": 14,
    "count": 3,
    "deadlines": [
      {
        "id": "a1b2c3d4-...",
        "referenceNumber": "ACM-2026-012",
        "title": "Vendor Supply Agreement",
        "status": "AWAITING_SIGNATURES",
        "expirationDate": "2026-12-05",
        "daysRemaining": 8,
        "isOverdue": false,
        "counterpartyName": "Apex Logistics"
      }
    ]
  },
  "message": "Upcoming deadlines retrieved successfully."
}
```

#### `GET /api/v1/dashboard/recent`
- **Access Control:** Authenticated (Member of Organization)
- **Query Parameters:**
  - `limit` (optional, integer 1-20, default: 5)
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "agreements": [
      {
        "id": "a1b2c3d4-...",
        "referenceNumber": "ACM-2026-062",
        "title": "Independent Contractor Agreement",
        "status": "DRAFT",
        "category": { "name": "Contractor", "slug": "contractor" },
        "createdAt": "2026-11-27T10:00:00.000Z",
        "updatedAt": "2026-11-27T10:00:00.000Z"
      }
    ]
  },
  "message": "Recent agreements retrieved successfully."
}
```

---

### 3.6 Analytics Engine Endpoints

#### `GET /api/v1/analytics/overview`
- **Access Control:** Authenticated (Member of Organization)
- **Query Parameters:**
  - `from` (optional, ISO datetime string)
  - `to` (optional, ISO datetime string)
  - `granularity` (optional, `day` | `week` | `month` | `quarter`, default: `month`)
- **Description:** Complete analytical aggregation computed in PostgreSQL using `generate_series`, conditional filters, and `PERCENTILE_CONT(0.5)`. Zero-fills time series intervals.
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "timeRange": {
      "from": "2025-11-27T00:00:00.000Z",
      "to": "2026-11-27T23:59:59.999Z",
      "granularity": "month"
    },
    "summary": {
      "totalCreated": 62,
      "totalCompleted": 16,
      "totalValue": 2772000,
      "currency": "USD"
    },
    "timeSeries": [
      {
        "intervalStart": "2026-01-01T00:00:00.000Z",
        "createdCount": 4,
        "completedCount": 2,
        "totalValue": 180000
      }
    ],
    "statusDistribution": [
      { "status": "COMPLETED", "count": 16, "percentage": 25.8 },
      { "status": "AWAITING_SIGNATURES", "count": 10, "percentage": 16.1 }
    ],
    "categoryDistribution": [
      { "categoryName": "Non-Disclosure Agreement (NDA)", "categorySlug": "nda", "count": 12, "percentage": 19.4 }
    ],
    "turnaroundMetrics": {
      "avgTurnaroundHours": 42.4,
      "medianTurnaroundHours": 32.5,
      "p75TurnaroundHours": 55.0,
      "p90TurnaroundHours": 78.2
    },
    "signerMetrics": {
      "avgSignerResponseHours": 20.2,
      "fastestSignerResponseHours": 1.5,
      "totalSignaturesRecorded": 48
    }
  },
  "message": "Analytics overview retrieved successfully."
}
```

#### `GET /api/v1/analytics/export.csv`
- **Access Control:** Authenticated (Member of Organization)
- **Description:** Streams RFC 4180 compliant CSV file containing agreement metadata, financial terms, and execution timestamps.
- **Response Headers:**
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="agree2met-analytics-YYYY-MM-DD.csv"`
- **Formula Injection Defense:** Any cell value starting with `=`, `+`, `-`, `@`, `\t`, or `\r` is prepended with a single quote `'` to prevent remote code execution or formula injection in Excel/Calc.

---

### 3.7 Agreements & Categories Read Endpoints

#### `GET /api/v1/agreement-categories`
- **Access Control:** Authenticated (Member of Organization)
- **Description:** Returns all system default categories and organization-specific custom categories, annotated with agreement counts.
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat-uuid...",
        "name": "Non-Disclosure Agreement (NDA)",
        "slug": "nda",
        "description": "Standard mutual or unilateral non-disclosure agreement.",
        "iconName": "Shield",
        "isSystemDefault": true,
        "agreementCount": 12
      }
    ]
  },
  "message": "Agreement categories retrieved successfully."
}
```

#### `GET /api/v1/agreements`
- **Access Control:** Authenticated (Member of Organization)
- **Query Parameters:**
  - `page` (optional, integer >= 1, default: 1)
  - `limit` (optional, integer 1-100, default: 20)
  - `status` (optional, comma-separated or single enum: `DRAFT`, `COMPLETED`, etc.)
  - `categoryId` (optional, UUID)
  - `search` (optional, text search against title or reference number)
  - `sortBy` (optional: `createdAt`, `title`, `status`, `expirationDate`, default: `createdAt`)
  - `sortOrder` (optional: `asc` | `desc`, default: `desc`)
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "agreements": [
      {
        "id": "a1b2c3d4-...",
        "referenceNumber": "ACM-2026-001",
        "title": "Master Services Agreement - Alpha",
        "status": "COMPLETED",
        "category": { "id": "...", "name": "Master Services Agreement (MSA)", "slug": "msa" },
        "creator": { "id": "...", "displayName": "Alex Rivera", "email": "alex@acme.com" },
        "effectiveDate": "2026-01-15",
        "expirationDate": "2027-01-15",
        "completedAt": "2026-01-18T10:00:00.000Z",
        "totalSignersCount": 2,
        "completedSignersCount": 2,
        "paymentTerms": { "totalAmount": 75000, "currency": "USD" },
        "createdAt": "2026-01-15T09:00:00.000Z",
        "updatedAt": "2026-01-18T10:00:00.000Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 62,
    "totalPages": 4
  },
  "message": "Agreements retrieved successfully."
}
```

#### `GET /api/v1/agreements/:id`
- **Access Control:** Authenticated (Member of Organization)
- **Description:** Returns full agreement detail including counterparties, clauses, financial payment terms, and the complete cryptographically verified SHA-256 audit trail.
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "agreement": {
      "id": "a1b2c3d4-...",
      "referenceNumber": "ACM-2026-001",
      "title": "Master Services Agreement - Alpha",
      "status": "COMPLETED",
      "category": { "name": "Master Services Agreement (MSA)", "slug": "msa" },
      "parties": [
        {
          "id": "p1...",
          "name": "Jane Doe",
          "email": "jane@partner.com",
          "role": "SIGNER",
          "status": "SIGNED",
          "signedAt": "2026-01-18T09:30:00.000Z"
        }
      ],
      "clauses": [
        {
          "sectionNumber": "1.0",
          "title": "Scope of Engagement",
          "content": "Full scope description..."
        }
      ],
      "paymentTerms": {
        "totalAmount": 75000,
        "currency": "USD",
        "paymentSchedule": "MILESTONE"
      },
      "auditTrail": [
        {
          "id": "evt-1...",
          "eventType": "AGREEMENT_CREATED",
          "actorType": "USER",
          "actorName": "Alex Rivera",
          "actorEmail": "alex@acme.com",
          "previousEventHash": "0000000000000000000000000000000000000000000000000000000000000000",
          "eventHash": "a5e8f...",
          "createdAt": "2026-01-15T09:00:00.000Z"
        }
      ]
    }
  },
  "message": "Agreement retrieved successfully."
}
```

---

### 3.8 Safe Write Guards (Deferred Phase 5 Endpoints)

Unbuilt agreement mutation endpoints are guarded with typed HTTP 501 responses to prevent unintended writes or data corruption prior to Phase 5:
- `POST /api/v1/agreements` (Agreement creation wizard)
- `PUT /api/v1/agreements/:id` (Agreement edit)
- `PATCH /api/v1/agreements/:id/status` (State transitions)
- `POST /api/v1/agreements/:id/duplicate` (Clone agreement)
- `POST /api/v1/agreements/:id/archive` (Archive agreement)
- `POST /api/v1/agreements/:id/unarchive` (Unarchive agreement)
- `DELETE /api/v1/agreements/:id` (Delete draft agreement)

#### Response Envelope (HTTP 501 Not Implemented):
```json
{
  "success": false,
  "error": {
    "code": "NOT_AVAILABLE_YET",
    "message": "Agreement mutation operations are scheduled for Phase 5 (Agreement Creation Engine). Read operations are fully available.",
    "details": [
      { "operation": "create", "availableInPhase": "Phase 5" }
    ]
  },
  "timestamp": "2026-11-27T18:00:00.000Z"
}
```

---

### 3.9 Public Digital Signing Portal

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

### 3.6 AI Agreement Assistant

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
