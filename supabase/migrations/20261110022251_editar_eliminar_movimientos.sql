-- Editar y eliminar gastos y pagos (decisiones 14, 19, 32, 33 y 34).
-- Solo admins. Se guarda quién y cuándo editó o borró, no las versiones
-- anteriores. El borrado es lógico. `version` evita que dos admins se pisen:
-- la segunda edición se rechaza y la app pide recargar.

-- Admin activo del grupo (devuelve su integrante) o error.
create function public.admin_del_grupo(p_grupo_id uuid)
returns public.integrantes
language plpgsql
stable
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
  where grupo_id = p_grupo_id and usuario_id = (select auth.uid());
  if v_yo.id is null or v_yo.rol <> 'admin' then
    raise exception 'Solo un admin puede hacer esto';
  end if;
  return v_yo;
end;
$$;

revoke execute on function public.admin_del_grupo(uuid) from public, anon, authenticated;

create function public.editar_gasto(
  p_gasto_id uuid,
  p_version integer,
  p_descripcion text,
  p_monto integer,
  p_categoria text,
  p_pagado_por uuid,
  p_tipo_division text,
  p_participantes jsonb
)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_gasto public.gastos;
  v_yo public.integrantes;
  v_cantidad integer;
  v_validos integer;
  v_suma bigint;
  v_base integer;
  v_resto integer;
  v_pagador_participa boolean;
begin
  select * into v_gasto from public.gastos where id = p_gasto_id for update;
  if v_gasto.id is null then
    raise exception 'El gasto no existe';
  end if;

  v_yo := public.admin_del_grupo(v_gasto.grupo_id);

  if v_gasto.borrado_en is not null then
    raise exception 'El gasto está eliminado';
  end if;
  if v_gasto.version <> p_version then
    raise exception 'Otro admin modificó este gasto. Recarga e intenta de nuevo.';
  end if;

  if p_monto is null or p_monto <= 0 then
    raise exception 'El monto debe ser mayor que 0';
  end if;
  if p_tipo_division is null or p_tipo_division not in ('equitativa', 'personalizada') then
    raise exception 'Tipo de división no válido';
  end if;

  -- Quien pagó y los participantes: activos o pendientes del grupo; un
  -- ex-integrante solo si ya estaba en este gasto (regla 34).
  if not exists (
    select 1 from public.integrantes i
    where i.id = p_pagado_por and i.grupo_id = v_gasto.grupo_id
      and (i.usuario_id is not null or i.salio_en is null or i.id = v_gasto.pagado_por)
  ) then
    raise exception 'Quien pagó no es integrante del grupo';
  end if;

  if jsonb_typeof(p_participantes) is distinct from 'array' then
    raise exception 'La lista de participantes no es válida';
  end if;
  v_cantidad := jsonb_array_length(p_participantes);
  if v_cantidad = 0 then
    raise exception 'Debe haber al menos un participante';
  end if;

  select count(*) into v_validos from public.integrantes i
  where i.grupo_id = v_gasto.grupo_id
    and (
      i.usuario_id is not null or i.salio_en is null
      or exists (select 1 from public.participaciones p where p.gasto_id = v_gasto.id and p.integrante_id = i.id)
    )
    and i.id in (select (e ->> 'integrante_id')::uuid from jsonb_array_elements(p_participantes) e);
  if v_validos <> v_cantidad then
    raise exception 'Hay participantes repetidos o que no son integrantes del grupo';
  end if;

  if p_tipo_division = 'personalizada' then
    if exists (
      select 1 from jsonb_array_elements(p_participantes) e
      where jsonb_typeof(e -> 'monto') is distinct from 'number'
        or (e ->> 'monto')::numeric <= 0
        or (e ->> 'monto')::numeric <> trunc((e ->> 'monto')::numeric)
    ) then
      raise exception 'Cada participación debe ser un entero mayor que 0';
    end if;
    select sum((e ->> 'monto')::bigint) into v_suma from jsonb_array_elements(p_participantes) e;
    if v_suma <> p_monto then
      raise exception 'Las participaciones deben sumar el monto del gasto';
    end if;
  elsif p_monto < v_cantidad then
    raise exception 'El monto es menor que la cantidad de participantes';
  end if;

  update public.gastos
  set descripcion = trim(p_descripcion),
      monto = p_monto,
      categoria = p_categoria,
      pagado_por = p_pagado_por,
      tipo_division = p_tipo_division,
      version = version + 1,
      editado_por = v_yo.id,
      editado_en = now()
  where id = v_gasto.id;

  -- Las participaciones se reemplazan completas (modelo-datos.md).
  delete from public.participaciones where gasto_id = v_gasto.id;

  if p_tipo_division = 'personalizada' then
    insert into public.participaciones (gasto_id, integrante_id, monto)
    select v_gasto.id, (e ->> 'integrante_id')::uuid, (e ->> 'monto')::integer
    from jsonb_array_elements(p_participantes) e;
  else
    v_base := p_monto / v_cantidad;
    v_resto := p_monto - v_base * v_cantidad;
    v_pagador_participa := p_pagado_por in (
      select (e ->> 'integrante_id')::uuid from jsonb_array_elements(p_participantes) e
    );
    insert into public.participaciones (gasto_id, integrante_id, monto)
    select v_gasto.id, p.id, v_base + case
      when v_pagador_participa then case when p.id = p_pagado_por then v_resto else 0 end
      when p.orden <= v_resto then 1
      else 0
    end
    from (
      select i.id, row_number() over (order by i.unido_en, i.id) as orden
      from public.integrantes i
      where i.grupo_id = v_gasto.grupo_id
        and i.id in (select (e ->> 'integrante_id')::uuid from jsonb_array_elements(p_participantes) e)
    ) p;
  end if;

  return v_gasto.version + 1;
end;
$$;

create function public.eliminar_gasto(p_gasto_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_gasto public.gastos;
  v_yo public.integrantes;
begin
  select * into v_gasto from public.gastos where id = p_gasto_id for update;
  if v_gasto.id is null then
    raise exception 'El gasto no existe';
  end if;
  v_yo := public.admin_del_grupo(v_gasto.grupo_id);
  if v_gasto.borrado_en is not null then
    return; -- ya estaba eliminado (reintento)
  end if;
  update public.gastos
  set borrado_por = v_yo.id, borrado_en = now(), version = version + 1
  where id = v_gasto.id;
end;
$$;

create function public.editar_liquidacion(
  p_liquidacion_id uuid,
  p_version integer,
  p_de uuid,
  p_a uuid,
  p_monto integer
)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_liq public.liquidaciones;
  v_yo public.integrantes;
begin
  select * into v_liq from public.liquidaciones where id = p_liquidacion_id for update;
  if v_liq.id is null then
    raise exception 'El pago no existe';
  end if;
  v_yo := public.admin_del_grupo(v_liq.grupo_id);

  if v_liq.borrado_en is not null then
    raise exception 'El pago está eliminado';
  end if;
  if v_liq.version <> p_version then
    raise exception 'Otro admin modificó este pago. Recarga e intenta de nuevo.';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'El monto debe ser mayor que 0';
  end if;
  if p_de = p_a then
    raise exception 'Quien paga y quien recibe deben ser distintos';
  end if;
  if (select count(*) from public.integrantes
      where grupo_id = v_liq.grupo_id and id in (p_de, p_a)) <> 2 then
    raise exception 'Las dos personas deben ser del grupo';
  end if;

  update public.liquidaciones
  set de = p_de,
      a = p_a,
      monto = p_monto,
      version = version + 1,
      editado_por = v_yo.id,
      editado_en = now()
  where id = v_liq.id;

  return v_liq.version + 1;
end;
$$;

create function public.eliminar_liquidacion(p_liquidacion_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_liq public.liquidaciones;
  v_yo public.integrantes;
begin
  select * into v_liq from public.liquidaciones where id = p_liquidacion_id for update;
  if v_liq.id is null then
    raise exception 'El pago no existe';
  end if;
  v_yo := public.admin_del_grupo(v_liq.grupo_id);
  if v_liq.borrado_en is not null then
    return;
  end if;
  update public.liquidaciones
  set borrado_por = v_yo.id, borrado_en = now(), version = version + 1
  where id = v_liq.id;
end;
$$;

revoke execute on function public.editar_gasto(uuid, integer, text, integer, text, uuid, text, jsonb) from public, anon;
revoke execute on function public.eliminar_gasto(uuid) from public, anon;
revoke execute on function public.editar_liquidacion(uuid, integer, uuid, uuid, integer) from public, anon;
revoke execute on function public.eliminar_liquidacion(uuid) from public, anon;

grant execute on function public.editar_gasto(uuid, integer, text, integer, text, uuid, text, jsonb) to authenticated;
grant execute on function public.eliminar_gasto(uuid) to authenticated;
grant execute on function public.editar_liquidacion(uuid, integer, uuid, uuid, integer) to authenticated;
grant execute on function public.eliminar_liquidacion(uuid) to authenticated;
