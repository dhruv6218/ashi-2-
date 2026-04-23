-- =============================================================
-- Phase 4: Decisions and Artifacts
-- =============================================================

-- -------------------------------------------------------
-- DECISIONS
-- -------------------------------------------------------
create type if not exists public.decision_action as enum ('Build', 'Fix', 'Improve', 'Research', 'Defer', 'Kill', 'Monitor');

create table if not exists public.decisions (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  problem_id      uuid references public.problems(id) on delete set null,
  opportunity_id  uuid references public.opportunities(id) on delete set null,
  title           text not null,
  action          public.decision_action not null,
  rationale       text not null,
  author_id       uuid not null references auth.users(id) on delete restrict,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.decisions enable row level security;

create policy "decisions: workspace members can read"
  on public.decisions for select
  using (public.is_workspace_member(workspace_id));

create policy "decisions: workspace members can insert"
  on public.decisions for insert
  with check (public.is_workspace_member(workspace_id));

create policy "decisions: author or owner can update"
  on public.decisions for update
  using (author_id = auth.uid() or public.is_workspace_owner(workspace_id));

-- Decisions and Launches are protected from casual deletion to preserve accountability
create policy "decisions: owner only can delete"
  on public.decisions for delete
  using (public.is_workspace_owner(workspace_id));

create trigger decisions_updated_at
  before update on public.decisions
  for each row execute function public.set_updated_at();

create index if not exists decisions_workspace_id_idx on public.decisions(workspace_id);

-- -------------------------------------------------------
-- ARTIFACTS
-- Versioned documents tied to decisions
-- -------------------------------------------------------
create type if not exists public.artifact_type as enum (
  'prd', 'spec', 'brief', 'memo', 'announcement', 'retro', 'other'
);

create table if not exists public.artifacts (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  decision_id  uuid not null references public.decisions(id) on delete cascade,
  title        text not null,
  type         public.artifact_type not null default 'prd',
  content      text not null default '',
  version      integer not null default 1,
  author_id    uuid not null references auth.users(id) on delete restrict,
  -- Jira integration fields
  external_url text,
  external_id  text,
  jira_push_status text,
  jira_pushed_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.artifacts enable row level security;

create policy "artifacts: workspace members can read"
  on public.artifacts for select
  using (public.is_workspace_member(workspace_id));

create policy "artifacts: workspace members can insert"
  on public.artifacts for insert
  with check (public.is_workspace_member(workspace_id));

create policy "artifacts: workspace members can update"
  on public.artifacts for update
  using (public.is_workspace_member(workspace_id));

create policy "artifacts: owner can delete"
  on public.artifacts for delete
  using (public.is_workspace_owner(workspace_id));

create trigger artifacts_updated_at
  before update on public.artifacts
  for each row execute function public.set_updated_at();

create index if not exists artifacts_workspace_id_idx on public.artifacts(workspace_id);
create index if not exists artifacts_decision_id_idx  on public.artifacts(decision_id);

-- -------------------------------------------------------
-- JIRA CONFIG
-- Workspace-level Jira integration settings (stored server-side securely)
-- -------------------------------------------------------
create table if not exists public.jira_configs (
  id             uuid primary key default uuid_generate_v4(),
  workspace_id   uuid not null unique references public.workspaces(id) on delete cascade,
  jira_base_url  text not null,
  jira_email     text not null,
  project_key    text not null,
  -- api_token is stored encrypted; never exposed to frontend
  api_token_hash text not null,
  enabled        boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.jira_configs enable row level security;

-- Only owners can read/manage jira config
create policy "jira_configs: owner can read"
  on public.jira_configs for select
  using (public.is_workspace_owner(workspace_id));

create policy "jira_configs: owner can insert"
  on public.jira_configs for insert
  with check (public.is_workspace_owner(workspace_id));

create policy "jira_configs: owner can update"
  on public.jira_configs for update
  using (public.is_workspace_owner(workspace_id));

create policy "jira_configs: owner can delete"
  on public.jira_configs for delete
  using (public.is_workspace_owner(workspace_id));

create trigger jira_configs_updated_at
  before update on public.jira_configs
  for each row execute function public.set_updated_at();
