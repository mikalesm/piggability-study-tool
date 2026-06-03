-- Piggability Study Tool — initial schema.
-- Multi-tenant: every row carries tenant_id; RLS scopes access to the caller's
-- tenant. Mirrors the persistence model used across our other products.
--
-- Apply with: supabase db push  (or paste into the SQL editor).

create extension if not exists "pgcrypto";

-- ── tenant ──────────────────────────────────────────────────────────────────
create table if not exists public.tenant (
  id          text primary key,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ── project ─────────────────────────────────────────────────────────────────
create table if not exists public.project (
  id          text primary key,
  tenant_id   text not null references public.tenant (id) on delete cascade,
  name        text not null,
  client      text not null default '',
  code        text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists project_tenant_idx on public.project (tenant_id);

-- ── segment ─────────────────────────────────────────────────────────────────
-- payload holds the engine Segment (single source of truth for the domain type).
create table if not exists public.segment (
  id          text primary key,
  tenant_id   text not null references public.tenant (id) on delete cascade,
  project_id  text not null references public.project (id) on delete cascade,
  payload     jsonb not null,
  updated_at  timestamptz not null default now()
);
create index if not exists segment_tenant_idx on public.segment (tenant_id);
create index if not exists segment_project_idx on public.segment (project_id);

-- ── study_input ─────────────────────────────────────────────────────────────
create table if not exists public.study_input (
  segment_id  text primary key references public.segment (id) on delete cascade,
  tenant_id   text not null references public.tenant (id) on delete cascade,
  payload     jsonb not null,
  updated_at  timestamptz not null default now()
);
create index if not exists study_input_tenant_idx on public.study_input (tenant_id);

-- ── assessment_cache ────────────────────────────────────────────────────────
-- Optional cache of the latest computed Assessment (the engine is the source of
-- truth; this is for fast fleet rollups / audit only).
create table if not exists public.assessment_cache (
  segment_id  text primary key references public.segment (id) on delete cascade,
  tenant_id   text not null references public.tenant (id) on delete cascade,
  verdict     text not null,
  payload     jsonb not null,
  computed_at timestamptz not null default now()
);
create index if not exists assessment_cache_tenant_idx on public.assessment_cache (tenant_id);

-- ── Row Level Security ───────────────────────────────────────────────────────
-- tenant_id is taken from the JWT claim `tenant_id`. Adjust the claim path to
-- match your auth setup if different.
alter table public.tenant           enable row level security;
alter table public.project          enable row level security;
alter table public.segment          enable row level security;
alter table public.study_input      enable row level security;
alter table public.assessment_cache enable row level security;

create or replace function public.jwt_tenant_id() returns text
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id', ''),
    'default'
  );
$$;

do $$
declare
  t text;
begin
  foreach t in array array['project', 'segment', 'study_input', 'assessment_cache']
  loop
    execute format($f$
      drop policy if exists tenant_isolation on public.%I;
      create policy tenant_isolation on public.%I
        using (tenant_id = public.jwt_tenant_id())
        with check (tenant_id = public.jwt_tenant_id());
    $f$, t, t);
  end loop;
end $$;

drop policy if exists tenant_self on public.tenant;
create policy tenant_self on public.tenant
  using (id = public.jwt_tenant_id())
  with check (id = public.jwt_tenant_id());
