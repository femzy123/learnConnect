# Operating Prompt (Live Handoff)
**Updated:** 2025-09-29 17:12 UTC

You are continuing development of **LearnConect** (Next.js 15 App Router, Supabase, shadcn/ui, Paystack).
Keep responses concise, code first, and explain only the overview unless more detail is requested.

## Product Snapshot
- Students create *requests* for learning help.
- Admin invites teachers; teachers submit *proposals* (fee, duration).
- Student accepts a proposal → a *session* is created (price/duration locked).
- Student pays with **Paystack**.
- After *payment confirmed*, the session becomes an **in‑app chat** between student and teacher (no scheduling handled by the app for MVP). Admin can monitor read‑only later.

## Tech Snapshot
- **Next.js 15** (App Router). Use `<Link>` from `next/link`, async `params` & `searchParams` are **awaited** before destructuring.
- **Supabase** for DB/Auth/Realtime. `createClient` split for server & client.
- **shadcn/ui** components (no radix `.Primitive` usage).
- **Payments**: Paystack **Initialize → Inline → Verify** (no webhook required). We verify on server via `/api/payments/verify?ref=…` and settle DB. Also do a dashboard recovery to verify lingering `initialized` transactions.

## Environment
```
NEXT_PUBLIC_SITE_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...
```

## Current State (dev)
- Student can review a request’s **submitted proposals**, accept one → session upserted.
- **Pay page** creates a Paystack transaction via **Initialize**, stores the **Paystack reference**, opens Inline, then success page **verifies** via `/api/payments/verify` and redirects.
- **Sessions**: student list + guarded session page exist. Chat UI is **next**.
- Sidebar updated to include **Requests** (plural) and **Sessions** for both Student and Teacher.

## Guard Rails
- Use Next 15 syntax everywhere.
- Keep server actions in server files (top `"use server"`), never inline in client components.
- For shadcn, include required sub-components (e.g., `DialogTitle`).

## Next Top Tasks
1) **Chat MVP** after payment:
   - DB: `messages` table, plus `student_last_seen_at`, `teacher_last_seen_at` in `sessions`.
   - Components: `ChatRoom` (server composer), `MessageList` (client, realtime), `MessageInput` (server action).
   - Route: mount chat on `/dashboard/{student|teacher}/sessions/[id]` when `payment_status = 'paid'`.
2) Admin read‑only chat monitor (optional, later).
3) Unread badge in dashboard header using last-seen timestamps.
