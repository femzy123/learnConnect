# Architecture & Flow
**Updated:** 2025-09-29 17:12 UTC

## High-Level
- **Next.js 15 App Router:** server components by default, client only where needed (forms, realtime).
- **Supabase:** Auth, Postgres, Realtime; RLS currently off in dev.
- **UI:** shadcn/ui + Tailwind.

## Core Flows
1. **Student Request → Proposals → Accept**
   - Student creates request (category, subject, topic).
   - Admin invites teachers; teachers submit `teacher_proposals` (fee/duration/note).
   - Student accepts one → others auto-reject → `sessions` row upserted.
2. **Payment**
   - Pay page calls **Paystack Initialize** (server) to get the official `reference`.
   - Store a `transactions` row with `status="initialized"`.
   - Open Paystack Inline with same `reference`.
   - Success page calls **/api/payments/verify** (server→Paystack).
   - On success: `transactions.status="success"`, `sessions.payment_status="paid"`, `student_requests.status="paid"`.
   - Dashboard recovery verifies any lingering `initialized` rows (past ~120 min) on load.
3. **Session (Chat MVP)**
   - After payment, the session view becomes a chat space between student and teacher.
   - Scheduling is out-of-scope for MVP; they coordinate in chat.

## Storage
- Buckets: `avatars`, `vetting_docs`, `certificates`. (Policies to be restored when re-enabling RLS.)

## Navigation (selected)
- Student: `/dashboard/student`, `/dashboard/student/requests`, `/dashboard/student/requests/new`, `/dashboard/student/sessions`.
- Teacher: `/dashboard/teacher`, `/dashboard/teacher/requests`, `/dashboard/teacher/sessions`.
- Admin: `/dashboard/admin`, `/dashboard/admin/users`, `/dashboard/admin/requests` (detail, invite).
