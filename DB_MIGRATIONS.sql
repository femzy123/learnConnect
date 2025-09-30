-- Consolidated, idempotent migrations for dev
-- ==========================
-- Transactions hardening
-- ==========================
create unique index if not exists transactions_provider_reference_uidx
  on public.transactions (provider, reference);

create index if not exists transactions_session_idx  on public.transactions (session_id);
create index if not exists transactions_request_idx  on public.transactions (request_id);
create index if not exists transactions_created_idx  on public.transactions (created_at desc);

alter table public.transactions
  alter column created_at set default now();

-- currency and status remain free text per product decision

-- ==========================
-- Sessions alignment
-- ==========================
alter table public.sessions
  add column if not exists payment_status text not null default 'pending';

create unique index if not exists sessions_request_uidx on public.sessions (request_id);
create index if not exists sessions_student_idx on public.sessions (student_id);
create index if not exists sessions_teacher_idx on public.sessions (teacher_id);
create index if not exists sessions_scheduled_idx on public.sessions (scheduled_time);

alter table public.sessions
  alter column created_at set default now();

alter table public.sessions
  alter column updated_at set default now();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

-- ==========================
-- Messages (chat MVP)
-- ==========================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_session_created_idx
  on public.messages (session_id, created_at);

alter table public.sessions add column if not exists student_last_seen_at timestamptz;
alter table public.sessions add column if not exists teacher_last_seen_at timestamptz;
