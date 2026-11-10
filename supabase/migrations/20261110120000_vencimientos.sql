-- Fechas límite, gastos por cubrir y gastos mensuales (decisiones 48 a 53).
--
-- - Fecha límite (opcional) en cualquier gasto.
-- - Gasto "por cubrir": sin pagado_por. Nadie lo ha pagado aún; cada rumi paga
--   su parte por fuera (ej. al arrendador) y la marca como pagada. No mueve
--   los saldos entre rumis. Solo lo crean admins.
-- - Gasto mensual: una plantilla que genera un gasto cada mes con fecha límite
--   el día elegido. Se genera de forma perezosa e idempotente: al abrir el
--   grupo, la app llama a generar_gastos_mensuales.

-- 1. Plantillas de gastos mensuales -----------------------------------------

create table public.gastos_mensuales (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  descripcion text not null check (char_length(trim(descripcion)) between 1 and 80),
  monto integer not null check (monto > 0),
  categoria text not null check (categoria in (
    'alimentacion', 'arriendo', 'servicios_basicos', 'transporte',
    'limpieza', 'compras', 'otros'
  )),
  -- Vacío = por cubrir.
  pagado_por uuid references public.integrantes (id),
  tipo_division text not null check (tipo_division in ('equitativa', 'personalizada')),
  -- Igual que p_participantes de registrar_gasto.
  participantes jsonb not null,
  -- Si el mes tiene menos días, vence el último día del mes.
  dia_vencimiento integer not null check (dia_vencimiento between 1 and 31),
  -- Primer día del próximo mes por generar.
  proximo_mes date not null check (extract(day from proximo_mes) = 1),
  activo boolean not null default true,
  clave_idempotencia uuid not null,
  creado_por uuid not null references public.integrantes (id),
  creado_en timestamptz not null default now(),
  detenido_por uuid references public.integrantes (id),
  detenido_en timestamptz,
  unique (grupo_id, clave_idempotencia)
);

create index gastos_mensuales_grupo_id_idx on public.gastos_mensuales (grupo_id);

alter table public.gastos_mensuales enable row level security;

create policy "Integrantes leen los gastos mensuales de su grupo"
  on public.gastos_mensuales for select to authenticated
  using (public.es_integrante(grupo_id));

-- 2. Columnas nuevas ----------------------------------------------------------

alter table public.gastos
  alter column pagado_por drop not null,
  add column fecha_limite date,
  add column gasto_mensual_id uuid references public.gastos_mensuales (id) on delete set null;

create index gastos_gasto_mensual_id_idx on public.gastos (gasto_mensual_id);

-- Solo en gastos por cubrir: cuándo y quién marcó la parte como pagada.
alter table public.participaciones
  add column pagada_en timestamptz,
  add column pagada_marcada_por uuid references public.integrantes (id);

-- 3. Fecha de hoy en Chile (las fechas del grupo son locales). ---------------

create function public.hoy_chile()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Santiago')::date;
$$;

-- 4. Inserción común (uso interno) ---------------------------------------------
-- Valida participantes y división, inserta el gasto y sus participaciones.
-- No revisa quién llama: eso lo hace cada función pública. Devuelve el id del
-- gasto (el existente si la clave ya se usó).

create function public.insertar_gasto(
  p_grupo_id uuid,
  p_descripcion text,
  p_monto integer,
  p_categoria text,
  p_fecha date,
  p_fecha_limite date,
  p_pagado_por uuid,
  p_tipo_division text,
  p_participantes jsonb,
  p_clave_idempotencia uuid,
  p_creado_por uuid,
  p_gasto_mensual_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gasto_id uuid;
  v_cantidad integer;
  v_validos integer;
  v_suma bigint;
  v_base integer;
  v_resto integer;
  v_pagador_participa boolean;
begin
  select id into v_gasto_id from public.gastos
  where grupo_id = p_grupo_id and clave_idempotencia = p_clave_idempotencia;
  if v_gasto_id is not null then
    return v_gasto_id;
  end if;

  if p_monto is null or p_monto <= 0 then
    raise exception 'El monto debe ser mayor que 0';
  end if;
  if p_tipo_division is null or p_tipo_division not in ('equitativa', 'personalizada') then
    raise exception 'Tipo de división no válido';
  end if;

  if p_pagado_por is not null and not exists (
    select 1 from public.integrantes
    where id = p_pagado_por and grupo_id = p_grupo_id
      and (usuario_id is not null or salio_en is null)
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

  -- Cada participante, una sola vez, activo o pendiente del grupo.
  select count(*) into v_validos from public.integrantes
  where grupo_id = p_grupo_id
    and (usuario_id is not null or salio_en is null)
    and id in (
      select (e ->> 'integrante_id')::uuid from jsonb_array_elements(p_participantes) e
    );
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

  insert into public.gastos (
    grupo_id, descripcion, monto, categoria, fecha, fecha_limite, pagado_por,
    tipo_division, clave_idempotencia, creado_por, gasto_mensual_id
  )
  values (
    p_grupo_id, trim(p_descripcion), p_monto, p_categoria,
    coalesce(p_fecha, public.hoy_chile()), p_fecha_limite, p_pagado_por,
    p_tipo_division, p_clave_idempotencia, p_creado_por, p_gasto_mensual_id
  )
  on conflict (grupo_id, clave_idempotencia) do nothing
  returning id into v_gasto_id;

  if v_gasto_id is null then
    select id into v_gasto_id from public.gastos
    where grupo_id = p_grupo_id and clave_idempotencia = p_clave_idempotencia;
    return v_gasto_id;
  end if;

  if p_tipo_division = 'personalizada' then
    insert into public.participaciones (gasto_id, integrante_id, monto)
    select v_gasto_id, (e ->> 'integrante_id')::uuid, (e ->> 'monto')::integer
    from jsonb_array_elements(p_participantes) e;
  else
    -- División equitativa: el resto lo absorbe quien pagó si participa; si no
    -- participa o el gasto es por cubrir, se reparte de a 1 peso por orden de
    -- llegada (unido_en y luego id).
    v_base := p_monto / v_cantidad;
    v_resto := p_monto - v_base * v_cantidad;
    v_pagador_participa := p_pagado_por is not null and p_pagado_por in (
      select (e ->> 'integrante_id')::uuid from jsonb_array_elements(p_participantes) e
    );

    insert into public.participaciones (gasto_id, integrante_id, monto)
    select v_gasto_id, p.id, v_base + case
      when v_pagador_participa then case when p.id = p_pagado_por then v_resto else 0 end
      when p.orden <= v_resto then 1
      else 0
    end
    from (
      select i.id, row_number() over (order by i.unido_en, i.id) as orden
      from public.integrantes i
      where i.grupo_id = p_grupo_id
        and i.id in (
          select (e ->> 'integrante_id')::uuid from jsonb_array_elements(p_participantes) e
        )
    ) p;
  end if;

  return v_gasto_id;
end;
$$;

revoke execute on function public.insertar_gasto(uuid, text, integer, text, date, date, uuid, text, jsonb, uuid, uuid, uuid) from public, anon, authenticated;

-- 5. registrar_gasto: ahora con fecha límite y por cubrir ---------------------

drop function public.registrar_gasto(uuid, text, integer, text, date, uuid, text, jsonb, uuid);

create function public.registrar_gasto(
  p_grupo_id uuid,
  p_descripcion text,
  p_monto integer,
  p_categoria text,
  p_fecha date,
  p_fecha_limite date,
  p_pagado_por uuid,
  p_tipo_division text,
  p_participantes jsonb,
  p_clave_idempotencia uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_yo public.integrantes;
  v_pagador public.integrantes;
begin
  if (select auth.uid()) is null then
    raise exception 'No autenticado';
  end if;
  select * into v_yo from public.integrantes
  where grupo_id = p_grupo_id and usuario_id = (select auth.uid());
  if v_yo.id is null then
    raise exception 'No eres integrante de este grupo';
  end if;

  if p_pagado_por is null then
    if v_yo.rol <> 'admin' then
      raise exception 'Solo un admin registra gastos por cubrir';
    end if;
  else
    select * into v_pagador from public.integrantes
    where id = p_pagado_por and grupo_id = p_grupo_id;
    -- Regla 14b: solo un admin registra lo que pagó un pendiente.
    if v_pagador.id is not null and v_pagador.usuario_id is null and v_yo.rol <> 'admin' then
      raise exception 'Solo un admin puede registrar un gasto pagado por un pendiente';
    end if;
  end if;

  return public.insertar_gasto(
    p_grupo_id, p_descripcion, p_monto, p_categoria, p_fecha, p_fecha_limite,
    p_pagado_por, p_tipo_division, p_participantes, p_clave_idempotencia, v_yo.id, null
  );
end;
$$;

revoke execute on function public.registrar_gasto(uuid, text, integer, text, date, date, uuid, text, jsonb, uuid) from public, anon;
grant execute on function public.registrar_gasto(uuid, text, integer, text, date, date, uuid, text, jsonb, uuid) to authenticated;

-- 6. Gastos mensuales ----------------------------------------------------------

-- Fecha límite del mes `p_mes` (primer día del mes) para el día elegido.
create function public.vencimiento_del_mes(p_mes date, p_dia integer)
returns date
language sql
immutable
set search_path = ''
as $$
  select p_mes + (least(
    p_dia,
    extract(day from (p_mes + interval '1 month' - interval '1 day'))::integer
  ) - 1);
$$;

-- Genera los gastos de los meses que ya empezaron. Idempotente: la clave de
-- cada gasto sale de la plantilla y el mes, así que llamarla dos veces (o a
-- la vez desde dos teléfonos) no duplica nada.
create function public.generar_gastos_mensuales(p_grupo_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plantilla public.gastos_mensuales;
  v_mes_actual date := date_trunc('month', public.hoy_chile())::date;
  v_participantes jsonb;
  v_monto integer;
  v_creados integer := 0;
begin
  if not public.es_integrante(p_grupo_id) then
    raise exception 'No eres integrante de este grupo';
  end if;

  for v_plantilla in
    select * from public.gastos_mensuales
    where grupo_id = p_grupo_id and activo and proximo_mes <= v_mes_actual
    for update
  loop
    while v_plantilla.proximo_mes <= v_mes_actual and v_plantilla.activo loop
      -- Participantes que siguen en el grupo (activos o pendientes).
      select coalesce(jsonb_agg(e), '[]'::jsonb) into v_participantes
      from jsonb_array_elements(v_plantilla.participantes) e
      join public.integrantes i on i.id = (e ->> 'integrante_id')::uuid
      where i.grupo_id = p_grupo_id and (i.usuario_id is not null or i.salio_en is null);

      v_monto := v_plantilla.monto;
      if v_plantilla.tipo_division = 'personalizada' then
        -- shortcut: si alguien salió, su parte deja de cobrarse y el total
        -- baja. Si pasa seguido, pausar la plantilla y avisar al admin.
        select coalesce(sum((e ->> 'monto')::integer), 0) into v_monto
        from jsonb_array_elements(v_participantes) e;
      end if;

      -- Sin participantes, o quien pagaba ya no está: se detiene.
      if jsonb_array_length(v_participantes) = 0
         or v_monto < jsonb_array_length(v_participantes)
         or (v_plantilla.pagado_por is not null and not exists (
           select 1 from public.integrantes
           where id = v_plantilla.pagado_por and (usuario_id is not null or salio_en is null)
         )) then
        update public.gastos_mensuales
        set activo = false, detenido_en = now()
        where id = v_plantilla.id;
        v_plantilla.activo := false;
        exit;
      end if;

      perform public.insertar_gasto(
        p_grupo_id,
        v_plantilla.descripcion,
        v_monto,
        v_plantilla.categoria,
        v_plantilla.proximo_mes,
        public.vencimiento_del_mes(v_plantilla.proximo_mes, v_plantilla.dia_vencimiento),
        v_plantilla.pagado_por,
        v_plantilla.tipo_division,
        v_participantes,
        md5(v_plantilla.id::text || v_plantilla.proximo_mes::text)::uuid,
        v_plantilla.creado_por,
        v_plantilla.id
      );
      v_creados := v_creados + 1;

      v_plantilla.proximo_mes := (v_plantilla.proximo_mes + interval '1 month')::date;
      update public.gastos_mensuales
      set proximo_mes = v_plantilla.proximo_mes
      where id = v_plantilla.id;
    end loop;
  end loop;

  return v_creados;
end;
$$;

-- Crea la plantilla (solo admins) y genera el gasto de este mes si su fecha
-- límite es hoy o después; si ya pasó, el primero será el del mes siguiente.
create function public.crear_gasto_mensual(
  p_grupo_id uuid,
  p_descripcion text,
  p_monto integer,
  p_categoria text,
  p_dia_vencimiento integer,
  p_pagado_por uuid,
  p_tipo_division text,
  p_participantes jsonb,
  p_clave_idempotencia uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_yo public.integrantes;
  v_id uuid;
  v_hoy date := public.hoy_chile();
  v_mes date := date_trunc('month', public.hoy_chile())::date;
  v_prueba uuid;
begin
  v_yo := public.admin_del_grupo(p_grupo_id);

  select id into v_id from public.gastos_mensuales
  where grupo_id = p_grupo_id and clave_idempotencia = p_clave_idempotencia;
  if v_id is not null then
    return v_id;
  end if;

  if p_dia_vencimiento is null or p_dia_vencimiento not between 1 and 31 then
    raise exception 'El día de vencimiento debe estar entre 1 y 31';
  end if;
  if public.vencimiento_del_mes(v_mes, p_dia_vencimiento) < v_hoy then
    v_mes := (v_mes + interval '1 month')::date;
  end if;

  -- Valida los datos con las mismas reglas de un gasto normal, dentro de un
  -- subbloque que se deshace: así la plantilla nunca guarda datos inválidos.
  begin
    v_prueba := public.insertar_gasto(
      p_grupo_id, p_descripcion, p_monto, p_categoria, v_mes, null,
      p_pagado_por, p_tipo_division, p_participantes, gen_random_uuid(), v_yo.id, null
    );
    raise exception using errcode = 'P0100', message = 'validado';
  exception
    when sqlstate 'P0100' then null;
  end;

  insert into public.gastos_mensuales (
    grupo_id, descripcion, monto, categoria, pagado_por, tipo_division,
    participantes, dia_vencimiento, proximo_mes, clave_idempotencia, creado_por
  )
  values (
    p_grupo_id, trim(p_descripcion), p_monto, p_categoria, p_pagado_por, p_tipo_division,
    p_participantes, p_dia_vencimiento, v_mes, p_clave_idempotencia, v_yo.id
  )
  on conflict (grupo_id, clave_idempotencia) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.gastos_mensuales
    where grupo_id = p_grupo_id and clave_idempotencia = p_clave_idempotencia;
    return v_id;
  end if;

  perform public.generar_gastos_mensuales(p_grupo_id);
  return v_id;
end;
$$;

-- Deja de generar gastos (admins). Los ya generados se conservan.
create function public.detener_gasto_mensual(p_gasto_mensual_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plantilla public.gastos_mensuales;
  v_yo public.integrantes;
begin
  select * into v_plantilla from public.gastos_mensuales where id = p_gasto_mensual_id for update;
  if v_plantilla.id is null then
    raise exception 'El gasto mensual no existe';
  end if;
  v_yo := public.admin_del_grupo(v_plantilla.grupo_id);
  if not v_plantilla.activo then
    return;
  end if;
  update public.gastos_mensuales
  set activo = false, detenido_por = v_yo.id, detenido_en = now()
  where id = v_plantilla.id;
end;
$$;

-- 7. Marcar mi parte de un gasto por cubrir ------------------------------------

-- La propia persona, o un admin (por ejemplo, para un pendiente). p_pagada =
-- false la vuelve a dejar como no pagada.
create function public.marcar_parte_pagada(p_gasto_id uuid, p_integrante_id uuid, p_pagada boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gasto public.gastos;
  v_yo public.integrantes;
begin
  if (select auth.uid()) is null then
    raise exception 'No autenticado';
  end if;
  select * into v_gasto from public.gastos where id = p_gasto_id;
  if v_gasto.id is null or v_gasto.borrado_en is not null then
    raise exception 'El gasto no existe o está eliminado';
  end if;
  if v_gasto.pagado_por is not null then
    raise exception 'Este gasto ya lo pagó alguien: se salda con un pago entre rumis';
  end if;

  select * into v_yo from public.integrantes
  where grupo_id = v_gasto.grupo_id and usuario_id = (select auth.uid());
  if v_yo.id is null then
    raise exception 'No eres integrante de este grupo';
  end if;
  if v_yo.id <> p_integrante_id and v_yo.rol <> 'admin' then
    raise exception 'Solo puedes marcar tu parte, o la de otro si eres admin';
  end if;

  update public.participaciones
  set pagada_en = case when p_pagada then coalesce(pagada_en, now()) end,
      pagada_marcada_por = case when p_pagada then coalesce(pagada_marcada_por, v_yo.id) end
  where gasto_id = v_gasto.id and integrante_id = p_integrante_id;
  if not found then
    raise exception 'Ese rumi no participa en este gasto';
  end if;
end;
$$;

-- 8. editar_gasto: con fecha límite y por cubrir --------------------------------

drop function public.editar_gasto(uuid, integer, text, integer, text, uuid, text, jsonb);

create function public.editar_gasto(
  p_gasto_id uuid,
  p_version integer,
  p_descripcion text,
  p_monto integer,
  p_categoria text,
  p_fecha_limite date,
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
  v_pagadas jsonb;
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

  -- Quien pagó (o nadie: por cubrir): activo o pendiente del grupo; un
  -- ex-integrante solo si ya era quien pagó (regla 34).
  if p_pagado_por is not null and not exists (
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

  -- Si sigue por cubrir, se conserva quién ya marcó su parte como pagada.
  select jsonb_object_agg(
    integrante_id::text,
    jsonb_build_object('en', pagada_en, 'por', pagada_marcada_por)
  ) into v_pagadas
  from public.participaciones
  where gasto_id = v_gasto.id and pagada_en is not null;

  update public.gastos
  set descripcion = trim(p_descripcion),
      monto = p_monto,
      categoria = p_categoria,
      fecha_limite = p_fecha_limite,
      pagado_por = p_pagado_por,
      tipo_division = p_tipo_division,
      version = version + 1,
      editado_por = v_yo.id,
      editado_en = now()
  where id = v_gasto.id;

  delete from public.participaciones where gasto_id = v_gasto.id;

  if p_tipo_division = 'personalizada' then
    insert into public.participaciones (gasto_id, integrante_id, monto)
    select v_gasto.id, (e ->> 'integrante_id')::uuid, (e ->> 'monto')::integer
    from jsonb_array_elements(p_participantes) e;
  else
    v_base := p_monto / v_cantidad;
    v_resto := p_monto - v_base * v_cantidad;
    v_pagador_participa := p_pagado_por is not null and p_pagado_por in (
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

  if p_pagado_por is null and v_pagadas is not null then
    update public.participaciones p
    set pagada_en = (v_pagadas -> p.integrante_id::text ->> 'en')::timestamptz,
        pagada_marcada_por = (v_pagadas -> p.integrante_id::text ->> 'por')::uuid
    where p.gasto_id = v_gasto.id and v_pagadas ? p.integrante_id::text;
  end if;

  return v_gasto.version + 1;
end;
$$;

-- 9. Permisos -------------------------------------------------------------------

revoke execute on function public.generar_gastos_mensuales(uuid) from public, anon;
revoke execute on function public.crear_gasto_mensual(uuid, text, integer, text, integer, uuid, text, jsonb, uuid) from public, anon;
revoke execute on function public.detener_gasto_mensual(uuid) from public, anon;
revoke execute on function public.marcar_parte_pagada(uuid, uuid, boolean) from public, anon;
revoke execute on function public.editar_gasto(uuid, integer, text, integer, text, date, uuid, text, jsonb) from public, anon;

grant execute on function public.generar_gastos_mensuales(uuid) to authenticated;
grant execute on function public.crear_gasto_mensual(uuid, text, integer, text, integer, uuid, text, jsonb, uuid) to authenticated;
grant execute on function public.detener_gasto_mensual(uuid) to authenticated;
grant execute on function public.marcar_parte_pagada(uuid, uuid, boolean) to authenticated;
grant execute on function public.editar_gasto(uuid, integer, text, integer, text, date, uuid, text, jsonb) to authenticated;
