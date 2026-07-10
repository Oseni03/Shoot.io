---
labels: ready-for-agent
---

## Parent

[PRD: Chrome Extension Boilerplate](../prd/chrome-extension-boilerplate.md)

## What to build

The options page (accessible from right-click → Options or extension management) provides a full settings surface for the extension. It uses a full-height sidebar navigation layout matching the web app's dashboard pattern.

**Layout:** A sidebar on the left spanning the full viewport height. Content area on the right. Sidebar items: Profile, Organization, Billing, Logout. Sidebar highlights the active section.

**Profile section:**
- Shows user's name, email, avatar
- Read-only for now (editing comes later — out of scope for this PRD)

**Organization section:**
- Shows the user's current Organization name, plan tier (FREE/PRO/ENTERPRISE), and member count
- Shows a link to the web app's organization settings page (opens in a new tab)
- If the user has multiple Organizations, shows an org switcher dropdown

**Billing section:**
- Shows a link: "Manage billing →" that opens the web app's billing management page in a new tab
- Shows the current plan name and its key limits (member count, project count)
- No billing UI inside the extension — this is purely a navigation aid

**Logout:**
- Logout button in the sidebar footer section (like the web app's nav-user dropdown)
- Sends `LOGOUT` to the service worker, clears tokens, switches popup to login form

**Service worker additions:** `LOGOUT` (already in 001), `GET_ME` (already in 001), `API_REQUEST` for fetching org details.

Options page communicates with the service worker using the same `chrome.runtime.sendMessage` pattern as the popup.

## Risk

`Normal` — no database, no billing, no migrations.

## Acceptance criteria

- [ ] Options page loads with a full-height sidebar
- [ ] Sidebar shows Profile, Organization, Billing, and Logout items
- [ ] Clicking a sidebar item switches the content area without page reload
- [ ] Profile section shows the user's name, email, and avatar
- [ ] Organization section shows the current org name, plan tier, and member count
- [ ] If user has multiple orgs, an org switcher is present and switching orgs updates the content
- [ ] Billing section shows current plan limits and a link to the web app's billing page
- [ ] Billing link opens in a new tab
- [ ] Logout button clears the token and switches both popup and options to logged-out state
- [ ] Closing and reopening options page shows logged-in state if tokens are still valid

## Blocked by

[001 — Extension scaffold + login flow](./001-extension-scaffold-login.md) — the service worker and shared `AuthService` must exist first.
