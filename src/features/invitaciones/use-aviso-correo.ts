import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { leerAvisoCorreo, type AvisoCorreo } from './aviso-correo';

export const CLAVE_USUARIO_ACTUAL = ['usuario-actual'] as const;

// Aviso de correo en Inicio, deducido de la cuenta:
// - sin correo (sesión anónima) → "Agrega tu correo";
// - correo agregado pero sin confirmar → "Verifica tu correo".
// En modo prueba se usa el aviso guardado en memoria.
export function useAvisoCorreo(): { aviso: AvisoCorreo; recargar: () => Promise<unknown> } {
  const { data: usuario, refetch } = useQuery({
    queryKey: CLAVE_USUARIO_ACTUAL,
    // getUser consulta al servidor, así ve si el correo ya se confirmó.
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const simulado = leerAvisoCorreo();
  let aviso: AvisoCorreo = simulado;
  if (!simulado && usuario?.is_anonymous) {
    aviso = usuario.new_email
      ? { tipo: 'verificar', correo: usuario.new_email }
      : { tipo: 'agregar' };
  }

  // refetch es estable entre renders: sirve como dependencia de efectos.
  return { aviso, recargar: refetch };
}
