-- =============================================================
-- Phase 1: Auth, Profiles, Workspaces, Members, Invitations
-- =============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- -------------------------------------------------------
-- PROFILES
-- One profile per authenticated user
-- -------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  last_active  timestamptz
);

alter table public.profiles enable row level security;

create policy "profiles: user can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: user can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: auto-create profile on new auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------
-- WORKSPACES
-- -------------------------------------------------------
create table if not exists public.workspaces (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  slug             text not null unique,
  timezone         text not null default 'UTC',
  logo_url         text,
  owner_id         uuid not null references auth.users(id) on delete restrict,
  onboarding_done  boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.workspaces enable row level security;

-- Helper: check if the calling user is a member of a workspace
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

-- Helper: check if the calling user is owner of a workspace
create or replace function public.is_workspace_owner(ws_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.workspaces
    where id = ws_id and owner_id = auth.uid()
  );
$$;

create policy "workspaces: member can read"
  on public.workspaces for select
  using (public.is_workspace_member(id));

create policy "workspaces: owner can update"
  on public.workspaces for update
  using (public.is_workspace_owner(id));

create policy "workspaces: authenticated user can insert"
  on public.workspaces for insert
  with check (auth.uid() = owner_id);

-- Trigger: auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------
-- WORKSPACE MEMBERS
-- -------------------------------------------------------
create type if not exists public.member_role as enum ('owner', 'member');

create table if not exists public.workspace_members (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         public.member_role not null default 'member',
  joined_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);

alter table public.workspace_members enable row level security;

create policy "members: workspace members can read"
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_id));

create policy "members: owner can insert"
  on public.workspace_members for insert
  with check (public.is_workspace_owner(workspace_id));

create policy "members: owner can delete"
  on public.workspace_members for delete
  using (public.is_workspace_owner(workspace_id));

-- Trigger: auto-add workspace creator as owner member
create or replace function public.handle_new_workspace()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function public.handle_new_workspace();

-- -------------------------------------------------------
-- INVITATIONS
-- -------------------------------------------------------
create type if not exists public.invite_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create table if not exists public.invitations (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  invited_email text not null,
  invited_role  public.member_role not null default 'member',
  invited_by    uuid not null references auth.users(id) on delete cascade,
  token         text not null unique default encode(gen_random_bytes(32), 'hex'),
  status        public.invite_status not null default 'pending',
  expires_at    timestamptz not null default (now() + interval '7 days'),
  accepted_at   timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.invitations enable row level security;

create policy "invitations: workspace members can read"
  on public.invitations for select
  using (public.is_workspace_member(workspace_id));

create policy "invitations: owner can insert"
  on public.invitations for insert
  with check (public.is_workspace_owner(workspace_id));

create policy "invitations: owner can update (cancel)"
  on public.invitations for update
  using (public.is_workspace_owner(workspace_id));

-- Allow reading an invite by token (for accept-invitation page, unauthenticated)
create policy "invitations: anyone can read by token for acceptance"
  on public.invitations for select
  using (status = 'pending' and expires_at > now());
