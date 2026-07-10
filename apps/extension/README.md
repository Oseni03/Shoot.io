# Resumio Chrome Extension

React 19 Chrome extension built with WXT. Popup + Options page + Service Worker.

## Development

```bash
# From repo root
npm install
npm run dev        # starts all apps (API, web, extension)

# Or from apps/extension/
npm run dev        # wxt dev — HMR, loads in Chrome as unpacked
```

The extension loads from `.output/chrome-mv3/` as an unpacked extension.

## Loading in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select `.output/chrome-mv3/`
5. The extension icon appears in the toolbar

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | WXT dev server (HMR) |
| `npm run test` | Vitest run |
| `npm run lint` | Biome check |
| `npm run build` | Production build |
| `npx tsc --noEmit` | TypeScript type-check |

## Environment

Copy `.env.example` to `.env`:

```
VITE_API_URL=http://localhost:8000/api/v1
VITE_FRONTEND_URL=http://localhost:3000
```

## Architecture

- **Service worker** (`src/entrypoints/background.ts`) — owns all API calls (bypasses CORS). Popup and options communicate via `chrome.runtime.sendMessage`.
- **Popup** (`src/entrypoints/popup/`) — login, register, MFA, logout.
- **Options page** (`src/entrypoints/options/`) — profile, org switcher, billing links.

Auth tokens stored in `chrome.storage.local`. Token refresh runs on a 15-minute `chrome.alarms` interval.
