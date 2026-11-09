create table public.grupos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(trim(nombre)) between 1 and 60),
  descripcion text check (char_length(descripcion) <= 200),
  creado_en timestamptz not null default now()
);

create table public.integrantes (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete set null,
  nombre text not null check (char_length(trim(nombre)) between 1 and 40),
  rol text not null default 'integrante' check (rol in ('admin', 'integrante')),
  unido_en timestamptz not null default now(),
  salio_en timestamptz,
  unique (grupo_id, usuario_id)
);

create index integrantes_usuario_id_idx on public.integrantes (usuario_id);

alter table public.grupos enable row level security;
alter table public.integrantes enable row level security;

create function public.es_integrante(p_grupo_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.integrantes
    where grupo_id = p_grupo_id
      and usuario_id = (select auth.uid())
  );
$$;

create policy "Integrantes leen su grupo"
  on public.grupos for select to authenticated
  using (public.es_integrante(id));

create policy "Integrantes leen a los integrantes de su grupo"
  on public.integrantes for select to authenticated
  using (public.es_integrante(grupo_id));