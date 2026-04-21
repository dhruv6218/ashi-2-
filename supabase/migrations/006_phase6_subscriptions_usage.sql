-- =============================================================
-- Phase 6: Subscriptions, Usage Tracking, Activity Logs, Notifications
-- =============================================================

-- -------------------------------------------------------
-- SUBSCRIPTIONS
-- One subscription per workspace
-- -------------------------------------------------------
create type if not exists public.plan_type as enum (
  'free', 'starter', 'growth', 'scale'
);

create type if not exists public.billing_status as enum (
  'active', 'trialing', 'past_due', 'cancelled', 'paused'
);

create table if not exists public.subscriptions (
  id                  uuid primary key default uuid_generate_v4(),
  workspace_id        uuid not null unique references public.workspaces(id) on delete cascade,
  plan_type           public.plan_type not null default 'free',
  billing_status      public.billing_status not null default 'active',
  -- External billing provider reference (e.g. Stripe subscription ID)
  external_sub_id     text,
  -- Trial support
  trial_ends_at       timestamptz,
  -- Current period
  current_period_start timestamptz,
  current_period_end  timestamptz,
  -- Manual override for support/sales cases
  override_plan       public.plan_type,
  override_reason     text,
  override_by         uuid references auth.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Members can read subscription to enforce gates in UI
create policy "subscriptions: workspace members can read"
  on public.subscriptions for select
  using (public.is_workspace_member(workspace_id));

-- Only owner can manage subscription (upsert via Edge Function)
create policy "subscriptions: owner can insert"
  on public.subscriptions for insert
  with check (public.is_workspace_owner(workspace_id));

create policy "subscriptions: owner can update"
  on public.subscriptions for update
  using (public.is_workspace_owner(workspace_id));

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Auto-create free subscription when workspace is created
create or replace function public.handle_new_workspace_subscription()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (workspace_id, plan_type, billing_status)
  values (new.id, 'free', 'active')
  on conflict (workspace_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_workspace_subscription_init on public.workspaces;
create trigger on_workspace_subscription_init
  after insert on public.workspaces
  for each row execute function public.handle_new_workspace_subscription();

-- -------------------------------------------------------
-- PLAN LIMITS (reference table, not per-workspace)
-- Defines what each plan allows
-- -------------------------------------------------------
create table if not exists public.plan_limits (
  plan_type            public.plan_type primary key,
  max_members          integer not null default 1,
  max_signals          integer not null default 100,
  max_uploads_per_month integer not null default 2,
  max_ai_calls_per_day integer not null default 10,
  max_ai_calls_per_month integer not null default 50,
  jira_enabled         boolean not null default false,
  advanced_ai_enabled  boolean not null default false,
  custom_branding      boolean not null default false
);

-- Seed plan limits
insert into public.plan_limits values
  ('free',    1,    100,  2,   10,   50,   false, false, false),
  ('starter', 5,    2000, 20,  50,   500,  true,  false, false),
  ('growth',  15,   10000, 100, 200,  2000, true,  true,  false),
  ('scale',   100,  -1,   -1,  -1,   -1,   true,  true,  true)
on conflict (plan_type) do nothing;

-- Everyone can read plan limits (needed for UI gates)
alter table public.plan_limits enable row level security;
create policy "plan_limits: anyone can read"
  on public.plan_limits for select
  using (true);

-- -------------------------------------------------------
-- USAGE TRACKING
-- Track per-workspace usage for quota enforcement
-- -------------------------------------------------------
create type if not exists public.usage_event_type as enum (
  'ai_call', 'csv_upload', 'signal_created', 'artifact_generated', 'jira_push'
);

create table if not exists public.usage_events (
  id             uuid primary key default uuid_generate_v4(),
  workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  event_type     public.usage_event_type not null,
  feature        text,
  metadata       jsonb,
  created_at     timestamptz not null default now()
);

alter table public.usage_events enable row level security;

-- Only owners can read usage events; edge functions insert via service role
create policy "usage_events: owner can read"
  on public.usage_events for select
  using (public.is_workspace_owner(workspace_id));

create index if not exists usage_events_workspace_date_idx
  on public.usage_events(workspace_id, created_at desc);

-- -------------------------------------------------------
-- ACTIVITY LOGS
-- Immutable audit trail of important actions
-- -------------------------------------------------------
create table if not exists public.activity_logs (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id     uuid references auth.users(id) on delete set null,
  event_type   text not null,
  entity_type  text,
  entity_id    uuid,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

alter table public.activity_logs enable row level security;

-- Workspace members can read activity logs; inserts via edge functions or triggers
create policy "activity_logs: workspace members can read"
  on public.activity_logs for select
  using (public.is_workspace_member(workspace_id));

create index if not exists activity_logs_workspace_id_idx
  on public.activity_logs(workspace_id, created_at desc);

-- -------------------------------------------------------
-- NOTIFICATIONS
-- In-app notification records
-- -------------------------------------------------------
create type if not exists public.notification_type as enum (
  'invitation_sent', 'invitation_accepted', 'review_due',
  'review_overdue', 'verdict_submitted', 'plan_changed', 'system'
);

create table if not exists public.notifications (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         public.notification_type not null,
  title        text not null,
  body         text,
  entity_type  text,
  entity_id    uuid,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications: user can read own"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications: user can update own (mark read)"
  on public.notifications for update
  using (user_id = auth.uid());

create index if not exists notifications_user_id_idx
  on public.notifications(user_id, created_at desc);
