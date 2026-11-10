-- Eliminar la cuenta (decisión 6; modelo-datos.md → "Eliminar la cuenta").
-- En cada grupo del usuario pasa lo mismo que al salir, y además su nombre
-- pasa a "Ex-integrante" y se borra su apodo. Gastos, pagos y saldos se
-- conservan para el resto. Después, la Edge Function `eliminar-cuenta` borra
-- el usuario de Supabase Auth (requiere la clave de servicio).
create function public.anonimizar_usuario(p_usuario_id uuid)
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
    set nombre = 'Ex-integrante', alias = null
    where id = v_integrante;
    perform public.retirar_integrante(v_integrante);
  end loop;
end;
$$;

-- Solo la Edge Function (con la clave de servicio) puede llamarla.
revoke execute on function public.anonimizar_usuario(uuid) from public, anon, authenticated;
grant execute on function public.anonimizar_usuario(uuid) to service_role;
