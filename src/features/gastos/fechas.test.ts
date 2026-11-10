import {
  celdasDelMes,
  fechaConDia,
  fechaCorta,
  fechaLarga,
  moverMes,
  primerVencimientoMensual,
  vencimientoDelMes,
} from './fechas';

describe('fechas', () => {
  it('mueve meses cruzando el año', () => {
    expect(moverMes(2026, 12, 1)).toEqual({ anio: 2027, mes: 1 });
    expect(moverMes(2026, 1, -1)).toEqual({ anio: 2025, mes: 12 });
    expect(moverMes(2026, 11, 0)).toEqual({ anio: 2026, mes: 11 });
  });

  it('arma el calendario empezando el lunes', () => {
    // 1 de noviembre de 2026 es domingo: 6 espacios vacíos antes.
    const celdas = celdasDelMes(2026, 11);
    expect(celdas.slice(0, 7)).toEqual([null, null, null, null, null, null, 1]);
    expect(celdas.filter((c) => c !== null)).toHaveLength(30);
  });

  it('en meses cortos vence el último día', () => {
    expect(vencimientoDelMes(2026, 2, 31)).toBe('2026-02-28');
    expect(vencimientoDelMes(2028, 2, 30)).toBe('2028-02-29');
    expect(vencimientoDelMes(2026, 11, 5)).toBe('2026-11-05');
  });

  it('el primer vencimiento mensual es este mes si aún no pasa', () => {
    expect(primerVencimientoMensual('2026-11-03', 5)).toBe('2026-11-05');
    expect(primerVencimientoMensual('2026-11-05', 5)).toBe('2026-11-05');
    expect(primerVencimientoMensual('2026-11-10', 5)).toBe('2026-12-05');
    expect(primerVencimientoMensual('2026-12-20', 5)).toBe('2027-01-05');
    expect(primerVencimientoMensual('2026-01-31', 31)).toBe('2026-01-31');
    expect(primerVencimientoMensual('2026-02-10', 31)).toBe('2026-02-28');
  });

  it('formatea fechas cortas y largas', () => {
    expect(fechaCorta('2026-11-05', '2026-11-10')).toBe('5 nov');
    expect(fechaCorta('2027-01-05', '2026-11-10')).toBe('5 ene 2027');
    expect(fechaLarga('2026-11-05', '2026-11-10')).toBe('5 de noviembre');
  });
});

describe('fechaConDia', () => {
  it('dice Hoy, Ayer o el día de la semana', () => {
    expect(fechaConDia('2026-11-10', '2026-11-10')).toBe('Hoy');
    expect(fechaConDia('2026-11-09', '2026-11-10')).toBe('Ayer');
    expect(fechaConDia('2026-11-02', '2026-11-10')).toBe('lunes 2 de noviembre');
    expect(fechaConDia('2026-12-31', '2027-01-01')).toBe('Ayer');
    expect(fechaConDia('2025-12-25', '2026-11-10')).toBe('jueves 25 de diciembre de 2025');
  });
});
