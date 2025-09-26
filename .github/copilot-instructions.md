# Copilot Instructions for AI Coding Agents

## Project Overview

- This is a Next.js app (App Router) for a multi-role education platform (admin, student, teacher).
- Major features: authentication, role-based dashboards, payments (Paystack), profile management, and request/session workflows.
- Code is organized by role and feature under `src/app/`, with shared UI/components in `src/components/`.

## Architecture & Data Flow

- **App structure:**
  - `src/app/` contains Next.js routes, grouped by role (`dashboard/admin`, `dashboard/student`, `dashboard/teacher`).
  - API routes (e.g., `src/app/api/paystack/webhook/route.js`) handle backend logic.
  - Shared UI and logic live in `src/components/` and `src/lib/`.
- **Auth:**
  - Custom authentication flows per role (`auth/login`, `auth/signup`, etc.).
  - Deactivated users redirected via `auth/deactivated/`.
- **Payments:**
  - Paystack integration in `utils/payments/paystack.js` and API route.
- **Supabase:**
  - Used for database and auth, with client/server helpers in `utils/supabase/`.

## Developer Workflows

- **Start dev server:** `npm run dev` (see README)
- **No explicit test or build scripts found; add if needed.**
- **Debugging:**
  - Use Next.js error overlays and inspect API route logs.
- **Styling:**
  - Uses PostCSS (`postcss.config.mjs`) and global styles in `src/app/globals.css`.

## Project-Specific Patterns

- **Role-based routing:**
  - Each dashboard is isolated by role, with nested routes for features (e.g., `dashboard/admin/requests/[id]`).
- **Component conventions:**
  - UI components in `src/components/ui/` follow atomic design (button, input, card, etc.).
  - Feature components are grouped by domain (e.g., `dashboard/`, `admin/`).
- **API integration:**
  - External services (Paystack, Supabase) are wrapped in `utils/` for reusability.
- **Error handling:**
  - Auth errors surfaced via `AuthErrorAlert.jsx`.

## Integration Points

- **Paystack:** Payment processing and webhook handling.
- **Supabase:** Auth and database operations.
- **Vercel:** Deployment target (see README).

## Examples

- To add a new student dashboard feature, create a route under `src/app/dashboard/student/` and UI in `src/components/`.
- For a new payment provider, add logic to `utils/payments/` and a corresponding API route.

---

**If any conventions or workflows are unclear, please provide feedback so this guide can be improved.**
