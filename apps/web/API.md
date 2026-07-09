# API Contract — Express SaaS Frontend

## Base

| Property      | Value                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------- |
| Base URL      | `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api/v1`)                                      |
| Content-Type  | `application/json`                                                                                  |
| Auth header   | `Authorization: bearer <access_token>`                                                              |
| Token storage | `access_token` in localStorage + cookie (SameSite=Strict, 7d); `refresh_token` in localStorage only |

## Key Convention

The frontend sends camelCase JSON, but expects snake_case JSON in responses. All responses are validated through `snakeCaseSchema()`, a `z.preprocess` that recursively converts camelCase keys to snake_case before parsing. Example: `{ "createdAt": "..." }` on the wire becomes `{ "created_at": "..." }` for validation.

## Enums

| Enum               | Values                                                    |
| ------------------ | --------------------------------------------------------- |
| `MemberRole`       | `"viewer"` \| `"member"` \| `"admin"` \| `"owner"`        |
| `PlanTier`         | `"free"` \| `"pro"` \| `"enterprise"`                     |
| `InvitationStatus` | `"pending"` \| `"accepted"` \| `"expired"` \| `"revoked"` |

## Pagination

Endpoints that accept pagination use params `?page=1&page_size=20` or `?limit=20&offset=0`. Default page size is 20, max is 100.

---

## Auth — `/auth/*`

### POST `/auth/register`

**Request:**

```json
{
	"email": "user@example.com",
	"password": "Str0ngPass!",
	"full_name": "Jane Doe"
}
```

Password rules: min 8 / max 128 chars, requires ≥1 uppercase, ≥1 digit.

**Response (201):** `RegisterResponse`

```json
{
	"access_token": "eyJ...",
	"refresh_token": "eyJ...",
	"token_type": "bearer",
	"user": {
		"id": "uuid",
		"email": "user@example.com",
		"full_name": "Jane Doe",
		"avatar_url": null,
		"is_verified": false,
		"is_active": true,
		"mfa_enabled": false,
		"created_at": "2026-07-04T12:00:00Z"
	}
}
```

### POST `/auth/login`

**Request:**

```json
{
	"email": "user@example.com",
	"password": "Str0ngPass!"
}
```

**Response (200) — no MFA:**

```json
{
	"access_token": "eyJ...",
	"refresh_token": "eyJ...",
	"token_type": "bearer",
	"user": {
		"id": "uuid",
		"email": "user@example.com",
		"full_name": "Jane Doe",
		"avatar_url": null,
		"is_verified": true,
		"is_active": true,
		"mfa_enabled": false,
		"created_at": "2026-07-04T12:00:00Z",
		"organizations": []
	}
}
```

**Response (200) — MFA enabled:** `MfaPendingResponse`

```json
{
	"mfa_pending": "eyJ...",
	"expires_in": 300
}
```

The frontend redirects to `/mfa/challenge?pending_token=<mfa_pending>` when this is received. After the user provides a valid TOTP code, call `POST /mfa/validate`.

### POST `/auth/refresh`

**Request:**

```json
{
	"refresh_token": "eyJ..."
}
```

**Response (200):** `TokenPair`

### POST `/auth/logout`

**Request:**

```json
{
	"refresh_token": "eyJ..."
}
```

**Response (204):** No body.

### POST `/auth/verify-email`

**Request:**

```json
{
	"token": "verification-token-string"
}
```

**Response (200):** `UserResponse`

### POST `/auth/forgot-password`

**Request:**

```json
{
	"email": "user@example.com"
}
```

**Response (200):**

```json
{
	"message": "If the email exists, a reset link has been sent."
}
```

### POST `/auth/reset-password`

**Request:**

```json
{
	"token": "reset-token-string",
	"new_password": "NewStr0ng!Pass"
}
```

**Response (200):** `UserResponse`

### GET `/auth/me`

**Headers:** `Authorization: bearer <token>`

**Response (200):** `UserResponse` (includes `organizations` array)

---

## User Profile — `/users/*`

### GET `/users/me`

Returns `UserResponse`.

### PATCH `/users/me`

**Request:**

```json
{
	"full_name": "New Name",
	"avatar_url": "https://example.com/avatar.png"
}
```

Both fields nullable/optional.

**Response (200):** `UserResponse`

### POST `/users/me/change-password`

**Request:**

```json
{
	"current_password": "OldPass123!",
	"new_password": "NewPass456!"
}
```

**Response (204):** No body.

### DELETE `/users/me`

**Response (204):** No body.

---

## Shared Response Shapes

**`UserResponse`:**

```json
{
	"id": "uuid",
	"email": "user@example.com",
	"full_name": "Jane Doe",
	"avatar_url": null,
	"is_verified": true,
	"is_active": true,
	"mfa_enabled": false,
	"created_at": "2026-07-04T12:00:00Z",
	"organizations": [
		{
			"id": "uuid",
			"name": "Acme Corp",
			"slug": "acme-corp",
			"logo_url": null,
			"plan": "FREE",
			"role": "OWNER",
			"created_at": "2026-07-04T12:00:00Z"
		}
	]
}
```

**`MembershipOrgResponse`:** (org with user's membership role — used in `UserResponse.organizations`, login, and `/auth/me`)

```json
{
	"id": "uuid",
	"name": "Acme Corp",
	"slug": "acme-corp",
	"logo_url": null,
	"plan": "FREE",
	"role": "OWNER",
	"created_at": "2026-07-04T12:00:00Z"
}
```

**`OrgResponse`:** (standalone org, no role)

```json
{
	"id": "uuid",
	"name": "Acme Corp",
	"slug": "acme-corp",
	"logo_url": null,
	"plan": "FREE",
	"created_at": "2026-07-04T12:00:00Z"
}
```

**`MembershipResponse`:**

```json
{
	"user_id": "uuid",
	"organization_id": "uuid",
	"role": "admin",
	"created_at": "2026-07-04T12:00:00Z",
	"name": "Jane Doe",
	"email": "jane@example.com",
	"avatar_url": "https://..."
}
```

**`InvitationResponse`:**

```json
{
	"id": "uuid",
	"organization_id": "uuid",
	"email": "invited@example.com",
	"status": "pending",
	"expires_at": "2026-07-11T12:00:00Z"
}
```

**`NotificationResponse`:**

```json
{
	"id": "uuid",
	"title": "Welcome!",
	"body": "Thanks for joining.",
	"link": null,
	"is_read": false,
	"read_at": null,
	"meta": null,
	"created_at": "2026-07-04T12:00:00Z"
}
```

**`NotificationListResponse`:**

```json
{
	"items": [
		/* NotificationResponse[] */
	],
	"unread_count": 1
}
```

---

## Organizations — `/organizations/*`

### POST `/organizations/`

**Request:**

```json
{
	"name": "Acme Corp"
}
```

**Response (201):** `OrgResponse`

### GET `/organizations/`

**Response (200):** Array of `OrgResponse`

### GET `/organizations/:orgId`

**Response (200):** `OrgResponse`

### PATCH `/organizations/:orgId`

**Request:**

```json
{
	"name": "Acme Corp Rebranded",
	"logo_url": "https://example.com/logo.png"
}
```

Both optional/nullable.

**Response (200):** `OrgResponse`

### DELETE `/organizations/:orgId`

**Response (204):** No body.

### GET `/organizations/:orgId/members`

**Response (200):** Array of `MembershipResponse`

### DELETE `/organizations/:orgId/members/:userId`

**Response (200):**

```json
{
	"message": "Member removed successfully"
}
```

### PATCH `/organizations/:orgId/members/:userId`

**Request:**

```json
{
	"role": "admin"
}
```

**Response (200):** `MembershipResponse`

### GET `/organizations/:orgId/invitations`

**Response (200):** Array of `InvitationResponse`

### POST `/organizations/:orgId/invitations`

**Request:**

```json
{
	"email": "invited@example.com",
	"role": "member"
}
```

Role defaults to `"member"`.

**Response (200):**

```json
{
	"message": "Invitation sent successfully"
}
```

### DELETE `/organizations/:orgId/invitations/:invitationId`

**Response (200):**

```json
{
	"message": "Invitation revoked"
}
```

### POST `/organizations/invitations/accept`

**Request:**

```json
{
	"token": "invitation-token-string"
}
```

**Response (200):** `OrgResponse`

---

## MFA — `/mfa/*`

All endpoints require auth.

### POST `/mfa/setup`

**Response (200):**

```json
{
	"secret": "JBSWY3DPEHPK3PXP",
	"otpauth_url": "otpauth://totp/...",
	"message": "Scan this QR code with your authenticator app"
}
```

### POST `/mfa/verify`

**Request:**

```json
{
	"code": "123456"
}
```

**Response (204):** No body.

### POST `/mfa/disable`

**Request:**

```json
{
	"code": "123456"
}
```

**Response (204):** No body.

### POST `/mfa/validate`

Used during login when MFA is enabled (after `/auth/login` challenges with MFA).

**Request:**

```json
{
	"code": "123456",
	"mfa_pending": "eyJ..."
}
```

`mfa_pending` is the token received from `POST /auth/login` when MFA is enabled.

**Response (200):** `TokenPair`

```json
{
	"access_token": "eyJ...",
	"refresh_token": "eyJ...",
	"token_type": "bearer"
}
```

After receiving `TokenPair`, the frontend stores tokens and calls `GET /auth/me` to fetch user profile + organizations, then redirects to `/dashboard`.

---

### MFA Challenge Flow (Frontend)

1. `POST /auth/login` returns `MfaPendingResponse`
2. Frontend redirects to `/mfa/challenge?pending_token=<token>`
3. User enters 6-digit TOTP code
4. `POST /mfa/validate` with `{ code, mfa_pending }` returns `TokenPair`
5. Tokens stored in localStorage + cookie
6. `GET /auth/me` fetches user + organizations
7. Cache seeded, redirect to `/dashboard`

---

## Billing — `/billing/*`

### GET `/billing/verify?reference=paystack-ref`

**Response (200):**

```json
{
	"plan": "PRO",
	"organization_id": "uuid"
}
```

### POST `/billing/organizations/:orgId/initialize`

**Request:**

```json
{
	"plan": "pro",
	"callback_url": "https://app.example.com/billing/callback"
}
```

**Response (200):**

```json
{
	"authorization_url": "https://checkout.paystack.com/..."
}
```

### GET `/billing/organizations/:orgId/manage`

**Response (200):**

```json
{
	"manage_url": "https://paystack.com/..."
}
```

### POST `/billing/organizations/:orgId/cancel`

**Response (204):** No body.

---

## Notifications — `/notifications/*`

### GET `/notifications/?limit=20&offset=0`

**Response (200):** `NotificationListResponse`

### POST `/notifications/:id/read`

**Response (204):** No body.

### POST `/notifications/mark-all-read`

**Response (204):** No body.

---

## Admin — `/admin/*`

All endpoints require auth with admin role.

### GET `/admin/stats`

**Response (200):**

```json
{
	"user": {
		"total": 150,
		"verified": 120
	},
	"organizations": {
		"total": 45
	}
}
```

### GET `/admin/users?page=1&page_size=20&search=&is_active=true`

**Response (200):** Array of `UserResponse`

### GET `/admin/organizations?page=1&page_size=20&search=`

**Response (200):** Array of `OrgResponse`

### PATCH `/admin/users/:userId/deactivate`

**Response (200):** `UserResponse`

### PATCH `/admin/users/:userId/activate`

**Response (200):** `UserResponse`

---

## OAuth — `/auth/oauth/*`

| Provider | OAuth URL                                      | Callback URL                                             |
| -------- | ---------------------------------------------- | -------------------------------------------------------- |
| Google   | `GET /auth/oauth/google` → redirects to Google | `GET /auth/oauth/google/callback?code=...` → `TokenPair` |
| GitHub   | `GET /auth/oauth/github` → redirects to GitHub | `GET /auth/oauth/github/callback?code=...` → `TokenPair` |

---

## Health — `/health`, `/ready`

### GET `/health`

```json
{ "status": "ok", "app": "express-saas" }
```

### GET `/ready`

```json
{ "status": "ok" }
```

---

## Error Response Format

The frontend expects error bodies to match this shape:

```json
{
	"error": "Human-readable error message",
	"detail": "More specific detail (fallback field)",
	"message": "Alternative message field (tertiary fallback)",
	"code": "MACHINE_READABLE_CODE",
	"fields": {
		"email": ["Email is already registered."],
		"password": ["Password must contain at least one uppercase letter."]
	}
}
```

### Status → Error Class Mapping

| HTTP Status                 | Frontend Class        | Default `code`             |
| --------------------------- | --------------------- | -------------------------- |
| (no response/network error) | `AuthNetworkError`    | `NETWORK`                  |
| 401                         | `AuthSessionError`    | `UNAUTHORIZED`             |
| 400, 422, 409, 429          | `AuthValidationError` | `VALIDATION`               |
| any other                   | `AuthValidationError` | body's `code` or `UNKNOWN` |

All error classes extend `AuthError`:

```
AuthError { name, message, status, code }
AuthNetworkError { cause }     // status=0
AuthValidationError { fields? }  // per-field error map
AuthSessionError {}             // status=401
```

### 401 Handling

The Axios response interceptor clears all tokens and redirects to `/login` if the current page is not public. There is **no automatic token refresh** in the interceptor — the app uses `authService.refreshIfNeeded()` proactively.

### Network Error Retry

The `useMe` query retries network errors (status=0) up to 2 times.

---

## `snakeCaseSchema` — Key Architectural Detail

Every API response passes through `snakeCaseSchema(Schema)` before Zod validation. This preprocess step:

1. Recursively walks the entire response object
2. Converts every camelCase key to snake_case: `"createdAt"` → `"created_at"`, `"isVerified"` → `"is_verified"`
3. Validates against the Zod schema (which uses snake_case fields)

**The backend MUST use snake_case in JSON responses.** If the backend returns camelCase keys, they pass straight through to a Zod schema expecting snake_case, causing validation failures.
