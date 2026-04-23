-- =============================================================
-- Phase 5: Launches, Reviews, Verdicts, Proof Summaries
-- =============================================================

-- -------------------------------------------------------
-- LAUNCHES
-- -------------------------------------------------------
create type if not exists public.launch_status as enum (
  'active', 'pending_review', 'complete', 'cancelled'
);

create table if not exists public.launches (
  id               uuid primary key default uuid_generate_v4(),
  workspace_id     uuid not null references public.workspaces(id) on delete cascade,
  decision_id      uuid not null references public.decisions(id) on delete restrict,
  problem_id       uuid references public.problems(id) on delete set null,
  title            text not null,
  owner_id         uuid not null references auth.users(id) on delete restrict,
  launch_date      date,
  expected_outcome text,
  target_metrics   text,
  status           public.launch_status not null default 'active',
  day7_review_date  date,
  day30_review_date date,
  created_by       uuid not null references auth.users(id) on delete restrict,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.launches enable row level security;

create policy "launches: workspace members can read"
  on public.launches for select
  using (public.is_workspace_member(workspace_id));

create policy "launches: workspace members can insert"
  on public.launches for insert
  with check (public.is_workspace_member(workspace_id));

create policy "launches: workspace members can update"
  on public.launches for update
  using (public.is_workspace_member(workspace_id));

create policy "launches: owner can delete"
  on public.launches for delete
  using (public.is_workspace_owner(workspace_id));

create trigger launches_updated_at
  before update on public.launches
  for each row execute function public.set_updated_at();

create index if not exists launches_workspace_id_idx on public.launches(workspace_id);

-- -------------------------------------------------------
-- LAUNCH REVIEWS
-- Day-7 and Day-30 checkpoints
-- -------------------------------------------------------
create type if not exists public.review_checkpoint as enum ('day_7', 'day_30');

create table if not exists public.launch_reviews (
  id                   uuid primary key default uuid_generate_v4(),
  launch_id            uuid not null references public.launches(id) on delete cascade,
  workspace_id         uuid not null references public.workspaces(id) on delete cascade,
  checkpoint           public.review_checkpoint not null,
  baseline_signal_count integer not null default 0,
  current_signal_count  integer not null default 0,
  signal_delta          integer generated always as (current_signal_count - baseline_signal_count) stored,
  affected_arr_before  numeric(14,2) not null default 0,
  affected_arr_after   numeric(14,2) not null default 0,
  affected_accounts_before integer not null default 0,
  affected_accounts_after  integer not null default 0,
  pm_notes             text,
  reviewed_by          uuid not null references auth.users(id) on delete restrict,
  review_date          date not null default current_date,
  created_at           timestamptz not null default now(),
  unique (launch_id, checkpoint)
);

alter table public.launch_reviews enable row level security;

create policy "launch_reviews: workspace members can read"
  on public.launch_reviews for select
  using (public.is_workspace_member(workspace_id));

create policy "launch_reviews: workspace members can insert"
  on public.launch_reviews for insert
  with check (public.is_workspace_member(workspace_id));

create policy "launch_reviews: reviewer or owner can update"
  on public.launch_reviews for update
  using (reviewed_by = auth.uid() or public.is_workspace_owner(workspace_id));

-- -------------------------------------------------------
-- LAUNCH VERDICTS (one per launch, immutable once set)
-- -------------------------------------------------------
create type if not exists public.verdict_value as enum (
  'Solved', 'Partially Solved', 'Not Solved', 'Regressed'
);

create table if not exists public.launch_verdicts (
  id           uuid primary key default uuid_generate_v4(),
  launch_id    uuid not null unique references public.launches(id) on delete restrict,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  verdict      public.verdict_value not null,
  notes        text,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  created_at   timestamptz not null default now()
);

alter table public.launch_verdicts enable row level security;

create policy "launch_verdicts: workspace members can read"
  on public.launch_verdicts for select
  using (public.is_workspace_member(workspace_id));

create policy "launch_verdicts: workspace members can insert"
  on public.launch_verdicts for insert
  with check (public.is_workspace_member(workspace_id));

-- Verdicts are immutable once submitted — no update or delete policies

-- Trigger: mark launch as complete when verdict is submitted
create or replace function public.handle_verdict_submitted()
returns trigger language plpgsql security definer as $$
begin
  update public.launches
  set status = 'complete', updated_at = now()
  where id = new.launch_id;
  return new;
end;
$$;

create trigger on_verdict_submitted
  after insert on public.launch_verdicts
  for each row execute function public.handle_verdict_submitted();

-- -------------------------------------------------------
-- PROOF SUMMARIES
-- AI-assisted or backend-generated outcome summary
-- -------------------------------------------------------
create table if not exists public.proof_summaries (
  id           uuid primary key default uuid_generate_v4(),
  launch_id    uuid not null unique references public.launches(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  summary      text not null,
  generated_by text not null default 'ai',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.proof_summaries enable row level security;

create policy "proof_summaries: workspace members can read"
  on public.proof_summaries for select
  using (public.is_workspace_member(workspace_id));

create policy "proof_summaries: workspace members can insert"
  on public.proof_summaries for insert
  with check (public.is_workspace_member(workspace_id));

create policy "proof_summaries: workspace members can update"
  on public.proof_summaries for update
  using (public.is_workspace_member(workspace_id));

create trigger proof_summaries_updated_at
  before update on public.proof_summaries
  for each row execute function public.set_updated_at();
