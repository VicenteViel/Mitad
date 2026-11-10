import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  borrarEvidencia,
  editarGasto,
  eliminarGasto,
  obtenerDetalleGasto,
  obtenerEvidencias,
  subirEvidencia,
  type OrigenEvidencia,
} from './api-detalle';
import { claveGastos } from './use-registrar-gasto';

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

// Editar y eliminar (solo admins): recargan el detalle y el historial del grupo.
export function useEditarGasto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: editarGasto,
    retry: false,
    onSuccess: (_r, cambios) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['gasto', cambios.gastoId] }),
        queryClient.invalidateQueries({ queryKey: claveGastos(cambios.grupoId) }),
      ]),
  });
}

export function useEliminarGasto(grupoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eliminarGasto,
    retry: false,
    onSuccess: (_r, gastoId) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['gasto', gastoId] }),
        queryClient.invalidateQueries({ queryKey: claveGastos(grupoId) }),
      ]),
  });
}
