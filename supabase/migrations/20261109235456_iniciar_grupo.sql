-- El grupo se arma como borrador en el teléfono y se crea completo al tocar
-- "Iniciar grupo": el grupo, quien lo crea (admin) y los integrantes pendientes,
-- todo en una sola transacción. Si algo falla, no se guarda nada.
-- Reemplaza a crear_grupo. agregar_integrantes se mantiene para sumar
-- pendientes a un grupo que ya existe.
drop function public.crear_grupo(text, text, text, text);

-- p_integrantes: [{"nombre": "Diego", "avatar": "hombre", "color": "azul"}, ...]
-- Puede ser una lista vacía (alguien que vive solo).
create function public.iniciar_grupo(
  p_nombre text,
  p_descripcion text,
  p_nombre_integrante text,
  p_avatar text,
  p_color text,
  p_integrantes jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_grupo_id uuid;
  v_item jsonb;
begin
  if v_usuario is null then
    raise exception 'No autenticado';
  end if;

  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Solo los usuarios registrados pueden crear grupos';
  end if;

  if jsonb_typeof(p_integrantes) is distinct from 'array' then
    raise exception 'La lista de integrantes no es válida';
  end if;

  if jsonb_array_length(p_integrantes) > 20 then
    raise exception 'Se pueden agregar hasta 20 integrantes';
  end if;

  insert into public.grupos (nombre, descripcion)
  values (trim(p_nombre), nullif(trim(p_descripcion), ''))
  returning id into v_grupo_id;

  insert into public.integrantes (grupo_id, usuario_id, nombre, rol, avatar, color)
  values (v_grupo_id, v_usuario, trim(p_nombre_integrante), 'admin', p_avatar, p_color);

  for v_item in select value from jsonb_array_elements(p_integrantes) loop
    insert into public.integrantes (grupo_id, nombre, rol, avatar, color)
    values (
      v_grupo_id,
      trim(v_item ->> 'nombre'),
      'integrante',
      v_item ->> 'avatar',
      v_item ->> 'color'
    );
  end loop;

  return v_grupo_id;
end;
$$;

revoke execute on function public.iniciar_grupo(text, text, text, text, text, jsonb) from public, anon;
grant execute on function public.iniciar_grupo(text, text, text, text, text, jsonb) to authenticated;
