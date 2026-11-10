import type { GastoHistorial } from '@/features/gastos/historial';

import type { Deuda } from './saldos';
import { calcularVencidos } from './vencidos';

const HOY = '2026-11-10';

function gasto(datos: Partial<GastoHistorial> & { id: string }): GastoHistorial {
  return {
    descripcion: datos.id,
    monto: 0,
    categoria: 'otros',
    fecha: '2026-11-01',
    creadoEn: '2026-11-01T12:00:00Z',
    eliminado: false,
    pagadoPorId: null,
    pagadoPorNombre: null,
    fechaLimite: '2026-11-05',
    mensual: false,
    creadoPorId: 'a',
    editadoPorId: null,
    editadoEn: null,
    eliminadoPorId: null,
    participaciones: [],
    ...datos,
  };
}

const partes = (montos: Record<string, number>, pagadas: string[] = []) =>
  Object.entries(montos).map(([integranteId, monto]) => ({
    integranteId,
    monto,
    pagada: pagadas.includes(integranteId),
  }));

describe('calcularVencidos', () => {
  it('avisa la parte no pagada de un gasto por cubrir vencido', () => {
    const arriendo = gasto({ id: 'arriendo', participaciones: partes({ yo: 250000, ana: 250000 }, ['ana']) });
    expect(calcularVencidos([arriendo], [], 'yo', HOY)).toEqual([
      { tipo: 'por-cubrir', gastoId: 'arriendo', descripcion: 'arriendo', monto: 250000, fechaLimite: '2026-11-05' },
    ]);
    // Ana ya marcó su parte: no ve aviso.
    expect(calcularVencidos([arriendo], [], 'ana', HOY)).toEqual([]);
  });

  it('no avisa antes ni el mismo día de la fecha límite', () => {
    const g = gasto({ id: 'g', fechaLimite: HOY, participaciones: partes({ yo: 100 }) });
    const sinFecha = gasto({ id: 's', fechaLimite: null, participaciones: partes({ yo: 100 }) });
    expect(calcularVencidos([g, sinFecha], [], 'yo', HOY)).toEqual([]);
  });

  it('ignora gastos eliminados y en los que no participo', () => {
    const borrado = gasto({ id: 'b', eliminado: true, participaciones: partes({ yo: 100 }) });
    const ajeno = gasto({ id: 'x', participaciones: partes({ ana: 100 }) });
    expect(calcularVencidos([borrado, ajeno], [], 'yo', HOY)).toEqual([]);
  });

  it('en un gasto pagado, avisa lo que aún le debo a quien pagó', () => {
    const luz = gasto({ id: 'luz', pagadoPorId: 'ana', participaciones: partes({ yo: 30000, ana: 30000 }) });
    const deudas: Deuda[] = [{ deudor: 'yo', acreedor: 'ana', monto: 30000 }];
    expect(calcularVencidos([luz], deudas, 'yo', HOY)).toEqual([
      { tipo: 'deuda', acreedorId: 'ana', monto: 30000, fechaLimite: '2026-11-05', descripciones: ['luz'] },
    ]);
    // Quien pagó no tiene aviso.
    expect(calcularVencidos([luz], deudas, 'ana', HOY)).toEqual([]);
  });

  it('no pasa de lo que debo hoy (pagos y compensaciones cuentan)', () => {
    const luz = gasto({ id: 'luz', pagadoPorId: 'ana', participaciones: partes({ yo: 30000, ana: 30000 }) });
    const agua = gasto({
      id: 'agua',
      pagadoPorId: 'ana',
      fechaLimite: '2026-11-02',
      participaciones: partes({ yo: 10000, ana: 10000 }),
    });
    const parcial: Deuda[] = [{ deudor: 'yo', acreedor: 'ana', monto: 12000 }];
    expect(calcularVencidos([luz, agua], parcial, 'yo', HOY)).toEqual([
      {
        tipo: 'deuda',
        acreedorId: 'ana',
        monto: 12000,
        fechaLimite: '2026-11-02',
        descripciones: ['luz', 'agua'],
      },
    ]);
    // Al día con Ana (o ella me debe): sin aviso.
    expect(calcularVencidos([luz], [], 'yo', HOY)).toEqual([]);
    expect(calcularVencidos([luz], [{ deudor: 'ana', acreedor: 'yo', monto: 5 }], 'yo', HOY)).toEqual([]);
  });

  it('ordena del más antiguo al más nuevo y sin sesión no avisa nada', () => {
    const a = gasto({ id: 'a', fechaLimite: '2026-11-08', participaciones: partes({ yo: 1 }) });
    const b = gasto({ id: 'b', fechaLimite: '2026-10-05', participaciones: partes({ yo: 1 }) });
    expect(calcularVencidos([a, b], [], 'yo', HOY).map((v) => v.fechaLimite)).toEqual([
      '2026-10-05',
      '2026-11-08',
    ]);
    expect(calcularVencidos([a], [], undefined, HOY)).toEqual([]);
  });
});
