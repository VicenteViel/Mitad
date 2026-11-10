import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { obtenerGastos, obtenerIntegrantesGasto, registrarGasto } from './api';

export function claveGastos(grupoId: string) {
  return ['gastos', grupoId] as const;
}

export function useIntegrantesGasto(grupoId: string) {
  return useQuery({
    queryKey: ['integrantes-gasto', grupoId],
    queryFn: () => obtenerIntegrantesGasto(grupoId),
  });
}

export function useGastos(grupoId: string) {
  return useQuery({
    queryKey: claveGastos(grupoId),
    queryFn: () => obtenerGastos(grupoId),
    enabled: grupoId.length > 0,
  });
}

// Sin reintentos automáticos: el reintento lo decide la persona con el mismo
// botón, y la clave de idempotencia evita que se cree el gasto dos veces.
// Al guardar, recarga el historial de ese grupo.
export function useRegistrarGasto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registrarGasto,
    retry: false,
    onSuccess: (_id, gasto) =>
      queryClient.invalidateQueries({ queryKey: claveGastos(gasto.grupoId) }),
  });
}
