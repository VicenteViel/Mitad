create function public.crear_grupo(
  p_nombre text,
  p_descripcion text,
  p_nombre_integrante text
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

  insert into public.integrantes (grupo_id, usuario_id, nombre, rol)
  values (v_grupo_id, v_usuario, trim(p_nombre_integrante), 'admin');

  return v_grupo_id;
end;
$$;

revoke execute on function public.crear_grupo(text, text, text) from public, anon;
grant execute on function public.crear_grupo(text, text, text) to authenticated;