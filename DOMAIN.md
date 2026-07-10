# DOMAIN.md

Ubiquitous language for this codebase. Every entity, test label, UI string, API route, and database column uses the terms defined here.

Read at session start before writing any code, tests, or issue descriptions.

---

## Core Entities

### User

**What it is:** An individual with login credentials, an email address, and authentication state. Can own or be a member of Organizations.

**Relationships:**
- Has many Memberships (join table to Organization)
- Has many Notifications
- Has many AuditLogs

**Invariants:**
- Email is unique across all Users
- `is_active: false` prevents login and rejects tokens
- `is_verified: true` required for some operations (enforced by `VerifiedUser` dependency)
- Password stored as bcrypt hash, with SHA-256 pre-hash to bypass 72-char bcrypt limit

**Agent note:** `UserResponse` includes `organizations` — a computed list derived from `memberships[].organization`. The `get_by_id_with_orgs()` query eagerly loads memberships + orgs.

---

### Organization

**What it is:** The tenant/isolation boundary. A business entity with its own plan, members, invitations, and billing. All user-owned data belongs to an Organization.

**Relationships:**
- Has many Memberships
- Has many Invitations
- Has one Subscription (optional)
- Has many AuditLogs

**Invariants:**
- Slug is unique across all Organizations
- Every Organization starts on `PlanTier.FREE` at creation
- Plan tier can only change via Paystack transaction (checkout success) or webhook event
- Deleting an Organization cascades to Memberships, Invitations, Subscription

**Agent note:** The `Organization.id` appears in URL paths as `org_id`. Always validate membership before reading/updating org data by using `get_org_member()` or `_require_role()`.

---

### Membership

**What it is:** The join between a User and an Organization, carrying a role that defines access level. The authorization boundary.

**Relationships:**
- Belongs to one User
- Belongs to one Organization

**Invariants:**
- `(user_id, organization_id)` is unique — a User cannot have duplicate memberships
- Role hierarchy: `VIEWER(0) < MEMBER(1) < ADMIN(2) < OWNER(3)` — enforced numerically in `project.role_rank`
- Only an OWNER can change another OWNER's role or delete the organization
- Deleting a User or Organization cascades to their Memberships

**Agent note:** Never hardcode role strings. Use `MemberRole` enum values: `MemberRole.ADMIN`, etc. For role comparisons, use `MembershipPolicy.ensure_role(membership, MemberRole.ADMIN)` or the `require_org_role()` FastAPI dependency.

---

### Invitation

**What it is:** A pending invitation for someone to join an Organization with a specific role. The invitation token is sent via email (Resend).

**Relationships:**
- Belongs to one Organization

**Invariants:**
- Token stored hashed (SHA-256) in DB — plaintext token only sent in the email
- Status transitions: `PENDING → ACCEPTED | EXPIRED | REVOKED` (irreversible)
- Expires after `project.expiry.invitation_days` (default: 7 days)
- Cannot accept an invitation if the email on the invitation doesn't match the accepting user's email
- Cannot invite someone who is already a member or has a pending invitation

**Agent note:** The invitation flow: `invite_member()` creates an `Invitation` with `PENDING` status + hashed token, returns the raw token for the email. `accept_invitation()` hashes the submitted token and looks it up.

---

### Subscription

**What it is:** The Paystack subscription record for an Organization's paid plan. Ties a Paystack subscription_code to an Organization.

**Relationships:**
- Belongs to one Organization (one-to-one — `organization_id` is unique)

**Invariants:**
- `paystack_sub_code` is unique across all subscriptions
- Statuses: `ACTIVE`, `TRIALING`, `PAST_DUE`, `CANCELED`, `INCOMPLETE`
- `cancel_at_period_end: true` means the subscription will stop at current_period_end
- When canceled, the Organization's plan reverts to `FREE`

---

### Notification

**What it is:** An in-app notification for a User. Has read/unread state, a title, body, optional link, and optional metadata.

**Relationships:**
- Belongs to one User

**Invariants:**
- Notifications are scoped to a User, not an Organization
- `is_read: false` → unread. Setting `read_at` marks it read.
- Deleting a User cascades to their Notifications

---

### AuditLog

**What it is:** An immutable record of a sensitive action performed within an Organization. Used for compliance and debugging.

**Relationships:**
- Belongs to one User (optional — may be null for system actions)
- Belongs to one Organization (optional — may be null)

**Invariants:**
- Append-only — never update or delete entries
- `action` is a dotted string: `org.member_invited`, `org.created`, `auth.login`, etc.
- Records `ip_address`, `user_agent`, and `meta` (JSON) for traceability

---

### PlanTier

**Enum values:** `FREE`, `PRO`, `ENTERPRISE`

**Plan limits defined in `project.plan_limits`:**

| Limit | FREE | PRO | ENTERPRISE |
|-------|------|-----|------------|
| max_members | 5 | 50 | unlimited |
| max_projects | 3 | unlimited | unlimited |
| audit_log_retention_days | 7 | 90 | 365 |
| mfa_required | no | no | yes |
| sso_enabled | no | no | yes |
| priority_support | no | yes | yes |

---

### MemberRole

**Enum values (ascending rank):** `VIEWER(0)`, `MEMBER(1)`, `ADMIN(2)`, `OWNER(3)`

| Role | Can manage members | Can invite | Can delete org |
|------|-------------------|------------|----------------|
| VIEWER | no | no | no |
| MEMBER | no | no | no |
| ADMIN | yes (except OWNERs) | yes | no |
| OWNER | yes | yes | yes |

---

### InvitationStatus

**Enum values:** `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`

### SubscriptionStatus

**Enum values:** `ACTIVE`, `TRIALING`, `PAST_DUE`, `CANCELED`, `INCOMPLETE`

### OAuthProvider

**Enum values:** `LOCAL`, `GOOGLE`, `GITHUB`

Default is `LOCAL`. OAuth users have `is_verified: true` set at registration.

---

## Key Operations (Verbs)

| Verb | Domain meaning | Usage |
|------|----------------|-------|
| register | Create a new User account with email + password | `AuthService.register()` |
| login | Authenticate with credentials, return tokens | `AuthService.login()` |
| refresh | Exchange a refresh token for a new token pair | `AuthService.refresh()` |
| verify-email | Confirm email address via token | `AuthService.verify_email()` |
| invite | Send an invitation to join an Organization | `OrganizationService.invite_member()` |
| accept | Join an Organization by accepting an invitation | `OrganizationService.accept_invitation()` |
| initialize | Begin a Paystack checkout for a plan upgrade | `BillingService.initialize_transaction()` |
| verify | Confirm a Paystack payment and sync the plan | `BillingService.verify_transaction()` |

---

## Glossary

| Term | Definition |
|------|------------|
| ULID | Universally Unique Lexicographically Sortable Identifier — 26-char string PK, sortable, URL-safe |
| Paystack | Nigerian payment gateway used for billing (replaces Stripe in this boilerplate) |
| structlog | Structured logging library used throughout the backend |
| snake_case | Naming convention for API JSON keys (backend returns, frontend validates via `snakeCaseSchema()`) |
| TokenStore | Interface for auth token persistence — different implementations per client (localStorage for web, chrome.storage for extension) |
| Extension | A Chrome Extension app in this monorepo, sharing auth, API client, and schemas with the web app |
