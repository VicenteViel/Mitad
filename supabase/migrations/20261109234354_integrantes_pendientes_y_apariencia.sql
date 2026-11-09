-- Apariencia de cada integrante (decisión 38): ícono + color.
-- Las filas existentes quedan con ícono hombre y color azul; luego se quitan
-- los valores por defecto para que cada función los indique explícitamente.
alter table public.integrantes
  add column avatar text not null default 'hombre'
    check (avatar in ('hombre', 'mujer')),
  add column color text not null default 'azul'
    check (color in ('azul', 'rosado', 'verde', 'naranja', 'morado', 'amarillo', 'rojo', 'celeste'));

alter table public.integrantes
  alter column avatar drop default,
  alter column color drop default;

-- crear_grupo ahora recibe el ícono de quien crea el grupo.
drop function public.crear_grupo(text, text, text);

create function public.crear_grupo(
  p_nombre text,
  p_descripcion text,
  p_nombre_integrante text,
  p_avatar text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_grupo_id uuid;
begin
  if v_usuario is null then
    raise exception 'No autenticado';
  end if;

  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Solo los usuarios registrados pueden crear grupos';
  end if;

  insert into public.grupos (nombre, descripcion)
  values (trim(p_nombre), nullif(trim(p_descripcion), ''))
  returning id into v_grupo_id;

  insert into public.integrantes (grupo_id, usuario_id, nombre, rol, avatar, color)
  values (
    v_grupo_id,
    v_usuario,
    trim(p_nombre_integrante),
    'admin',
    p_avatar,
    case p_avatar when 'mujer' then 'rosado' else 'azul' end
  );

  return v_grupo_id;
end;
$$;

revoke execute on function public.crear_grupo(text, text, text, text) from public, anon;
grant execute on function public.crear_grupo(text, text, text, text) to authenticated;

-- Agrega integrantes pendientes (decisión 2): sin usuario vinculado, rol integrante.
-- p_integrantes es una lista JSON: [{"nombre": "Diego", "avatar": "hombre"}, ...]
-- Todo se inserta en una sola transacción: si uno falla, no se agrega ninguno.
create function public.agregar_integrantes(
  p_grupo_id uuid,
  p_integrantes jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_item jsonb;
  v_avatar text;
  v_total integer := 0;
begin
  if v_usuario is null then
    raise exception 'No autenticado';
  end if;

  if not exists (
    select 1 from public.integrantes
    where grupo_id = p_grupo_id
      and usuario_id = v_usuario
      and rol = 'admin'
      and salio_en is null
  ) then
    raise exception 'Solo un admin puede agregar integrantes';
  end if;

  if jsonb_typeof(p_integrantes) is distinct from 'array' then
    raise exception 'La lista de integrantes no es válida';
  end if;

  if jsonb_array_length(p_integrantes) not between 1 and 20 then
    raise exception 'Se pueden agregar entre 1 y 20 integrantes a la vez';
  end if;

  for v_item in select value from jsonb_array_elements(p_integrantes) loop
    v_avatar := v_item ->> 'avatar';

    insert into public.integrantes (grupo_id, nombre, rol, avatar, color)
    values (
      p_grupo_id,
      trim(v_item ->> 'nombre'),
      'integrante',
      v_avatar,
      case v_avatar when 'mujer' then 'rosado' else 'azul' end
    );

    v_total := v_total + 1;
  end loop;

  return v_total;
end;
$$;

revoke execute on function public.agregar_integrantes(uuid, jsonb) from public, anon;
grant execute on function public.agregar_integrantes(uuid, jsonb) to authenticated;
