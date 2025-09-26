# LearnConect — Project Operating Prompt (v2025-09-26, Africa/Lagos)

## 0) Stack
Next.js 15 App Router • Tailwind + shadcn/ui (never use `.Primitive`) • Supabase (Auth, Postgres, Storage) • Paystack • Sonner.

## 1) Conventions
- Use server components by default; add `"use client"` only when needed.
- `const { id } = await params;` (and `searchParams`) – Next 15 style.
- Use `<Link />` (not `<a>`). Route groups `(guard)` never appear in hrefs.
- Use shadcn components (Dialog requires `DialogTitle`; `SelectItem` needs non-empty `value`).
- Show auth errors via `AuthErrorAlert` or shadcn `Alert` (no error-in-URL).

## 2) Routing (current)
- Landing: `/`
- Student: `/dashboard/student`, `/dashboard/student/requests`, `/dashboard/student/requests/new`, `/dashboard/student/requests/[id]`, `/dashboard/student/pay/[id]`
- Teacher: `/dashboard/teacher`, `/dashboard/teacher/profile`, `/dashboard/teacher/sessions`, `/dashboard/teacher/sessions/[id]`
  - Planned: `/dashboard/teacher/requests`, `/dashboard/teacher/requests/[id]` (proposals) — **not live yet**
- Admin: `/dashboard/admin/users`, `/dashboard/admin/requests`, `/dashboard/admin/requests/[id]`

## 3) Auth & Profiles
- Signup collects **name** → stored in `auth` and `profiles.full_name`.
- Required: **avatar + phone** (student & teacher), **bio + subjects + gov-ID** (teacher).
- Profile completion gate + Sonner toast on redirect.

## 4) Data model (V2)
- `profiles(id, full_name, role, phone, avatar_url, account_status, …)`
- `teacher_profiles(user_id, bio, vetting_status)`
- `categories`, `subjects`, `teacher_subjects`
- `student_requests(id, student_id, category_id, subject_id, topic, status, matched_teacher_id, …)`
- `teacher_proposals(id, request_id, teacher_id, student_id, status, fee_amount, duration_minutes, note, …)` *(denormalized with `student_id` to avoid policy recursion)*
- `sessions(id, request_id, student_id, teacher_id, price_amount, duration_minutes, proposed_slots[], scheduled_time, …)`
- `transactions(id, request_id, session_id, student_id, teacher_id, provider, reference, amount, currency, status, raw, created_at)`

> Pricing lives **per proposal/session** (no `hourly_rate` on profile). Availability is per **session** (proposed slots), not global.

## 5) Business flow
1) Student creates request ⇒ `awaiting_proposals`.
2) **Admin** invites teachers (creates `teacher_proposals` `invited`).
3) Teacher submits proposal (fee + duration) ⇒ `submitted`.
4) Student reviews proposals, **accepts one** ⇒ others `rejected`, create `session` (copy price/duration), request ⇒ `awaiting_payment`.
5) Student pays (Paystack) ⇒ `paid`.
6) Schedule timeslot ⇒ `scheduled`.

## 6) Payments (Paystack)
- Initialize with `sessions.price_amount`.
- Webhook verifies & marks transaction `success`; set request `paid`.
- Env: `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`.

## 7) Storage buckets & policies (current)
- `avatars` — **public read**; users manage their own folder (`<userId>/…`).
- `vetting_docs` — private; owner or admin.
- `certificates` — private; owner or admin.
- Profile page uploads into `${userId}/…`; private buckets use signed URLs to view.

## 8) DONE vs NEXT

**DONE (since last update)**
- **DB (dev):** RLS **disabled** globally to unblock development.  
- **Storage:** Recreated clean policies for `avatars` (public), `vetting_docs` & `certificates` (owner/admin).
- **Teacher Profile page:**  
  - Rewritten form (shadcn components, centered, mobile)  
  - Required fields: avatar, phone, bio, ≥1 subject  
  - **Gov-ID** upload only if missing (stays hidden afterwards)  
  - **Certificates**: multi-upload, list via `CertificatesList`, view (signed URL), delete, auto-refresh
- **Admin Users:** Removed stale `hourly_rate` usage; null-safe arrays; no “Rate” column.
- **Admin Request Detail:** Invite panel build fix (moved server action to `actions.js`; client uses passed action).

**NEXT (in order)**
1) **Admin → Invite teachers** UI is live; add teacher search by name/subject (server-side filter) and success feedback (toast).
2) **Teacher → Requests to propose** pages  
   - List `/dashboard/teacher/requests` showing `invited|submitted`  
   - Detail `/dashboard/teacher/requests/[id]` submit proposal (fee/duration/note)
3) **Student → View & accept proposal** on `/dashboard/student/requests/[id]`  
   - Accept one ⇒ create `session`, reject others, set `awaiting_payment`, redirect to Pay.
4) **Payment flow** finish & verify end-to-end (webhook → update `transactions` + request status).
5) **Scheduling**: teacher proposes up to 3 times; student picks one ⇒ `sessions.scheduled_time`.

## 9) Guardrails
- **Dev mode:** DB RLS is **OFF** (intentionally). Storage RLS is ON with the policies above. Before staging/prod, we’ll re-enable DB RLS and reinstate scoped policies.
- Hide teacher phone until **paid/scheduled** in UI.
- Never expose private files without signed URLs.
- Keep using Next 15 params/searchParams pattern; avoid `(guard)` in hrefs.
