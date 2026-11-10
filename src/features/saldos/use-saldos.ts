import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useGastos } from '@/features/gastos/use-registrar-gasto';

import { obtenerPagos, obtenerRumisSaldo, registrarPago } from './api';
import { calcularSaldos, type Saldos } from './saldos';

export function clavePagos(grupoId: string) {
  return ['pagos', grupoId] as const;
}

export function useRumisSaldo(grupoId: string) {
  return useQuery({
    queryKey: ['rumis-saldo', grupoId],
    queryFn: () => obtenerRumisSaldo(grupoId),
    enabled: grupoId.length > 0,
  });
}

export function usePagos(grupoId: string) {
  return useQuery({
    queryKey: clavePagos(grupoId),
    queryFn: () => obtenerPagos(grupoId),
    enabled: grupoId.length > 0,
  });
}

// Saldos del grupo, calculados en el teléfono a partir de gastos y pagos.
export function useSaldos(grupoId: string): {
  saldos: Saldos | undefined;
  cargando: boolean;
  error: boolean;
  recargar: () => void;
} {
  const gastos = useGastos(grupoId);
  const pagos = usePagos(grupoId);
  const saldos =
    gastos.data && pagos.data
      ? calcularSaldos(
          gastos.data.map((g) => ({
            pagadoPor: g.pagadoPorId,
            eliminado: g.eliminado,
            participaciones: g.participaciones,
          })),
          pagos.data,
        )
      : undefined;

  return {
    saldos,
    cargando: gastos.isPending || pagos.isPending,
    error: gastos.isError || pagos.isError,
    recargar: () => {
      void gastos.refetch();
      void pagos.refetch();
    },
  };
}

export function useRegistrarPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registrarPago,
    retry: false,
    onSuccess: (_id, pago) =>
      queryClient.invalidateQueries({ queryKey: clavePagos(pago.grupoId) }),
  });
}
