-- Liquidaciones: pagos manuales entre dos rumis (decisiones 17, 18, 31 y 14b;
-- modelo-datos.md → liquidaciones). Se descuentan del saldo del par, no de
-- gastos específicos. Los saldos se calculan, nunca se guardan (regla 20).

create table public.liquidaciones (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  de uuid not null references public.integrantes (id),
  a uuid not null references public.integrantes (id),
  monto integer not null check (monto > 0),
  fecha date not null default current_date,
  declarada_por uuid not null references public.integrantes (id),
  clave_idempotencia uuid not null,
  version integer not null default 1,
  creado_en timestamptz not null default now(),
  editado_por uuid references public.integrantes (id),
  editado_en timestamptz,
  borrado_por uuid references public.integrantes (id),
  borrado_en timestamptz,
  check (de <> a),
  unique (grupo_id, clave_idempotencia)
);

create index liquidaciones_grupo_id_idx on public.liquidaciones (grupo_id);

alter table public.liquidaciones enable row level security;

create policy "Integrantes leen las liquidaciones de su grupo"
  on public.liquidaciones for select to authenticated
  using (public.es_integrante(grupo_id));

-- Quién puede declarar un pago entre `de` y `a`:
-- - si alguna parte es pendiente, solo un admin (regla 14b);
-- - si quien declara es una de las partes, sí (regla 18, sin confirmación);
-- - si no es parte, solo un admin y solo si alguna parte ya salió del grupo.
create function public.registrar_liquidacion(
  p_grupo_id uuid,
  p_de uuid,
  p_a uuid,
  p_monto integer,
  p_fecha date,
  p_clave_idempotencia uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_yo public.integrantes;
  v_de public.integrantes;
  v_a public.integrantes;
  v_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'No autenticado';
  end if;

  select * into v_yo from public.integrantes
  where grupo_id = p_grupo_id and usuario_id = (select auth.uid());
  if v_yo.id is null then
    raise exception 'No eres integrante de este grupo';
  end if;

  -- Reintento de la app: devuelve el pago ya registrado.
  select id into v_id from public.liquidaciones
  where grupo_id = p_grupo_id and clave_idempotencia = p_clave_idempotencia;
  if v_id is not null then
    return v_id;
  end if;

  if p_monto is null or p_monto <= 0 then
    raise exception 'El monto debe ser mayor que 0';
  end if;

  if p_de = p_a then
    raise exception 'Quien paga y quien recibe deben ser distintos';
  end if;

  select * into v_de from public.integrantes where id = p_de and grupo_id = p_grupo_id;
  select * into v_a from public.integrantes where id = p_a and grupo_id = p_grupo_id;
  if v_de.id is null or v_a.id is null then
    raise exception 'Las dos personas deben ser del grupo';
  end if;

  if (v_de.usuario_id is null and v_de.salio_en is null)
     or (v_a.usuario_id is null and v_a.salio_en is null) then
    if v_yo.rol <> 'admin' then
      raise exception 'Solo un admin registra pagos de un rumi pendiente';
    end if;
  elsif v_yo.id not in (v_de.id, v_a.id) then
    if v_yo.rol <> 'admin' or (v_de.salio_en is null and v_a.salio_en is null) then
      raise exception 'Solo las partes registran este pago';
    end if;
  end if;

  insert into public.liquidaciones (
    grupo_id, de, a, monto, fecha, declarada_por, clave_idempotencia
  )
  values (
    p_grupo_id, p_de, p_a, p_monto, coalesce(p_fecha, current_date), v_yo.id, p_clave_idempotencia
  )
  on conflict (grupo_id, clave_idempotencia) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.liquidaciones
    where grupo_id = p_grupo_id and clave_idempotencia = p_clave_idempotencia;
  end if;

  return v_id;
end;
$$;

revoke execute on function public.registrar_liquidacion(uuid, uuid, uuid, integer, date, uuid) from public, anon;
grant execute on function public.registrar_liquidacion(uuid, uuid, uuid, integer, date, uuid) to authenticated;

-- Evidencias también para pagos: la captura de una transferencia corresponde
-- al pago, no al gasto. Cada evidencia es de un gasto o de un pago.
alter table public.evidencias
  alter column gasto_id drop not null,
  add column liquidacion_id uuid references public.liquidaciones (id) on delete cascade,
  add constraint evidencias_un_origen check (num_nonnulls(gasto_id, liquidacion_id) = 1);

create index evidencias_liquidacion_id_idx on public.evidencias (liquidacion_id);

create function public.registrar_evidencia_liquidacion(p_liquidacion_id uuid, p_ruta text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_liquidacion public.liquidaciones;
  v_yo uuid;
  v_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'No autenticado';
  end if;

  select * into v_liquidacion from public.liquidaciones where id = p_liquidacion_id;
  if v_liquidacion.id is null then
    raise exception 'El pago no existe';
  end if;

  select id into v_yo from public.integrantes
  where grupo_id = v_liquidacion.grupo_id and usuario_id = (select auth.uid());
  if v_yo is null then
    raise exception 'No eres integrante de este grupo';
  end if;

  if p_ruta is null
     or p_ruta not like v_liquidacion.grupo_id::text || '/' || v_liquidacion.id::text || '/%' then
    raise exception 'Ruta de evidencia no válida';
  end if;

  insert into public.evidencias (liquidacion_id, grupo_id, ruta, subida_por)
  values (v_liquidacion.id, v_liquidacion.grupo_id, p_ruta, v_yo)
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.registrar_evidencia_liquidacion(uuid, text) from public, anon;
grant execute on function public.registrar_evidencia_liquidacion(uuid, text) to authenticated;
