import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  borrarEvidencia,
  obtenerDetalleGasto,
  obtenerEvidencias,
  subirEvidencia,
  type OrigenEvidencia,
} from './api-detalle';

export function claveEvidencias(origen: OrigenEvidencia) {
  return ['evidencias', origen.tipo, origen.id] as const;
}

export function useDetalleGasto(gastoId: string) {
  return useQuery({
    queryKey: ['gasto', gastoId],
    queryFn: () => obtenerDetalleGasto(gastoId),
    enabled: gastoId.length > 0,
  });
}

export function useEvidencias(origen: OrigenEvidencia) {
  return useQuery({
    queryKey: claveEvidencias(origen),
    queryFn: () => obtenerEvidencias(origen),
    enabled: origen.id.length > 0,
  });
}

export function useSubirEvidencia(origen: OrigenEvidencia) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: subirEvidencia,
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claveEvidencias(origen) }),
  });
}

export function useBorrarEvidencia(origen: OrigenEvidencia) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: borrarEvidencia,
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claveEvidencias(origen) }),
  });
}
