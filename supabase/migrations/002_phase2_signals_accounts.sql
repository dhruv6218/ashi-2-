-- =============================================================
-- Phase 2: Product Areas, Segments, Signals, Accounts, Storage
-- =============================================================

-- -------------------------------------------------------
-- PRODUCT AREAS
-- Workspace-defined classification tags
-- -------------------------------------------------------
create table if not exists public.product_areas (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null,
  created_at   timestamptz not null default now(),
  unique (workspace_id, name)
);

alter table public.product_areas enable row level security;

create policy "product_areas: workspace members can read"
  on public.product_areas for select
  using (public.is_workspace_member(workspace_id));

create policy "product_areas: workspace members can insert"
  on public.product_areas for insert
  with check (public.is_workspace_member(workspace_id));

create policy "product_areas: owner can delete"
  on public.product_areas for delete
  using (public.is_workspace_owner(workspace_id));

-- -------------------------------------------------------
-- SEGMENTS
-- Workspace-defined account segments
-- -------------------------------------------------------
create table if not exists public.segments (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null,
  created_at   timestamptz not null default now(),
  unique (workspace_id, name)
);

alter table public.segments enable row level security;

create policy "segments: workspace members can read"
  on public.segments for select
  using (public.is_workspace_member(workspace_id));

create policy "segments: workspace members can insert"
  on public.segments for insert
  with check (public.is_workspace_member(workspace_id));

create policy "segments: owner can delete"
  on public.segments for delete
  using (public.is_workspace_owner(workspace_id));

-- -------------------------------------------------------
-- ACCOUNTS
-- Customer accounts with revenue context
-- -------------------------------------------------------
create type if not exists public.churn_risk_level as enum ('low', 'medium', 'high', 'critical');

create table if not exists public.accounts (
  id               uuid primary key default uuid_generate_v4(),
  workspace_id     uuid not null references public.workspaces(id) on delete cascade,
  name             text not null,
  domain           text,
  arr              numeric(14,2) not null default 0,
  plan             text,
  segment          text,
  health_score     numeric(5,2),
  churn_risk       public.churn_risk_level,
  renewal_date     date,
  notes            text,
  signal_count     integer not null default 0,
  last_signal_date timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.accounts enable row level security;

create policy "accounts: workspace members can read"
  on public.accounts for select
  using (public.is_workspace_member(workspace_id));

create policy "accounts: workspace members can insert"
  on public.accounts for insert
  with check (public.is_workspace_member(workspace_id));

create policy "accounts: workspace members can update"
  on public.accounts for update
  using (public.is_workspace_member(workspace_id));

create policy "accounts: owner can delete"
  on public.accounts for delete
  using (public.is_workspace_owner(workspace_id));

create trigger accounts_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

create index if not exists accounts_workspace_id_idx on public.accounts(workspace_id);

-- -------------------------------------------------------
-- SIGNALS
-- Customer feedback, complaints, requests
-- -------------------------------------------------------
create type if not exists public.signal_sentiment as enum ('Positive', 'Neutral', 'Negative', 'Mixed');
create type if not exists public.signal_severity  as enum ('Critical', 'High', 'Medium', 'Low', 'Info');

create table if not exists public.signals (
  id                uuid primary key default uuid_generate_v4(),
  workspace_id      uuid not null references public.workspaces(id) on delete cascade,
  account_id        uuid references public.accounts(id) on delete set null,
  source_type       text not null,
  source_metadata   jsonb,
  raw_text          text not null,
  normalized_text   text,
  sentiment_label   public.signal_sentiment,
  severity_label    public.signal_severity,
  category          text,
  product_area      text,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now()
);

alter table public.signals enable row level security;

create policy "signals: workspace members can read"
  on public.signals for select
  using (public.is_workspace_member(workspace_id));

create policy "signals: workspace members can insert"
  on public.signals for insert
  with check (public.is_workspace_member(workspace_id));

create policy "signals: workspace members can update"
  on public.signals for update
  using (public.is_workspace_member(workspace_id));

create policy "signals: owner can delete"
  on public.signals for delete
  using (public.is_workspace_owner(workspace_id));

create index if not exists signals_workspace_id_idx on public.signals(workspace_id);
create index if not exists signals_account_id_idx   on public.signals(account_id);
create index if not exists signals_created_at_idx   on public.signals(created_at desc);

-- Update account signal_count when signal is inserted/deleted
create or replace function public.update_account_signal_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' and new.account_id is not null then
    update public.accounts
    set signal_count = signal_count + 1,
        last_signal_date = new.created_at
    where id = new.account_id;
  elsif tg_op = 'DELETE' and old.account_id is not null then
    update public.accounts
    set signal_count = greatest(signal_count - 1, 0)
    where id = old.account_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger signals_account_count
  after insert or delete on public.signals
  for each row execute function public.update_account_signal_count();

-- -------------------------------------------------------
-- FILE UPLOADS (ingestion job tracker)
-- -------------------------------------------------------
create type if not exists public.upload_type   as enum ('signals_csv', 'accounts_csv', 'avatar');
create type if not exists public.upload_status as enum ('pending', 'processing', 'complete', 'failed');

create table if not exists public.file_uploads (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  uploaded_by     uuid not null references auth.users(id) on delete cascade,
  upload_type     public.upload_type not null,
  storage_path    text not null,
  original_name   text,
  file_size_bytes integer,
  status          public.upload_status not null default 'pending',
  total_rows      integer,
  success_rows    integer,
  failed_rows     integer,
  error_details   jsonb,
  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

alter table public.file_uploads enable row level security;

create policy "file_uploads: workspace members can read"
  on public.file_uploads for select
  using (public.is_workspace_member(workspace_id));

create policy "file_uploads: workspace members can insert"
  on public.file_uploads for insert
  with check (public.is_workspace_member(workspace_id));

create policy "file_uploads: uploader or owner can update"
  on public.file_uploads for update
  using (uploaded_by = auth.uid() or public.is_workspace_owner(workspace_id));

-- -------------------------------------------------------
-- STORAGE BUCKET POLICIES (applied via SQL)
-- Bucket names: 'uploads' (private CSV uploads), 'avatars' (public avatars)
-- These are enforced at the storage level in addition to RLS.
-- -------------------------------------------------------

-- NOTE: Bucket creation and storage policies are configured in Supabase Dashboard
-- or via supabase CLI: supabase storage create uploads --private
-- The following are the intended access rules documented here:
--
-- Bucket: uploads (private)
--   INSERT: authenticated users who are workspace members
--   SELECT: only the uploader or workspace owner
--   DELETE: only the uploader or workspace owner
--
-- Bucket: avatars (public read, owner write)
--   INSERT: authenticated user (own avatar)
--   SELECT: public
--   DELETE: authenticated user (own file)
