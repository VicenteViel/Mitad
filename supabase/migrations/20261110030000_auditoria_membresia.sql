-- Correcciones de la auditoría de cierre de la Etapa 1.
--
-- 1. Concurrencia en membresía: si dos admins salen (o se quitan el rol) al
--    mismo tiempo, cada uno veía al otro todavía como admin y el grupo podía
--    quedar sin admin. Ahora cada cambio de membresía o de rol bloquea la fila
--    del grupo, así que se ejecutan de a uno por grupo. Orden de bloqueo
--    siempre: grupo → integrante (evita deadlocks).
-- 2. Al eliminar la cuenta, el nombre visible pasa a "Ex-rumi" (decisión 25b:
--    los usuarios nunca ven "integrante").
-- 3. Storage: quien subió una evidencia solo puede borrarla mientras siga en
--    el grupo.

create or replace function public.cambiar_rol(p_integrante_id uuid, p_rol text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_grupo_id uuid;
  v_objetivo public.integrantes;
begin
  select grupo_id into v_grupo_id from public.integrantes where id = p_integrante_id;
  if v_grupo_id is null then
    raise exception 'El rumi no existe';
  end if;
  perform 1 from public.grupos where id = v_grupo_id for update;
  perform public.admin_del_grupo(v_grupo_id);

  select * into v_objetivo from public.integrantes where id = p_integrante_id for update;

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

create or replace function public.retirar_integrante(p_integrante_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_grupo_id uuid;
  v_integrante public.integrantes;
  v_sucesor uuid;
begin
  select grupo_id into v_grupo_id from public.integrantes where id = p_integrante_id;
  if v_grupo_id is null then
    return;
  end if;
  perform 1 from public.grupos where id = v_grupo_id for update;

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

create or replace function public.tomar_admin(p_grupo_id uuid)
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
  perform 1 from public.grupos where id = p_grupo_id for update;
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

create or replace function public.anonimizar_usuario(p_usuario_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_integrante uuid;
begin
  for v_integrante in
    select id from public.integrantes where usuario_id = p_usuario_id
  loop
    update public.integrantes
    set nombre = 'Ex-rumi', alias = null
    where id = v_integrante;
    perform public.retirar_integrante(v_integrante);
  end loop;
end;
$$;

-- create or replace conserva los permisos; se repiten para dejarlos explícitos.
revoke execute on function public.retirar_integrante(uuid) from public, anon, authenticated;
revoke execute on function public.anonimizar_usuario(uuid) from public, anon, authenticated;
grant execute on function public.anonimizar_usuario(uuid) to service_role;

drop policy "Quien subió o un admin borra la evidencia" on storage.objects;
create policy "Quien subió o un admin borra la evidencia"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'evidencias'
    and (
      (
        owner_id = (select auth.uid())::text
        and public.es_integrante(((storage.foldername(name))[1])::uuid)
      )
      or public.es_admin(((storage.foldername(name))[1])::uuid)
    )
  );
