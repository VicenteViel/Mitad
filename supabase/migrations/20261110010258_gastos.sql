-- Gastos y sus participaciones (docs/modelo-datos.md). La app solo lee: los
-- gastos se crean con registrar_gasto, que valida permisos y calcula la
-- división en el servidor, todo en una sola transacción.

create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  descripcion text not null check (char_length(trim(descripcion)) between 1 and 80),
  monto integer not null check (monto > 0),
  categoria text not null check (categoria in (
    'alimentacion', 'arriendo', 'servicios_basicos', 'transporte',
    'limpieza', 'compras', 'otros'
  )),
  fecha date not null default current_date,
  pagado_por uuid not null references public.integrantes (id),
  tipo_division text not null check (tipo_division in ('equitativa', 'personalizada')),
  clave_idempotencia uuid not null,
  version integer not null default 1,
  creado_por uuid not null references public.integrantes (id),
  creado_en timestamptz not null default now(),
  editado_por uuid references public.integrantes (id),
  editado_en timestamptz,
  borrado_por uuid references public.integrantes (id),
  borrado_en timestamptz,
  unique (grupo_id, clave_idempotencia)
);

create table public.participaciones (
  gasto_id uuid not null references public.gastos (id) on delete cascade,
  integrante_id uuid not null references public.integrantes (id),
  monto integer not null check (monto > 0),
  primary key (gasto_id, integrante_id)
);

create index participaciones_integrante_id_idx on public.participaciones (integrante_id);

alter table public.gastos enable row level security;
alter table public.participaciones enable row level security;

create policy "Integrantes leen los gastos de su grupo"
  on public.gastos for select to authenticated
  using (public.es_integrante(grupo_id));

create policy "Integrantes leen las participaciones de su grupo"
  on public.participaciones for select to authenticated
  using (exists (
    select 1 from public.gastos g
    where g.id = gasto_id and public.es_integrante(g.grupo_id)
  ));

-- p_participantes: [{"integrante_id": "...", "monto": 1000}, ...]
-- En la división equitativa `monto` se ignora: lo calcula esta función.
-- Si la clave de idempotencia ya existe en el grupo, devuelve ese gasto sin
-- crear otro (reintento de la app).
create function public.registrar_gasto(
  p_grupo_id uuid,
  p_descripcion text,
  p_monto integer,
  p_categoria text,
  p_fecha date,
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
  v_usuario uuid := (select auth.uid());
  v_yo public.integrantes;
  v_pagador public.integrantes;
  v_gasto_id uuid;
  v_cantidad integer;
  v_validos integer;
  v_suma bigint;
  v_base integer;
  v_resto integer;
  v_pagador_participa boolean;
begin
  if v_usuario is null then
    raise exception 'No autenticado';
  end if;

  -- Integrante activo: tiene usuario vinculado (los ex-integrantes no).
  select * into v_yo from public.integrantes
  where grupo_id = p_grupo_id and usuario_id = v_usuario;
  if v_yo.id is null then
    raise exception 'No eres integrante de este grupo';
  end if;

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

  -- Quien pagó: activo o pendiente del grupo, nunca un ex-integrante.
  select * into v_pagador from public.integrantes
  where id = p_pagado_por and grupo_id = p_grupo_id
    and (usuario_id is not null or salio_en is null);
  if v_pagador.id is null then
    raise exception 'Quien pagó no es integrante del grupo';
  end if;

  -- Regla 14b: solo un admin registra lo que pagó un pendiente.
  if v_pagador.usuario_id is null and v_yo.rol <> 'admin' then
    raise exception 'Solo un admin puede registrar un gasto pagado por un pendiente';
  end if;

  if jsonb_typeof(p_participantes) is distinct from 'array' then
    raise exception 'La lista de participantes no es válida';
  end if;

  v_cantidad := jsonb_array_length(p_participantes);
  if v_cantidad = 0 then
    raise exception 'Debe haber al menos un participante';
  end if;

  -- Cada participante, una sola vez, activo o pendiente del grupo. Los
  -- repetidos cuentan una vez en `in`, así que también hacen fallar la cuenta.
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

    select sum((e ->> 'monto')::bigint) into v_suma
    from jsonb_array_elements(p_participantes) e;
    if v_suma <> p_monto then
      raise exception 'Las participaciones deben sumar el monto del gasto';
    end if;
  elsif p_monto < v_cantidad then
    raise exception 'El monto es menor que la cantidad de participantes';
  end if;

  -- Si dos reintentos llegan a la vez, solo uno inserta; el otro devuelve el
  -- gasto que ganó.
  insert into public.gastos (
    grupo_id, descripcion, monto, categoria, fecha, pagado_por,
    tipo_division, clave_idempotencia, creado_por
  )
  values (
    p_grupo_id, trim(p_descripcion), p_monto, p_categoria,
    coalesce(p_fecha, current_date), p_pagado_por,
    p_tipo_division, p_clave_idempotencia, v_yo.id
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
    -- División equitativa (modelo-datos.md): cada uno recibe la base; el resto
    -- lo absorbe quien pagó si participa, o se reparte de a 1 peso por orden de
    -- llegada (unido_en y luego id, igual que la vista previa de la app).
    v_base := p_monto / v_cantidad;
    v_resto := p_monto - v_base * v_cantidad;
    v_pagador_participa := p_pagado_por in (
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

revoke execute on function public.registrar_gasto(uuid, text, integer, text, date, uuid, text, jsonb, uuid) from public, anon;
grant execute on function public.registrar_gasto(uuid, text, integer, text, date, uuid, text, jsonb, uuid) to authenticated;
