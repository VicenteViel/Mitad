import { useMutation } from '@tanstack/react-query';

import { iniciarGrupo } from './api';

// Sin reintentos automáticos: iniciar_grupo no es idempotente y un reintento
// podría crear el grupo dos veces.
export function useIniciarGrupo() {
  return useMutation({ mutationFn: iniciarGrupo });
}
