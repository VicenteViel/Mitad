import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  borrarEvidencia,
  obtenerDetalleGasto,
  obtenerEvidencias,
  subirEvidencia,
} from './api-detalle';

export function claveEvidencias(gastoId: string) {
  return ['evidencias', gastoId] as const;
}

export function useDetalleGasto(gastoId: string) {
  return useQuery({
    queryKey: ['gasto', gastoId],
    queryFn: () => obtenerDetalleGasto(gastoId),
    enabled: gastoId.length > 0,
  });
}

export function useEvidencias(gastoId: string) {
  return useQuery({
    queryKey: claveEvidencias(gastoId),
    queryFn: () => obtenerEvidencias(gastoId),
    enabled: gastoId.length > 0,
  });
}

export function useSubirEvidencia(gastoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: subirEvidencia,
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claveEvidencias(gastoId) }),
  });
}

export function useBorrarEvidencia(gastoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: borrarEvidencia,
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claveEvidencias(gastoId) }),
  });
}
