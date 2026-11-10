import type { GastoHistorial } from '@/features/gastos/historial';

import type { Deuda } from './saldos';

// Avisos de lo que tengo vencido en un grupo (decisiones 48 a 53):
// - "por-cubrir": un gasto que nadie ha pagado, con fecha límite pasada, y mi
//   parte sigue sin marcar como pagada.
// - "deuda": gastos que pagó otro rumi, con fecha límite pasada, y todavía le
//   debo dinero a ese rumi (según el saldo del par, ya compensado).
export type Vencido =
  | {
      tipo: 'por-cubrir';
      gastoId: string;
      descripcion: string;
      monto: number; // mi parte
      fechaLimite: string;
    }
  | {
      tipo: 'deuda';
      acreedorId: string;
      // Lo vencido que le debo: la suma de mis partes vencidas con ese rumi,
      // sin pasar de lo que le debo hoy.
      monto: number;
      fechaLimite: string; // la más antigua
      descripciones: string[];
    };

// `hoy` y las fechas en formato YYYY-MM-DD: se comparan como texto.
export function calcularVencidos(
  gastos: GastoHistorial[],
  deudas: Deuda[],
  yo: string | undefined,
  hoy: string,
): Vencido[] {
  if (!yo) return [];
  const avisos: Vencido[] = [];
  const porAcreedor = new Map<string, { monto: number; fechaLimite: string; descripciones: string[] }>();

  for (const g of gastos) {
    if (g.eliminado || !g.fechaLimite || g.fechaLimite >= hoy) continue;
    const mia = g.participaciones.find((p) => p.integranteId === yo);
    if (!mia) continue;

    if (g.pagadoPorId === null) {
      if (!mia.pagada) {
        avisos.push({
          tipo: 'por-cubrir',
          gastoId: g.id,
          descripcion: g.descripcion,
          monto: mia.monto,
          fechaLimite: g.fechaLimite,
        });
      }
      continue;
    }

    if (g.pagadoPorId === yo) continue;
    const actual = porAcreedor.get(g.pagadoPorId) ?? {
      monto: 0,
      fechaLimite: g.fechaLimite,
      descripciones: [],
    };
    actual.monto += mia.monto;
    if (g.fechaLimite < actual.fechaLimite) actual.fechaLimite = g.fechaLimite;
    actual.descripciones.push(g.descripcion);
    porAcreedor.set(g.pagadoPorId, actual);
  }

  for (const [acreedorId, vencido] of porAcreedor) {
    const debo = deudas.find((d) => d.deudor === yo && d.acreedor === acreedorId)?.monto ?? 0;
    const monto = Math.min(vencido.monto, debo);
    if (monto > 0) avisos.push({ tipo: 'deuda', acreedorId, ...vencido, monto });
  }

  return avisos.sort((a, b) => a.fechaLimite.localeCompare(b.fechaLimite));
}
