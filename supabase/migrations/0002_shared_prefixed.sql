-- Piggability Study Tool — prefixed schema (pgy_) for SHARED-PROJECT reuse.
--
-- Use this variant (instead of 0001) when you want the tool to live inside an
-- existing Supabase project alongside another app, isolated by table-name
-- prefix rather than by a dedicated project. The client must then be configured
-- with VITE_SUPABASE_TABLE_PREFIX=pgy_.
--
-- This is the schema currently deployed to the shared host project.

create extension if not exists "pgcrypto";

create table if not exists public.pgy_tenant (
  id          text primary key,
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.pgy_project (
  id          text primary key,
  tenant_id   text not null references public.pgy_tenant (id) on delete cascade,
  name        text not null,
  client      text not null default '',
  code        text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists pgy_project_tenant_idx on public.pgy_project (tenant_id);

create table if not exists public.pgy_segment (
  id          text primary key,
  tenant_id   text not null references public.pgy_tenant (id) on delete cascade,
  project_id  text not null references public.pgy_project (id) on delete cascade,
  payload     jsonb not null,
  updated_at  timestamptz not null default now()
);
create index if not exists pgy_segment_tenant_idx on public.pgy_segment (tenant_id);
create index if not exists pgy_segment_project_idx on public.pgy_segment (project_id);

create table if not exists public.pgy_study_input (
  segment_id  text primary key references public.pgy_segment (id) on delete cascade,
  tenant_id   text not null references public.pgy_tenant (id) on delete cascade,
  payload     jsonb not null,
  updated_at  timestamptz not null default now()
);
create index if not exists pgy_study_input_tenant_idx on public.pgy_study_input (tenant_id);

create table if not exists public.pgy_assessment_cache (
  segment_id  text primary key references public.pgy_segment (id) on delete cascade,
  tenant_id   text not null references public.pgy_tenant (id) on delete cascade,
  verdict     text not null,
  payload     jsonb not null,
  computed_at timestamptz not null default now()
);
create index if not exists pgy_assessment_cache_tenant_idx on public.pgy_assessment_cache (tenant_id);

-- tenant_id from JWT claim; anon (no claim) resolves to 'default'.
create or replace function public.pgy_jwt_tenant_id() returns text
language sql stable
set search_path = ''
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id', ''),
    'default'
  );
$$;

alter table public.pgy_tenant           enable row level security;
alter table public.pgy_project          enable row level security;
alter table public.pgy_segment          enable row level security;
alter table public.pgy_study_input      enable row level security;
alter table public.pgy_assessment_cache enable row level security;

do $$
declare t text;
begin
  foreach t in array array['pgy_project','pgy_segment','pgy_study_input','pgy_assessment_cache']
  loop
    execute format($f$
      drop policy if exists tenant_isolation on public.%I;
      create policy tenant_isolation on public.%I
        using (tenant_id = public.pgy_jwt_tenant_id())
        with check (tenant_id = public.pgy_jwt_tenant_id());
    $f$, t, t);
  end loop;
end $$;

drop policy if exists tenant_self on public.pgy_tenant;
create policy tenant_self on public.pgy_tenant
  using (id = public.pgy_jwt_tenant_id())
  with check (id = public.pgy_jwt_tenant_id());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.pgy_tenant, public.pgy_project, public.pgy_segment,
  public.pgy_study_input, public.pgy_assessment_cache
  to anon, authenticated;
