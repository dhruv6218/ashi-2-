-- =============================================================
-- Phase 3: Problems, Problem-Signal Links, Opportunities, Scoring
-- =============================================================

-- -------------------------------------------------------
-- PROBLEMS
-- -------------------------------------------------------
create type if not exists public.problem_status   as enum ('Active', 'Resolved', 'Deferred', 'Monitoring');
create type if not exists public.severity_level   as enum ('Critical', 'High', 'Medium', 'Low');
create type if not exists public.problem_trend    as enum ('Rising', 'Stable', 'Declining');

create table if not exists public.problems (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  title         text not null,
  description   text,
  status        public.problem_status not null default 'Active',
  severity      public.severity_level,
  trend         public.problem_trend not null default 'Stable',
  product_area  text,
  evidence_count integer not null default 0,
  affected_arr  numeric(14,2) not null default 0,
  first_seen    timestamptz not null default now(),
  last_seen     timestamptz not null default now(),
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.problems enable row level security;

create policy "problems: workspace members can read"
  on public.problems for select
  using (public.is_workspace_member(workspace_id));

create policy "problems: workspace members can insert"
  on public.problems for insert
  with check (public.is_workspace_member(workspace_id));

create policy "problems: workspace members can update"
  on public.problems for update
  using (public.is_workspace_member(workspace_id));

create policy "problems: owner can delete"
  on public.problems for delete
  using (public.is_workspace_owner(workspace_id));

create trigger problems_updated_at
  before update on public.problems
  for each row execute function public.set_updated_at();

create index if not exists problems_workspace_id_idx on public.problems(workspace_id);

-- -------------------------------------------------------
-- PROBLEM-SIGNAL LINKS (many-to-many)
-- -------------------------------------------------------
create table if not exists public.problem_signal_links (
  id           uuid primary key default uuid_generate_v4(),
  problem_id   uuid not null references public.problems(id) on delete cascade,
  signal_id    uuid not null references public.signals(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  linked_by    uuid references auth.users(id) on delete set null,
  linked_at    timestamptz not null default now(),
  unique (problem_id, signal_id)
);

alter table public.problem_signal_links enable row level security;

create policy "problem_signal_links: workspace members can read"
  on public.problem_signal_links for select
  using (public.is_workspace_member(workspace_id));

create policy "problem_signal_links: workspace members can insert"
  on public.problem_signal_links for insert
  with check (public.is_workspace_member(workspace_id));

create policy "problem_signal_links: workspace members can delete"
  on public.problem_signal_links for delete
  using (public.is_workspace_member(workspace_id));

-- Keep problem evidence_count in sync
create or replace function public.sync_problem_evidence_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    update public.problems
    set evidence_count = (
      select count(*) from public.problem_signal_links
      where problem_id = new.problem_id
    ),
    last_seen = now()
    where id = new.problem_id;
  end if;

  if tg_op = 'DELETE' then
    update public.problems
    set evidence_count = (
      select count(*) from public.problem_signal_links
      where problem_id = old.problem_id
    )
    where id = old.problem_id;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger problem_signal_links_count
  after insert or delete on public.problem_signal_links
  for each row execute function public.sync_problem_evidence_count();

-- -------------------------------------------------------
-- OPPORTUNITIES
-- Scored opportunities derived from problems
-- -------------------------------------------------------
create type if not exists public.opportunity_action as enum ('Build', 'Fix', 'Improve', 'Research', 'Defer', 'Kill');

create table if not exists public.opportunities (
  id                  uuid primary key default uuid_generate_v4(),
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  problem_id          uuid not null references public.problems(id) on delete cascade,
  -- Composite score (0-100)
  opportunity_score   numeric(5,2) not null default 0,
  -- Score breakdown (0-100 each)
  signal_count_score  numeric(5,2) not null default 0,
  affected_arr_score  numeric(5,2) not null default 0,
  severity_score      numeric(5,2) not null default 0,
  recency_score       numeric(5,2) not null default 0,
  -- Legacy compat fields
  demand_score        numeric(5,2) not null default 0,
  pain_score          numeric(5,2) not null default 0,
  arr_score           numeric(5,2) not null default 0,
  trend_score         numeric(5,2) not null default 0,
  -- Human-readable breakdown
  score_breakdown     jsonb,
  affected_arr        numeric(14,2) not null default 0,
  affected_accounts   integer not null default 0,
  summary             text,
  recommended_action  public.opportunity_action,
  last_scored_at      timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.opportunities enable row level security;

create policy "opportunities: workspace members can read"
  on public.opportunities for select
  using (public.is_workspace_member(workspace_id));

create policy "opportunities: workspace members can insert"
  on public.opportunities for insert
  with check (public.is_workspace_member(workspace_id));

create policy "opportunities: workspace members can update"
  on public.opportunities for update
  using (public.is_workspace_member(workspace_id));

create policy "opportunities: owner can delete"
  on public.opportunities for delete
  using (public.is_workspace_owner(workspace_id));

create trigger opportunities_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

create index if not exists opportunities_workspace_id_idx on public.opportunities(workspace_id);
create index if not exists opportunities_problem_id_idx   on public.opportunities(problem_id);
