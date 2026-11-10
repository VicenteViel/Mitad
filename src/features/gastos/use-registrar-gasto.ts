import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  crearGastoMensual,
  detenerGastoMensual,
  marcarPartePagada,
  obtenerGastos,
  obtenerGastosMensuales,
  obtenerIntegrantesGasto,
  registrarGasto,
} from './api';

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

export function claveGastosMensuales(grupoId: string) {
  return ['gastos-mensuales', grupoId] as const;
}

// Crea la plantilla y recarga el historial (el gasto de este mes ya puede estar).
export function useCrearGastoMensual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crearGastoMensual,
    retry: false,
    onSuccess: (_id, gasto) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: claveGastos(gasto.grupoId) }),
        queryClient.invalidateQueries({ queryKey: claveGastosMensuales(gasto.grupoId) }),
      ]),
  });
}

export function useGastosMensuales(grupoId: string) {
  return useQuery({
    queryKey: claveGastosMensuales(grupoId),
    queryFn: () => obtenerGastosMensuales(grupoId),
    enabled: grupoId.length > 0,
  });
}

export function useDetenerGastoMensual(grupoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: detenerGastoMensual,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claveGastosMensuales(grupoId) }),
  });
}

// Marcar mi parte (o la de otro, si soy admin) de un gasto por cubrir.
export function useMarcarPartePagada(grupoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marcarPartePagada,
    onSuccess: (_r, datos) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['gasto', datos.gastoId] }),
        queryClient.invalidateQueries({ queryKey: claveGastos(grupoId) }),
      ]),
  });
}
