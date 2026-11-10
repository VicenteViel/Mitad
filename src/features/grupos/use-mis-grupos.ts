import { useQuery } from '@tanstack/react-query';

import { obtenerMisGrupos } from './api';

// Clave de caché compartida: quien cambie grupos la invalida para recargar Inicio.
export const CLAVE_MIS_GRUPOS = ['mis-grupos'] as const;

export function useMisGrupos() {
  return useQuery({ queryKey: CLAVE_MIS_GRUPOS, queryFn: obtenerMisGrupos });
}
