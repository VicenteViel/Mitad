import type { Movimiento } from './movimientos';

export type FiltroHistorial = 'todos' | 'gastos' | 'pagos' | 'mios';

// Cuánto cambió mi saldo con este movimiento (la misma regla que
// calcularSaldos): positivo = me deben más (o debo menos), negativo = debo más.
// null si no me afecta: no participo, está eliminado o es un gasto por cubrir.
export function efectoEnMiSaldo(m: Movimiento, yo: string | undefined): number | null {
  if (!yo) return null;
  if (m.tipo === 'pago') {
    const p = m.pago;
    if (p.eliminado) return null;
    if (p.de === yo) return p.monto;
    if (p.a === yo) return -p.monto;
    return null;
  }

  const g = m.gasto;
  if (g.eliminado || g.pagadoPorId === null) return null;
  const miParte = g.participaciones.find((p) => p.integranteId === yo)?.monto ?? 0;
  if (g.pagadoPorId === yo) return g.monto - miParte;
  return miParte > 0 ? -miParte : null;
}

// ¿Estoy involucrado? Pagué, participo, o soy una de las partes del pago.
export function meIncluye(m: Movimiento, yo: string | undefined): boolean {
  if (!yo) return false;
  if (m.tipo === 'pago') return m.pago.de === yo || m.pago.a === yo;
  return m.gasto.pagadoPorId === yo || m.gasto.participaciones.some((p) => p.integranteId === yo);
}

export function filtrarMovimientos(
  movimientos: Movimiento[],
  filtro: FiltroHistorial,
  yo: string | undefined,
): Movimiento[] {
  switch (filtro) {
    case 'gastos':
      return movimientos.filter((m) => m.tipo === 'gasto');
    case 'pagos':
      return movimientos.filter((m) => m.tipo === 'pago');
    case 'mios':
      return movimientos.filter((m) => meIncluye(m, yo));
    default:
      return movimientos;
  }
}

// Agrupa por día manteniendo el orden (ya vienen del más reciente al más antiguo).
export function agruparPorDia(movimientos: Movimiento[]): { fecha: string; movimientos: Movimiento[] }[] {
  const grupos: { fecha: string; movimientos: Movimiento[] }[] = [];
  for (const m of movimientos) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.fecha === m.fecha) ultimo.movimientos.push(m);
    else grupos.push({ fecha: m.fecha, movimientos: [m] });
  }
  return grupos;
}

// Código corto para nombrar un movimiento sin confusiones ("el pago A1B2C3").
export function codigoMovimiento(id: string): string {
  return id.replace(/-/g, '').slice(0, 6).toUpperCase();
}
