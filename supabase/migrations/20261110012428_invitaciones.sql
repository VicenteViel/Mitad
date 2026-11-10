-- Invitaciones (decisiones 7, 8, 9 y 9b; modelo-datos.md → invitaciones).
-- Un admin genera una invitación para un integrante pendiente. El código solo
-- existe en el link o QR: aquí se guarda su hash. Quien la acepta queda
-- vinculado a ese pendiente, siempre con rol de integrante (regla 37).

-- Apodo que cada rumi elige para sí (decisión 10c).
alter table public.integrantes
  add column alias text check (char_length(trim(alias)) between 1 and 40);

create table public.invitaciones (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  token_hash text not null unique,
  integrante_id uuid references public.integrantes (id) on delete cascade,
  creada_por uuid not null references public.integrantes (id),
  creada_en timestamptz not null default now(),
  expira_en timestamptz not null default now() + interval '7 days',
  usada_en timestamptz,
  usada_por uuid references auth.users (id) on delete set null,
  revocada_en timestamptz
);

create index invitaciones_integrante_id_idx on public.invitaciones (integrante_id);

alter table public.invitaciones enable row level security;

-- Admin activo de un grupo (helper para políticas y funciones).
create function public.es_admin(p_grupo_id uuid)
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
      and rol = 'admin'
  );
$$;

create policy "Admins leen las invitaciones de su grupo"
  on public.invitaciones for select to authenticated
  using (public.es_admin(grupo_id));

-- El código se escribe como XXXXX-XXXXX; se compara sin guiones ni espacios y
-- en mayúsculas.
create function public.hash_codigo_invitacion(p_codigo text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(
    extensions.digest(upper(regexp_replace(coalesce(p_codigo, ''), '[^A-Za-z0-9]', '', 'g')), 'sha256'),
    'hex'
  );
$$;

-- Crea la invitación de un pendiente y devuelve el código (la única vez que
-- existe en claro). Revoca las invitaciones anteriores de ese pendiente.
create function public.crear_invitacion(p_integrante_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_pendiente public.integrantes;
  v_admin_id uuid;
  v_bytes bytea;
  v_codigo text := '';
begin
  if (select auth.uid()) is null then
    raise exception 'No autenticado';
  end if;

  select * into v_pendiente from public.integrantes where id = p_integrante_id;
  if v_pendiente.id is null then
    raise exception 'El integrante no existe';
  end if;

  select id into v_admin_id from public.integrantes
  where grupo_id = v_pendiente.grupo_id
    and usuario_id = (select auth.uid())
    and rol = 'admin';
  if v_admin_id is null then
    raise exception 'Solo un admin puede invitar';
  end if;

  if v_pendiente.usuario_id is not null or v_pendiente.salio_en is not null then
    raise exception 'Solo se puede invitar a un integrante pendiente';
  end if;

  -- 10 caracteres de un alfabeto de 32 sin letras confusas (0/O, 1/I).
  v_bytes := extensions.gen_random_bytes(10);
  for i in 0..9 loop
    v_codigo := v_codigo || substr(v_alfabeto, (get_byte(v_bytes, i) % 32) + 1, 1);
  end loop;

  update public.invitaciones
  set revocada_en = now()
  where integrante_id = p_integrante_id
    and usada_en is null
    and revocada_en is null;

  insert into public.invitaciones (grupo_id, token_hash, integrante_id, creada_por)
  values (v_pendiente.grupo_id, public.hash_codigo_invitacion(v_codigo), p_integrante_id, v_admin_id);

  return v_codigo;
end;
$$;

-- Acepta una invitación: vincula a quien llama con el pendiente y devuelve el
-- grupo y el lugar preparado. Bloquea la fila para que solo un canje gane.
create function public.aceptar_invitacion(p_codigo text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_invitacion public.invitaciones;
  v_pendiente public.integrantes;
  v_grupo public.grupos;
begin
  if v_usuario is null then
    raise exception 'No autenticado';
  end if;

  select * into v_invitacion from public.invitaciones
  where token_hash = public.hash_codigo_invitacion(p_codigo)
  for update;

  if v_invitacion.id is null
     or v_invitacion.usada_en is not null
     or v_invitacion.revocada_en is not null
     or v_invitacion.expira_en < now() then
    raise exception 'Invitación no válida o vencida';
  end if;

  if exists (
    select 1 from public.integrantes
    where grupo_id = v_invitacion.grupo_id and usuario_id = v_usuario
  ) then
    raise exception 'Ya eres parte de este grupo';
  end if;

  select * into v_pendiente from public.integrantes
  where id = v_invitacion.integrante_id
  for update;

  if v_pendiente.id is null or v_pendiente.usuario_id is not null or v_pendiente.salio_en is not null then
    raise exception 'Invitación no válida o vencida';
  end if;

  -- El rol no cambia: una invitación nunca entrega el rol de admin.
  update public.integrantes set usuario_id = v_usuario where id = v_pendiente.id;

  update public.invitaciones
  set usada_en = now(), usada_por = v_usuario
  where id = v_invitacion.id;

  select * into v_grupo from public.grupos where id = v_invitacion.grupo_id;

  return jsonb_build_object(
    'grupo', jsonb_build_object(
      'id', v_grupo.id,
      'nombre', v_grupo.nombre,
      'descripcion', v_grupo.descripcion
    ),
    'integrante', jsonb_build_object(
      'nombre', v_pendiente.nombre,
      'avatar', v_pendiente.avatar,
      'color', v_pendiente.color
    )
  );
end;
$$;

-- El propio rumi elige su apodo en un grupo (vacío = sin apodo).
create function public.actualizar_alias(p_grupo_id uuid, p_alias text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'No autenticado';
  end if;

  update public.integrantes
  set alias = nullif(trim(p_alias), '')
  where grupo_id = p_grupo_id and usuario_id = (select auth.uid());

  if not found then
    raise exception 'No eres integrante de este grupo';
  end if;
end;
$$;

revoke execute on function public.es_admin(uuid) from public, anon;
revoke execute on function public.hash_codigo_invitacion(text) from public, anon, authenticated;
revoke execute on function public.crear_invitacion(uuid) from public, anon;
revoke execute on function public.aceptar_invitacion(text) from public, anon;
revoke execute on function public.actualizar_alias(uuid, text) from public, anon;

grant execute on function public.es_admin(uuid) to authenticated;
grant execute on function public.crear_invitacion(uuid) to authenticated;
grant execute on function public.aceptar_invitacion(text) to authenticated;
grant execute on function public.actualizar_alias(uuid, text) to authenticated;
