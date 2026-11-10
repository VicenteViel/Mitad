import { useMutation, useQuery } from '@tanstack/react-query';

import { obtenerIntegrantesGasto, registrarGasto } from './api';

export function useIntegrantesGasto(grupoId: string) {
  return useQuery({
    queryKey: ['integrantes-gasto', grupoId],
    queryFn: () => obtenerIntegrantesGasto(grupoId),
  });
}

// Sin reintentos automáticos: el reintento lo decide la persona con el mismo
// botón, y la clave de idempotencia evita que se cree el gasto dos veces.
export function useRegistrarGasto() {
  return useMutation({ mutationFn: registrarGasto, retry: false });
}
