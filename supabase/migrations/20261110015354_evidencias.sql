-- Evidencias de un gasto: capturas de comprobantes (transferencias, boletas).
-- Varias por gasto; cualquier rumi activo puede subir; borra quien la subió o
-- un admin (decisión 19b). Las imágenes viven en un bucket privado de Storage
-- con la ruta {grupo_id}/{gasto_id}/{archivo}.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidencias',
  'evidencias',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/heic', 'image/webp']
)
on conflict (id) do nothing;

create table public.evidencias (
  id uuid primary key default gen_random_uuid(),
  gasto_id uuid not null references public.gastos (id) on delete cascade,
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  ruta text not null unique,
  subida_por uuid not null references public.integrantes (id),
  subida_en timestamptz not null default now()
);

create index evidencias_gasto_id_idx on public.evidencias (gasto_id);

alter table public.evidencias enable row level security;

create policy "Integrantes leen las evidencias de su grupo"
  on public.evidencias for select to authenticated
  using (public.es_integrante(grupo_id));

-- Storage: la primera carpeta de la ruta es el grupo.
create policy "Integrantes ven las evidencias de su grupo"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'evidencias'
    and public.es_integrante(((storage.foldername(name))[1])::uuid)
  );

create policy "Integrantes suben evidencias a su grupo"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'evidencias'
    and public.es_integrante(((storage.foldername(name))[1])::uuid)
  );

create policy "Quien subió o un admin borra la evidencia"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'evidencias'
    and (
      owner_id = (select auth.uid())::text
      or public.es_admin(((storage.foldername(name))[1])::uuid)
    )
  );

-- Registra una imagen ya subida a Storage como evidencia del gasto.
create function public.registrar_evidencia(p_gasto_id uuid, p_ruta text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_gasto public.gastos;
  v_yo uuid;
  v_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'No autenticado';
  end if;

  select * into v_gasto from public.gastos where id = p_gasto_id;
  if v_gasto.id is null then
    raise exception 'El gasto no existe';
  end if;

  select id into v_yo from public.integrantes
  where grupo_id = v_gasto.grupo_id and usuario_id = (select auth.uid());
  if v_yo is null then
    raise exception 'No eres integrante de este grupo';
  end if;

  -- La imagen debe estar en la carpeta de este grupo y este gasto.
  if p_ruta is null or p_ruta not like v_gasto.grupo_id::text || '/' || v_gasto.id::text || '/%' then
    raise exception 'Ruta de evidencia no válida';
  end if;

  insert into public.evidencias (gasto_id, grupo_id, ruta, subida_por)
  values (v_gasto.id, v_gasto.grupo_id, p_ruta, v_yo)
  returning id into v_id;

  return v_id;
end;
$$;

-- Borra el registro de una evidencia y devuelve su ruta para borrar la imagen.
create function public.borrar_evidencia(p_evidencia_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_evidencia public.evidencias;
  v_yo public.integrantes;
begin
  if (select auth.uid()) is null then
    raise exception 'No autenticado';
  end if;

  select * into v_evidencia from public.evidencias where id = p_evidencia_id;
  if v_evidencia.id is null then
    raise exception 'La evidencia no existe';
  end if;

  select * into v_yo from public.integrantes
  where grupo_id = v_evidencia.grupo_id and usuario_id = (select auth.uid());
  if v_yo.id is null then
    raise exception 'No eres integrante de este grupo';
  end if;

  if v_evidencia.subida_por <> v_yo.id and v_yo.rol <> 'admin' then
    raise exception 'Solo quien la subió o un admin puede borrarla';
  end if;

  delete from public.evidencias where id = v_evidencia.id;
  return v_evidencia.ruta;
end;
$$;

revoke execute on function public.registrar_evidencia(uuid, text) from public, anon;
revoke execute on function public.borrar_evidencia(uuid) from public, anon;
grant execute on function public.registrar_evidencia(uuid, text) to authenticated;
grant execute on function public.borrar_evidencia(uuid) to authenticated;
