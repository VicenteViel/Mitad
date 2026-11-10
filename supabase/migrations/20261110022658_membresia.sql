-- Ajustes del grupo y membresía (decisiones 5, 11, 12, 13, 35, 36, 37 y 41;
-- modelo-datos.md → Funciones y "Salir del grupo").

-- ¿El usuario tiene cuenta con correo (no anónima)? Solo ellos pueden ser admin.
create function public.es_usuario_registrado(p_usuario_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users
    where id = p_usuario_id and coalesce(is_anonymous, false) = false and email is not null
  );
$$;

revoke execute on function public.es_usuario_registrado(uuid) from public, anon, authenticated;

-- Editar nombre y descripción del grupo (admins).
create function public.editar_grupo(p_grupo_id uuid, p_nombre text, p_descripcion text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.admin_del_grupo(p_grupo_id);
  update public.grupos
  set nombre = trim(p_nombre), descripcion = nullif(trim(p_descripcion), '')
  where id = p_grupo_id;
end;
$$;

-- Dar o quitar el rol de admin (admins). Admin solo a registrados (regla 12);
-- nunca quitar el último admin (regla 35).
create function public.cambiar_rol(p_integrante_id uuid, p_rol text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_objetivo public.integrantes;
begin
  select * into v_objetivo from public.integrantes where id = p_integrante_id for update;
  if v_objetivo.id is null then
    raise exception 'El rumi no existe';
  end if;
  perform public.admin_del_grupo(v_objetivo.grupo_id);

  if p_rol not in ('admin', 'integrante') then
    raise exception 'Rol no válido';
  end if;
  if v_objetivo.usuario_id is null then
    raise exception 'Solo un rumi activo puede cambiar de rol';
  end if;

  if p_rol = 'admin' then
    if not public.es_usuario_registrado(v_objetivo.usuario_id) then
      raise exception 'Solo un rumi con correo puede ser admin';
    end if;
  elsif v_objetivo.rol = 'admin' and (
    select count(*) from public.integrantes
    where grupo_id = v_objetivo.grupo_id and rol = 'admin' and usuario_id is not null
  ) <= 1 then
    raise exception 'No puedes quitar el rol al último admin';
  end if;

  update public.integrantes set rol = p_rol where id = v_objetivo.id;
end;
$$;

-- Lo que pasa cuando un integrante deja el grupo (por salir o porque lo
-- quitan): queda sin usuario, con salio_en y sin rol de admin. Si era el
-- último admin, pasa a serlo el registrado más antiguo (regla 13); si ya no
-- queda nadie con cuenta, el grupo se borra (regla 36). Uso interno.
create function public.retirar_integrante(p_integrante_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_integrante public.integrantes;
  v_sucesor uuid;
begin
  select * into v_integrante from public.integrantes where id = p_integrante_id for update;

  update public.integrantes
  set usuario_id = null,
      salio_en = coalesce(salio_en, now()),
      rol = 'integrante'
  where id = v_integrante.id;

  -- Las invitaciones de ese lugar dejan de servir.
  update public.invitaciones
  set revocada_en = now()
  where integrante_id = v_integrante.id and usada_en is null and revocada_en is null;

  if not exists (
    select 1 from public.integrantes
    where grupo_id = v_integrante.grupo_id and usuario_id is not null
  ) then
    delete from public.grupos where id = v_integrante.grupo_id;
    return;
  end if;

  if v_integrante.rol = 'admin' and not exists (
    select 1 from public.integrantes
    where grupo_id = v_integrante.grupo_id and rol = 'admin' and usuario_id is not null
  ) then
    select i.id into v_sucesor from public.integrantes i
    where i.grupo_id = v_integrante.grupo_id
      and i.usuario_id is not null
      and public.es_usuario_registrado(i.usuario_id)
    order by i.unido_en, i.id
    limit 1;
    -- Si no hay registrados, el grupo queda sin admin (regla 41).
    if v_sucesor is not null then
      update public.integrantes set rol = 'admin' where id = v_sucesor;
    end if;
  end if;
end;
$$;

revoke execute on function public.retirar_integrante(uuid) from public, anon, authenticated;

-- Salir del grupo (cualquier rumi activo). Se puede con saldo pendiente: el
-- saldo y el historial quedan (regla 5).
create function public.salir_del_grupo(p_grupo_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_yo uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'No autenticado';
  end if;
  select id into v_yo from public.integrantes
  where grupo_id = p_grupo_id and usuario_id = (select auth.uid());
  if v_yo is null then
    raise exception 'No eres integrante de este grupo';
  end if;
  perform public.retirar_integrante(v_yo);
end;
$$;

-- Quitar a un rumi (admins). Puede ser activo o pendiente; para uno mismo se
-- usa "Salir del grupo".
create function public.quitar_integrante(p_integrante_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_objetivo public.integrantes;
  v_yo public.integrantes;
begin
  select * into v_objetivo from public.integrantes where id = p_integrante_id;
  if v_objetivo.id is null or v_objetivo.salio_en is not null then
    raise exception 'El rumi no existe o ya salió';
  end if;
  v_yo := public.admin_del_grupo(v_objetivo.grupo_id);
  if v_objetivo.id = v_yo.id then
    raise exception 'Para irte, usa Salir del grupo';
  end if;
  perform public.retirar_integrante(v_objetivo.id);
end;
$$;

-- Tomar el rol de admin cuando el grupo no tiene ninguno (regla 41).
create function public.tomar_admin(p_grupo_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_yo public.integrantes;
begin
  if (select auth.uid()) is null then
    raise exception 'No autenticado';
  end if;
  select * into v_yo from public.integrantes
  where grupo_id = p_grupo_id and usuario_id = (select auth.uid())
  for update;
  if v_yo.id is null then
    raise exception 'No eres integrante de este grupo';
  end if;
  if not public.es_usuario_registrado(v_yo.usuario_id) then
    raise exception 'Agrega tu correo para poder ser admin';
  end if;
  if exists (
    select 1 from public.integrantes
    where grupo_id = p_grupo_id and rol = 'admin' and usuario_id is not null
  ) then
    raise exception 'El grupo ya tiene admin';
  end if;
  update public.integrantes set rol = 'admin' where id = v_yo.id;
end;
$$;

-- Cambiar ícono y color: el propio rumi activo, o un admin para un pendiente.
create function public.cambiar_apariencia(p_integrante_id uuid, p_avatar text, p_color text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_objetivo public.integrantes;
  v_yo public.integrantes;
begin
  if (select auth.uid()) is null then
    raise exception 'No autenticado';
  end if;
  select * into v_objetivo from public.integrantes where id = p_integrante_id;
  if v_objetivo.id is null or v_objetivo.salio_en is not null then
    raise exception 'El rumi no existe o ya salió';
  end if;
  select * into v_yo from public.integrantes
  where grupo_id = v_objetivo.grupo_id and usuario_id = (select auth.uid());
  if v_yo.id is null then
    raise exception 'No eres integrante de este grupo';
  end if;
  if not (
    v_objetivo.id = v_yo.id
    or (v_objetivo.usuario_id is null and v_yo.rol = 'admin')
  ) then
    raise exception 'Solo puedes cambiar tu apariencia o la de un pendiente si eres admin';
  end if;
  -- Los valores los validan los check de la tabla.
  update public.integrantes set avatar = p_avatar, color = p_color where id = v_objetivo.id;
end;
$$;

revoke execute on function public.editar_grupo(uuid, text, text) from public, anon;
revoke execute on function public.cambiar_rol(uuid, text) from public, anon;
revoke execute on function public.salir_del_grupo(uuid) from public, anon;
revoke execute on function public.quitar_integrante(uuid) from public, anon;
revoke execute on function public.tomar_admin(uuid) from public, anon;
revoke execute on function public.cambiar_apariencia(uuid, text, text) from public, anon;

grant execute on function public.editar_grupo(uuid, text, text) to authenticated;
grant execute on function public.cambiar_rol(uuid, text) to authenticated;
grant execute on function public.salir_del_grupo(uuid) to authenticated;
grant execute on function public.quitar_integrante(uuid) to authenticated;
grant execute on function public.tomar_admin(uuid) to authenticated;
grant execute on function public.cambiar_apariencia(uuid, text, text) to authenticated;

-- Agregar pendientes a un grupo existente: agregar_integrantes ya existe
-- (migración 20261109234354). Se le concede permiso de nuevo por claridad.
grant execute on function public.agregar_integrantes(uuid, jsonb) to authenticated;
