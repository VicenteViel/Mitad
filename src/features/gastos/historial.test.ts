import { esCategoria, miParte, textoFecha, type GastoHistorial } from './historial';

const gasto: GastoHistorial = {
  id: 'g1',
  descripcion: 'Supermercado',
  monto: 10000,
  categoria: 'alimentacion',
  fecha: '2026-11-10',
  creadoEn: '2026-11-10T12:00:00Z',
  eliminado: false,
  pagadoPorId: 'diego',
  pagadoPorNombre: 'Diego',
  participaciones: [
    { integranteId: 'diego', monto: 3334 },
    { integranteId: 'camila', monto: 3333 },
    { integranteId: 'vicente', monto: 3333 },
  ],
};

describe('miParte', () => {
  it('devuelve lo que me toca si participo', () => {
    expect(miParte(gasto, 'camila')).toBe(3333);
  });

  it('devuelve null si no participo o no sé quién soy', () => {
    expect(miParte(gasto, 'otro')).toBeNull();
    expect(miParte(gasto, undefined)).toBeNull();
  });
});

describe('textoFecha', () => {
  it('muestra Hoy y Ayer', () => {
    expect(textoFecha('2026-11-10', '2026-11-10')).toBe('Hoy');
    expect(textoFecha('2026-11-09', '2026-11-10')).toBe('Ayer');
  });

  it('reconoce Ayer al cambiar de mes y de año', () => {
    expect(textoFecha('2026-10-31', '2026-11-01')).toBe('Ayer');
    expect(textoFecha('2025-12-31', '2026-01-01')).toBe('Ayer');
  });

  it('muestra día y mes, con el año si no es el actual', () => {
    expect(textoFecha('2026-11-02', '2026-11-10')).toBe('2 nov');
    expect(textoFecha('2025-03-15', '2026-11-10')).toBe('15 mar 2025');
  });
});

describe('esCategoria', () => {
  it('acepta solo las categorías conocidas', () => {
    expect(esCategoria('arriendo')).toBe(true);
    expect(esCategoria('vacaciones')).toBe(false);
  });
});
