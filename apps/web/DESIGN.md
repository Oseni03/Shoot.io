# Design System

## Typography

| Role               | Font               | CSS Variable     |
| ------------------ | ------------------ | ---------------- |
| Display / headings | Manrope (variable) | `--font-display` |
| Body / sans        | Inter (variable)   | `--font-sans`    |
| Technical labels   | System monospace   | `font-mono`      |

Loaded via `next/font/google` in `src/app/layout.tsx`. Usage: `font-display` for headings, `font-sans` for body copy, `font-mono` for uppercase technical labels (auth forms, tags).

---

## Color System

Base radius: `0.25rem` (4px) — squared-off aesthetic.

### Light mode (`:root`)

| Token                      | Value     |
| -------------------------- | --------- |
| `--background`             | `#ffffff` |
| `--foreground`             | `#0a0a0a` |
| `--card`                   | `#ffffff` |
| `--card-foreground`        | `#0a0a0a` |
| `--popover`                | `#ffffff` |
| `--popover-foreground`     | `#0a0a0a` |
| `--primary`                | `#4f46e5` |
| `--primary-foreground`     | `#ffffff` |
| `--secondary`              | `#f5f5f5` |
| `--secondary-foreground`   | `#0a0a0a` |
| `--muted`                  | `#f5f5f5` |
| `--muted-foreground`       | `#737373` |
| `--accent`                 | `#f5f5f5` |
| `--accent-foreground`      | `#0a0a0a` |
| `--destructive`            | `#ef4444` |
| `--destructive-foreground` | `#ffffff` |
| `--border`                 | `#e5e5e5` |
| `--input`                  | `#e5e5e5` |
| `--ring`                   | `#4f46e5` |

### Dark mode (`.dark`)

| Token                      | Value     |
| -------------------------- | --------- |
| `--background`             | `#0a0a0a` |
| `--foreground`             | `#f5f5f5` |
| `--card`                   | `#1a1a1a` |
| `--card-foreground`        | `#f5f5f5` |
| `--popover`                | `#1a1a1a` |
| `--popover-foreground`     | `#f5f5f5` |
| `--primary`                | `#818cf8` |
| `--primary-foreground`     | `#0a0a0a` |
| `--secondary`              | `#1a1a1a` |
| `--secondary-foreground`   | `#f5f5f5` |
| `--muted`                  | `#1a1a1a` |
| `--muted-foreground`       | `#a3a3a3` |
| `--accent`                 | `#1a1a1a` |
| `--accent-foreground`      | `#f5f5f5` |
| `--destructive`            | `#fca5a5` |
| `--destructive-foreground` | `#0a0a0a` |
| `--border`                 | `#262626` |
| `--input`                  | `#262626` |
| `--ring`                   | `#818cf8` |

---

## Theme mechanism

- `ThemeProvider` in `src/contexts/theme-control.tsx` toggles `.dark` class on `<html>`.
- All token values live in `src/app/globals.css` as CSS custom properties.
- Dark mode variant: `@custom-variant dark (&:is(.dark *))` (Tailwind v4).
- No runtime inline styles — the JS-driven theme layer only manages class toggling and persists user preference (`localStorage`).

---

## Component architecture

- **shadcn/ui** New York style — components in `src/components/ui/`.
- **Radix UI** primitives wrapped with `cn()` from `src/lib/utils.ts`.
- **CVA** (`class-variance-authority`) for component variants (button, badge, etc.).
- **Icons**: lucide-react.
- **Toast**: Sonner (`<Toaster />` in root layout).
- **Animation**: `tw-animate-css` for enter/exit, framer-motion for sequence animations.
- **Forms**: react-hook-form + Zod + shadcn Form wrapper.

---

## Conventions

- **No explicit borders** — prefer background-tone separation (e.g., `bg-muted` over `border`). Use `bg-card` / `bg-muted` for card-like surfaces.
- **`data-slot`** attributes on all shadcn components for testing and styling hooks.
- **`cn()`** from `clsx` + `tailwind-merge` for all conditional class merging.
- **Auth page aesthetic**: technical/monospaced — `font-mono`, `text-[10px]`, uppercase, `tracking-widest`, squared inputs (`rounded-none`).
- **Font-display** on all major headings.

---

## File locations

| Asset                         | Path                                                      |
| ----------------------------- | --------------------------------------------------------- |
| Global CSS + tokens           | `src/app/globals.css`                                     |
| Theme context                 | `src/contexts/theme-control.tsx`                          |
| Utility (cn, snakeCaseSchema) | `src/lib/utils.ts`                                        |
| shadcn config                 | `components.json`                                         |
| UI components                 | `src/components/ui/`                                      |
| Tailwind config               | `globals.css` `@theme` block (no JS config — Tailwind v4) |
