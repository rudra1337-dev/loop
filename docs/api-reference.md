# REST API Reference

All requests accept and return JSON payloads unless specified otherwise (e.g., CSV upload or PDF export). Protected endpoints require authentication via an `httpOnly` session cookie (`token`) issued upon login.

---

## Table of Contents

1. [Authentication Endpoints (`/api/auth`)](#1-authentication-endpoints-apiauth)
2. [Workspace Endpoints (`/api/workspace`)](#2-workspace-endpoints-apiworkspace)
3. [Feedback Endpoints (`/api/feedback`)](#3-feedback-endpoints-apifeedback)
4. [Report Endpoints (`/api/reports`)](#4-report-endpoints-apireports)

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/signup`
Creates a new user account. Can either create a new workspace or join an existing workspace via an invite code.
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@acme.com",
    "password": "Password123!",
    "workspaceName": "Acme Corp",
    "inviteCode": ""
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": "usr_123",
      "name": "Jane Doe",
      "email": "jane@acme.com",
      "role": "ADMIN",
      "workspaceId": "wsp_456"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Email already registered, missing required fields, or invalid invite code.

---

### `POST /api/auth/login`
Authenticates a user and sets an `httpOnly` session cookie (`token`).
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@acme.com",
    "password": "Password123!"
  }
  ```
- **Success Response (200 OK)**: Sets `token` cookie.
  ```json
  {
    "user": {
      "id": "usr_123",
      "name": "Admin User",
      "email": "admin@acme.com",
      "role": "ADMIN",
      "workspaceId": "wsp_456"
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Invalid credentials.

---

### `POST /api/auth/logout`
Clears the session authentication cookie.
- **Auth**: Any Authenticated User
- **Request Body**: None
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

---

### `GET /api/auth/me`
Retrieves current session details for the logged-in user.
- **Auth**: Any Authenticated User
- **Request Body**: None
- **Success Response (200 OK)**:
  ```json
  {
    "user": {
      "id": "usr_123",
      "name": "Admin User",
      "email": "admin@acme.com",
      "role": "ADMIN",
      "workspaceId": "wsp_456"
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Session cookie missing or invalid.

---

### `GET /api/auth/google` & `GET /api/auth/google/callback`
Initiates Google OAuth 2.0 flow and handles callback redirect.
- **Auth**: Public

---

### `GET /api/auth/invite/:code`
Validates a workspace invitation code.
- **Auth**: Public
- **Success Response (200 OK)**:
  ```json
  {
    "invite": {
      "code": "INV-12345",
      "role": "ANALYST",
      "workspaceName": "Acme Corp",
      "expiresAt": "2026-12-31T23:59:59.000Z"
    }
  }
  ```

---

## 2. Workspace Endpoints (`/api/workspace`)

### `GET /api/workspace`
Retrieves details for the current user's workspace.
- **Auth**: Any Authenticated User
- **Success Response (200 OK)**:
  ```json
  {
    "workspace": {
      "id": "wsp_456",
      "name": "Acme Corp Demo Workspace",
      "createdAt": "2026-08-01T00:00:00.000Z"
    }
  }
  ```

---

### `PATCH /api/workspace`
Renames the workspace.
- **Auth**: `ADMIN` only
- **Request Body**:
  ```json
  {
    "name": "Acme Global Enterprise"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Workspace updated successfully",
    "workspace": {
      "id": "wsp_456",
      "name": "Acme Global Enterprise"
    }
  }
  ```
- **Error Responses**:
  - `403 Forbidden`: User role is not `ADMIN`.

---

### `GET /api/workspace/members`
Lists all members in the current workspace.
- **Auth**: Any Authenticated User
- **Success Response (200 OK)**:
  ```json
  {
    "members": [
      {
        "id": "usr_123",
        "name": "Admin User",
        "email": "admin@acme.com",
        "role": "ADMIN",
        "createdAt": "2026-08-01T00:00:00.000Z"
      }
    ]
  }
  ```

---

### `PATCH /api/workspace/members/:userId/role`
Updates a team member's role.
- **Auth**: `ADMIN` only
- **Request Body**:
  ```json
  {
    "role": "ANALYST"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Member role updated",
    "user": {
      "id": "usr_456",
      "role": "ANALYST"
    }
  }
  ```

---

### `DELETE /api/workspace/members/:userId`
Removes a member from the workspace.
- **Auth**: `ADMIN` only
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Member removed from workspace"
  }
  ```

---

### `POST /api/workspace/invites`
Generates a new workspace invite code.
- **Auth**: `ADMIN` only
- **Request Body**:
  ```json
  {
    "role": "ANALYST"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "message": "Invite generated",
    "invite": {
      "id": "inv_789",
      "code": "a1b2c3d4",
      "role": "ANALYST",
      "expiresAt": "2026-09-08T00:00:00.000Z"
    }
  }
  ```

---

### `GET /api/workspace/invites`
Lists active workspace invites.
- **Auth**: `ADMIN` only

---

### `DELETE /api/workspace/invites/:id`
Revokes an active invite.
- **Auth**: `ADMIN` only

---

## 3. Feedback Endpoints (`/api/feedback`)

### `GET /api/feedback`
Retrieves paginated feedback entries with multi-filter search.
- **Auth**: Any Authenticated User
- **Query Parameters**: `search`, `sentiment` (`POS`|`NEU`|`NEG`), `channel`, `status`, `themeId`, `startDate`, `endDate`, `page`, `limit`
- **Success Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "fb_001",
        "content": "The new dashboard filters are fast and intuitive!",
        "sentiment": "POS",
        "sentimentScore": 0.85,
        "channel": "In-App Survey",
        "status": "NEW",
        "createdAt": "2026-08-15T10:00:00.000Z",
        "Themes": [
          { "id": "thm_1", "name": "UI/UX & Usability" }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 125,
      "totalPages": 13
    }
  }
  ```

---

### `GET /api/feedback/stats`
Retrieves high-level aggregated analytics for charts and KPI cards.
- **Auth**: Any Authenticated User
- **Success Response (200 OK)**:
  ```json
  {
    "totalFeedback": 125,
    "sentimentBreakdown": { "POS": 65, "NEU": 30, "NEG": 30 },
    "topThemes": [
      { "id": "thm_1", "name": "UI/UX & Usability", "count": 42 }
    ],
    "statusBreakdown": { "NEW": 100, "IN_REVIEW": 15, "ACTIONED": 10 }
  }
  ```

---

### `GET /api/feedback/trends`
Retrieves time-series sentiment data aggregated over daily or weekly intervals.
- **Auth**: Any Authenticated User

---

### `GET /api/feedback/themes`
Lists all available theme categories for the tenant workspace.
- **Auth**: Any Authenticated User

---

### `POST /api/feedback/ask`
Ask LOOP RAG endpoint — answers natural language questions using vector search over workspace feedback.
- **Auth**: Any Authenticated User
- **Request Body**:
  ```json
  {
    "question": "What are customers saying about onboarding?"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "answer": "Customers generally appreciate the streamlined onboarding wizard, though some report confusion around setting up team invites.",
    "sources": [
      {
        "id": "fb_012",
        "content": "Onboarding wizard was super smooth!",
        "sentiment": "POS",
        "channel": "Zendesk",
        "similarity": 0.82
      }
    ],
    "hasEvidence": true,
    "followUp": "Would you like a breakdown of specific invite issues?"
  }
  ```

---

### `POST /api/feedback/ingest/single`
Ingests a single feedback item.
- **Auth**: `ADMIN` or `ANALYST`
- **Request Body**:
  ```json
  {
    "content": "Checkout failed twice during payment processing.",
    "channel": "Zendesk Support",
    "sentiment": "NEG"
  }
  ```

---

### `POST /api/feedback/ingest/csv`
Ingests feedback records from a CSV file upload.
- **Auth**: `ADMIN` or `ANALYST`
- **Content-Type**: `multipart/form-data` (`file` field containing CSV)

---

### `POST /api/feedback/ingest/channel`
Simulates batch ingestion from external channels (e.g. App Store, Email).
- **Auth**: `ADMIN` or `ANALYST`

---

### `POST /api/feedback/reclassify`
Triggers AI reclassification for a list of feedback IDs.
- **Auth**: `ADMIN` or `ANALYST`
- **Request Body**:
  ```json
  {
    "feedbackIds": ["fb_001", "fb_002"]
  }
  ```

---

### `PATCH /api/feedback/:id/status`
Updates status of a feedback item (`NEW`, `IN_REVIEW`, `ACTIONED`, `ARCHIVED`).
- **Auth**: `ADMIN` or `ANALYST`

---

### `DELETE /api/feedback/:id`
Deletes a feedback record.
- **Auth**: `ADMIN` or `ANALYST`

---

## 4. Report Endpoints (`/api/reports`)

### `GET /api/reports`
Lists generated Voice-of-Customer reports.
- **Auth**: Any Authenticated User

---

### `GET /api/reports/:id`
Retrieves a full report by ID.
- **Auth**: Any Authenticated User

---

### `GET /api/reports/:id/export`
Exports a generated report as a downloadable PDF document.
- **Auth**: Any Authenticated User
- **Response**: Binary stream (`application/pdf`)

---

### `POST /api/reports/generate`
Generates a new Voice-of-Customer report for a specified date range.
- **Auth**: `ADMIN` or `ANALYST`
- **Request Body**:
  ```json
  {
    "periodStart": "2026-08-01T00:00:00.000Z",
    "periodEnd": "2026-08-31T23:59:59.999Z"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "message": "Report generated successfully",
    "report": {
      "id": "rpt_100",
      "title": "Voice of Customer Report (Aug 1 - Aug 31, 2026)",
      "periodStart": "2026-08-01T00:00:00.000Z",
      "periodEnd": "2026-08-31T23:59:59.999Z",
      "metrics": { "totalFeedback": 125 },
      "narrative": {
        "executiveSummary": "...",
        "keyFindings": [],
        "actionItems": []
      }
    }
  }
  ```
