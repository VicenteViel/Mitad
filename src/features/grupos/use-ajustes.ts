import { useMutation, useQueryClient } from '@tanstack/react-query';

import { CLAVE_MIS_GRUPOS } from './use-mis-grupos';

// Cualquier cambio de ajustes recarga lo que muestra datos del grupo: su
// detalle, la lista de Inicio, los rumis de saldos y los del formulario de gasto.
export function useAccionGrupo<T>(grupoId: string, accion: (variables: T) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accion,
    retry: false,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['grupo', grupoId] }),
        queryClient.invalidateQueries({ queryKey: CLAVE_MIS_GRUPOS }),
        queryClient.invalidateQueries({ queryKey: ['rumis-saldo', grupoId] }),
        queryClient.invalidateQueries({ queryKey: ['integrantes-gasto', grupoId] }),
      ]),
  });
}
