import { useMutation, useQueryClient } from '@tanstack/react-query';

import { iniciarGrupo } from './api';
import { CLAVE_MIS_GRUPOS } from './use-mis-grupos';

// Sin reintentos automáticos: iniciar_grupo no es idempotente y un reintento
// podría crear el grupo dos veces. Al terminar, recarga la lista de Inicio.
export function useIniciarGrupo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: iniciarGrupo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_MIS_GRUPOS }),
  });
}
