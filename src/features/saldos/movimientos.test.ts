import type { GastoHistorial } from '@/features/gastos/historial';

import type { Pago } from './api';
import { ordenarMovimientos } from './movimientos';

function gasto(id: string, fecha: string, creadoEn: string): GastoHistorial {
  return {
    id,
    descripcion: id,
    monto: 1000,
    categoria: 'otros',
    fecha,
    creadoEn,
    eliminado: false,
    pagadoPorId: 'a',
    pagadoPorNombre: 'A',
    participaciones: [],
  };
}

function pago(id: string, fecha: string, creadoEn: string): Pago {
  return {
    id,
    de: 'b',
    a: 'a',
    monto: 500,
    fecha,
    creadoEn,
    eliminado: false,
    declaradaPor: 'b',
    version: 1,
    editadoPor: null,
    editadoEn: null,
    eliminadoPor: null,
  };
}

describe('ordenarMovimientos', () => {
  it('mezcla gastos y pagos del más reciente al más antiguo', () => {
    const resultado = ordenarMovimientos(
      [gasto('g-viejo', '2026-11-01', '2026-11-01T10:00:00Z'), gasto('g-hoy', '2026-11-10', '2026-11-10T09:00:00Z')],
      [pago('p-medio', '2026-11-05', '2026-11-05T10:00:00Z')],
    );
    expect(resultado.map((m) => m.id)).toEqual(['g-hoy', 'p-medio', 'g-viejo']);
  });

  it('el mismo día, ordena por hora de creación', () => {
    const resultado = ordenarMovimientos(
      [gasto('g', '2026-11-10', '2026-11-10T08:00:00Z')],
      [pago('p', '2026-11-10', '2026-11-10T20:00:00Z')],
    );
    expect(resultado.map((m) => m.tipo)).toEqual(['pago', 'gasto']);
  });

  it('sin movimientos, lista vacía', () => {
    expect(ordenarMovimientos([], [])).toEqual([]);
  });
});
