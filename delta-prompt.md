# LearnConect — Delta Prompt (current)

**When:** 2025-09-26 — Africa/Lagos  
**Scope:** Storage policies + Teacher Profile robustness + Admin fixes

## What changed
- **DB:** Temporarily disabled RLS across public schema (dev only).  
- **Storage:** Recreated policies for `avatars` (public read), `vetting_docs` & `certificates` (owner/admin).  
- **Teacher Profile:** Multi-certificate upload; integrated `CertificatesList` (view/delete with signed URLs); Gov-ID shown only if absent; validation tightened.  
- **Admin Users:** Removed `hourly_rate` field/column; null-safe mapping.  
- **Admin Invite panel:** Extracted server action to `actions.js`; panel consumes it as prop (fixes Next 15 build rule).

## Data changes
- None to tables; only Storage policy changes and DB RLS toggle (off).

## Why
- Unblock profile completion & file workflows; stabilize admin screens; adhere to Next 15 server/client boundaries.

## Tests / Checks
- Upload/list/delete certificates for a teacher account ✅  
- Gov-ID upload once, then hidden ✅  
- Users tab loads without error; toggle actions unaffected ✅  
- Admin request detail compiles; invite action runs ✅

## Regressions / Open
- Teacher “Requests to propose” pages **not** wired yet.  
- Student accept flow → create session → pay → webhook still pending.

## Next task (single)
- Implement **Teacher → Requests to propose** (list + detail submit).

## Guardrails
- DB RLS off (dev); Storage policies enforce access.  
- Use signed URLs for private downloads.  
- Keep Next 15 patterns, shadcn, and no `.Primitive`.
