import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { estadoCuenta } from './estado-cuenta';

export const CLAVE_USUARIO_ACTUAL = ['usuario-actual'] as const;

// El usuario de Supabase Auth, pedido al servidor (getUser), para saber si
// su correo ya se confirmó. Se recarga al volver a Inicio o a Mi cuenta.
export function useUsuarioActual() {
  const consulta = useQuery({
    queryKey: CLAVE_USUARIO_ACTUAL,
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });
  return { ...consulta, estado: estadoCuenta(consulta.data) };
}
