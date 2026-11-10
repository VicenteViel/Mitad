import type { GastoHistorial } from '@/features/gastos/historial';

import type { Pago } from './api';
import {
  agruparPorDia,
  codigoMovimiento,
  efectoEnMiSaldo,
  filtrarMovimientos,
  meIncluye,
} from './historial-detallado';
import { calcularSaldos } from './saldos';
import type { Movimiento } from './movimientos';

function gasto(id: string, datos: Partial<GastoHistorial>): Movimiento {
  const g: GastoHistorial = {
    id,
    descripcion: id,
    monto: 0,
    categoria: 'otros',
    fecha: '2026-11-10',
    creadoEn: '2026-11-10T12:00:00Z',
    eliminado: false,
    pagadoPorId: 'ana',
    pagadoPorNombre: 'Ana',
    fechaLimite: null,
    mensual: false,
    creadoPorId: 'ana',
    editadoPorId: null,
    editadoEn: null,
    eliminadoPorId: null,
    participaciones: [],
    ...datos,
  };
  return { tipo: 'gasto', id, fecha: g.fecha, creadoEn: g.creadoEn, gasto: g };
}

function pago(id: string, de: string, a: string, monto: number, fecha = '2026-11-10'): Movimiento {
  const p: Pago = {
    id,
    de,
    a,
    monto,
    fecha,
    creadoEn: `${fecha}T12:00:00Z`,
    eliminado: false,
    declaradaPor: de,
    version: 1,
    editadoPor: null,
    editadoEn: null,
    eliminadoPor: null,
  };
  return { tipo: 'pago', id, fecha, creadoEn: p.creadoEn, pago: p };
}

const partes = (m: Record<string, number>) =>
  Object.entries(m).map(([integranteId, monto]) => ({ integranteId, monto, pagada: false }));

const SUPER = gasto('super', { monto: 9000, participaciones: partes({ ana: 3000, yo: 3000, beto: 3000 }) });

describe('efectoEnMiSaldo', () => {
  it('si pagué, me deben lo de los demás; si participo, debo mi parte', () => {
    expect(efectoEnMiSaldo(SUPER, 'ana')).toBe(6000);
    expect(efectoEnMiSaldo(SUPER, 'yo')).toBe(-3000);
    expect(efectoEnMiSaldo(SUPER, 'zoe')).toBeNull();
    expect(efectoEnMiSaldo(SUPER, undefined)).toBeNull();
  });

  it('pagar baja lo que debo; recibir baja lo que me deben', () => {
    const p = pago('p', 'yo', 'ana', 3000);
    expect(efectoEnMiSaldo(p, 'yo')).toBe(3000);
    expect(efectoEnMiSaldo(p, 'ana')).toBe(-3000);
    expect(efectoEnMiSaldo(p, 'beto')).toBeNull();
  });

  it('lo eliminado y los gastos por cubrir no cambian el saldo', () => {
    const borrado = gasto('b', { eliminado: true, monto: 100, participaciones: partes({ yo: 100 }) });
    const porCubrir = gasto('c', { pagadoPorId: null, monto: 100, participaciones: partes({ yo: 100 }) });
    expect(efectoEnMiSaldo(borrado, 'yo')).toBeNull();
    expect(efectoEnMiSaldo(porCubrir, 'yo')).toBeNull();
  });

  it('la suma de los efectos es igual a mi saldo neto', () => {
    const movimientos = [SUPER, pago('p1', 'yo', 'ana', 1000), gasto('luz', {
      pagadoPorId: 'yo',
      monto: 5000,
      participaciones: partes({ yo: 2500, beto: 2500 }),
    })];
    const { netos } = calcularSaldos(
      movimientos.flatMap((m) =>
        m.tipo === 'gasto'
          ? [{ pagadoPor: m.gasto.pagadoPorId, eliminado: m.gasto.eliminado, participaciones: m.gasto.participaciones }]
          : [],
      ),
      movimientos.flatMap((m) => (m.tipo === 'pago' ? [m.pago] : [])),
    );
    for (const yo of ['ana', 'yo', 'beto']) {
      const suma = movimientos.reduce((s, m) => s + (efectoEnMiSaldo(m, yo) ?? 0), 0);
      expect(suma).toBe(netos.get(yo) ?? 0);
    }
  });
});

describe('filtros y agrupación', () => {
  const lista = [SUPER, pago('p1', 'ana', 'beto', 500, '2026-11-09'), pago('p2', 'yo', 'ana', 300, '2026-11-09')];

  it('filtra por tipo y por lo mío', () => {
    expect(filtrarMovimientos(lista, 'todos', 'yo')).toHaveLength(3);
    expect(filtrarMovimientos(lista, 'gastos', 'yo').map((m) => m.id)).toEqual(['super']);
    expect(filtrarMovimientos(lista, 'pagos', 'yo').map((m) => m.id)).toEqual(['p1', 'p2']);
    expect(filtrarMovimientos(lista, 'mios', 'yo').map((m) => m.id)).toEqual(['super', 'p2']);
    expect(meIncluye(lista[1], 'yo')).toBe(false);
  });

  it('agrupa por día en orden', () => {
    expect(agruparPorDia(lista).map((d) => [d.fecha, d.movimientos.length])).toEqual([
      ['2026-11-10', 1],
      ['2026-11-09', 2],
    ]);
    expect(agruparPorDia([])).toEqual([]);
  });

  it('código corto del movimiento', () => {
    expect(codigoMovimiento('a1b2c3d4-0000-4000-8000-000000000000')).toBe('A1B2C3');
  });
});
