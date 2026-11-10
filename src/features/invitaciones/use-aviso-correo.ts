import { useUsuarioActual } from '@/features/cuenta/use-usuario-actual';

import { leerAvisoCorreo, type AvisoCorreo } from './aviso-correo';

export { CLAVE_USUARIO_ACTUAL } from '@/features/cuenta/use-usuario-actual';

// Aviso de correo en Inicio, deducido de la cuenta:
// - sin correo (sesión anónima) → "Agrega tu correo";
// - correo agregado pero sin confirmar → "Verifica tu correo".
// En modo prueba se usa el aviso guardado en memoria.
export function useAvisoCorreo(): { aviso: AvisoCorreo; recargar: () => Promise<unknown> } {
  const { data: usuario, estado, refetch } = useUsuarioActual();

  const simulado = leerAvisoCorreo();
  let aviso: AvisoCorreo = simulado;
  if (!simulado && usuario) {
    if (estado.tipo === 'verificando') aviso = { tipo: 'verificar', correo: estado.correo };
    else if (estado.tipo === 'sin-correo') aviso = { tipo: 'agregar' };
  }

  // refetch es estable entre renders: sirve como dependencia de efectos.
  return { aviso, recargar: refetch };
}
