import type { GastoHistorial } from '@/features/gastos/historial';

import type { Pago } from './api';

// Historial del grupo: gastos y pagos en una sola línea de tiempo
// (modelo-datos.md → Historial). Lo borrado se muestra como eliminado.
export type Movimiento =
  | { tipo: 'gasto'; id: string; fecha: string; creadoEn: string; gasto: GastoHistorial }
  | { tipo: 'pago'; id: string; fecha: string; creadoEn: string; pago: Pago };

// Del más reciente al más antiguo: por fecha y, el mismo día, por hora de creación.
export function ordenarMovimientos(gastos: GastoHistorial[], pagos: Pago[]): Movimiento[] {
  const movimientos: Movimiento[] = [
    ...gastos.map((g) => ({
      tipo: 'gasto' as const,
      id: g.id,
      fecha: g.fecha,
      creadoEn: g.creadoEn,
      gasto: g,
    })),
    ...pagos.map((p) => ({
      tipo: 'pago' as const,
      id: p.id,
      fecha: p.fecha,
      creadoEn: p.creadoEn,
      pago: p,
    })),
  ];
  return movimientos.sort(
    (x, y) => y.fecha.localeCompare(x.fecha) || y.creadoEn.localeCompare(x.creadoEn),
  );
}
