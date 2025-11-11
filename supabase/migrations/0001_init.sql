-- Enable extensions required for UUID generation and timestamps
create extension if not exists "pgcrypto";

-- ========== Core Tables ==========

create table public.bots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  forwarding_number text unique,
  description text,
  default_language text default 'en-US',
  file_search_store_id text,
  greeting_prompt text,
  fallback_prompt text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bot_members (
  bot_id uuid references public.bots(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  invited_at timestamptz not null default timezone('utc', now()),
  primary key (bot_id, user_id)
);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid references public.bots(id) on delete set null,
  twilio_sid text unique,
  from_number text not null,
  to_number text,
  forwarded_from text,
  routed_via text check (routed_via in ('forwarded', 'direct', 'prompted')),
  status text not null check (status in ('initiated', 'in_progress', 'completed', 'failed')),
  intent text,
  urgency text,
  started_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.call_transcripts (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  transcript text not null,
  source text default 'twilio',
  created_at timestamptz not null default timezone('utc', now())
);

create table public.call_summaries (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  summary text,
  intent text,
  urgency text,
  lead_json jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references public.calls(id) on delete set null,
  bot_id uuid references public.bots(id) on delete cascade,
  name text,
  phone text,
  reason text,
  urgency text,
  next_step text,
  status text default 'new' check (status in ('new', 'contacted', 'closed', 'ignored')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.kb_files (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots(id) on delete cascade,
  storage_path text not null,
  gemini_file_id text,
  size_bytes bigint,
  mime_type text,
  uploaded_by uuid,
  uploaded_at timestamptz not null default timezone('utc', now()),
  status text default 'processing' check (status in ('processing', 'ready', 'failed')),
  error_message text
);

-- ========== Indexes ==========
create index idx_bot_members_user on public.bot_members (user_id);
create index idx_calls_bot on public.calls (bot_id);
create index idx_calls_started_at on public.calls (started_at desc);
create index idx_call_transcripts_call on public.call_transcripts (call_id);
create index idx_call_summaries_call on public.call_summaries (call_id);
create index idx_leads_bot on public.leads (bot_id);
create index idx_kb_files_bot on public.kb_files (bot_id);

-- ========== Triggers ==========
create function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger bots_set_updated_at
before update on public.bots
for each row execute procedure public.set_updated_at();

create trigger leads_set_updated_at
before update on public.leads
for each row execute procedure public.set_updated_at();

-- ========== Row Level Security ==========
alter table public.bots enable row level security;
alter table public.bot_members enable row level security;
alter table public.calls enable row level security;
alter table public.call_transcripts enable row level security;
alter table public.call_summaries enable row level security;
alter table public.leads enable row level security;
alter table public.kb_files enable row level security;

-- helper predicate to reuse membership checks
create or replace view public.bot_membership as
  select
    bm.bot_id,
    bm.user_id,
    bm.role
  from public.bot_members bm;

-- Bots policies
create policy "Members can view bots"
on public.bots
for select
using (
  exists (
    select 1 from public.bot_membership m
    where m.bot_id = bots.id and m.user_id = auth.uid()
  )
);

create policy "Owners can insert bots"
on public.bots
for insert
with check (
  exists (
    select 1 from auth.users u
    where u.id = auth.uid()
  )
);

create policy "Owners can update bots"
on public.bots
for update
using (
  exists (
    select 1 from public.bot_membership m
    where m.bot_id = bots.id and m.user_id = auth.uid() and m.role = 'owner'
  )
)
with check (
  exists (
    select 1 from public.bot_membership m
    where m.bot_id = bots.id and m.user_id = auth.uid() and m.role = 'owner'
  )
);

-- Bot members policies
create policy "Members can view bot_members"
on public.bot_members
for select
using (
  exists (
    select 1 from public.bot_membership m
    where m.bot_id = bot_members.bot_id and m.user_id = auth.uid()
  )
);

create policy "Owners can manage bot_members"
on public.bot_members
for all
using (
  exists (
    select 1 from public.bot_membership m
    where m.bot_id = bot_members.bot_id and m.user_id = auth.uid() and m.role = 'owner'
  )
)
with check (
  exists (
    select 1 from public.bot_membership m
    where m.bot_id = bot_members.bot_id and m.user_id = auth.uid() and m.role = 'owner'
  )
);

-- Calls + downstream tables share access rule
create or replace function public.user_can_access_call(bot_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.bot_membership m
    where m.bot_id = user_can_access_call.bot_id
      and m.user_id = auth.uid()
  );
$$;

create policy "Members can manage calls"
on public.calls
for all
using (public.user_can_access_call(bot_id))
with check (public.user_can_access_call(bot_id));

create policy "Members can read call transcripts"
on public.call_transcripts
for select
using (
  exists (
    select 1 from public.calls c
    where c.id = call_transcripts.call_id
      and public.user_can_access_call(c.bot_id)
  )
);

create policy "Members can insert call transcripts"
on public.call_transcripts
for insert
with check (
  exists (
    select 1 from public.calls c
    where c.id = call_transcripts.call_id
      and public.user_can_access_call(c.bot_id)
  )
);

create policy "Members can read call summaries"
on public.call_summaries
for select
using (
  exists (
    select 1 from public.calls c
    where c.id = call_summaries.call_id
      and public.user_can_access_call(c.bot_id)
  )
);

create policy "Members can insert call summaries"
on public.call_summaries
for insert
with check (
  exists (
    select 1 from public.calls c
    where c.id = call_summaries.call_id
      and public.user_can_access_call(c.bot_id)
  )
);

create policy "Members can manage leads"
on public.leads
for all
using (public.user_can_access_call(bot_id))
with check (public.user_can_access_call(bot_id));

create policy "Members can manage kb files"
on public.kb_files
for all
using (public.user_can_access_call(bot_id))
with check (public.user_can_access_call(bot_id));
