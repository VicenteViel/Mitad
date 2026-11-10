import { calcularSaldos, deudasDe, type GastoParaSaldo, type PagoParaSaldo } from './saldos';

function gasto(pagadoPor: string, partes: Record<string, number>, eliminado = false): GastoParaSaldo {
  return {
    pagadoPor,
    eliminado,
    participaciones: Object.entries(partes).map(([integranteId, monto]) => ({ integranteId, monto })),
  };
}

function pago(de: string, a: string, monto: number, eliminado = false): PagoParaSaldo {
  return { de, a, monto, eliminado };
}

// Invariantes de modelo-datos.md.
function verificarInvariantes(gastos: GastoParaSaldo[], pagos: PagoParaSaldo[]) {
  const { netos, deudas } = calcularSaldos(gastos, pagos);
  const sumaNetos = [...netos.values()].reduce((a, b) => a + b, 0);
  expect(sumaNetos).toBe(0);

  // El neto de cada integrante es la suma de sus saldos por par.
  const ids = new Set([...netos.keys(), ...deudas.flatMap((d) => [d.deudor, d.acreedor])]);
  for (const id of ids) {
    const porPar = deudas.reduce(
      (total, d) => total + (d.acreedor === id ? d.monto : 0) - (d.deudor === id ? d.monto : 0),
      0,
    );
    expect(porPar).toBe(netos.get(id) ?? 0);
  }
  // Nunca hay dos deudas para el mismo par ni deudas de 0.
  const pares = deudas.map((d) => [d.deudor, d.acreedor].sort().join('|'));
  expect(new Set(pares).size).toBe(pares.length);
  expect(deudas.every((d) => d.monto > 0)).toBe(true);
}

describe('calcularSaldos', () => {
  it('sin movimientos, todos al día', () => {
    const { netos, deudas } = calcularSaldos([], []);
    expect(netos.size).toBe(0);
    expect(deudas).toEqual([]);
  });

  it('un gasto equitativo: los demás le deben su parte a quien pagó', () => {
    const gastos = [gasto('diego', { diego: 3334, camila: 3333, vicente: 3333 })];
    const { netos, deudas } = calcularSaldos(gastos, []);
    expect(netos.get('diego')).toBe(6666);
    expect(netos.get('camila')).toBe(-3333);
    expect(deudas).toEqual([
      { deudor: 'camila', acreedor: 'diego', monto: 3333 },
      { deudor: 'vicente', acreedor: 'diego', monto: 3333 },
    ]);
    verificarInvariantes(gastos, []);
  });

  it('compensa dentro del par (ejemplo de la regla 17)', () => {
    const gastos = [gasto('diego', { camila: 10000 }), gasto('camila', { diego: 3000 })];
    expect(calcularSaldos(gastos, []).deudas).toEqual([
      { deudor: 'camila', acreedor: 'diego', monto: 7000 },
    ]);
    verificarInvariantes(gastos, []);
  });

  it('un pago reduce la deuda del par', () => {
    const gastos = [gasto('diego', { camila: 10000 })];
    const pagos = [pago('camila', 'diego', 4000)];
    expect(calcularSaldos(gastos, pagos).deudas).toEqual([
      { deudor: 'camila', acreedor: 'diego', monto: 6000 },
    ]);
    verificarInvariantes(gastos, pagos);
  });

  it('un pago exacto deja al par al día', () => {
    const gastos = [gasto('diego', { camila: 10000 })];
    const pagos = [pago('camila', 'diego', 10000)];
    const { netos, deudas } = calcularSaldos(gastos, pagos);
    expect(deudas).toEqual([]);
    expect(netos.size).toBe(0);
  });

  it('si se paga de más, el saldo se invierte (regla 31)', () => {
    const gastos = [gasto('diego', { camila: 10000 })];
    const pagos = [pago('camila', 'diego', 12000)];
    expect(calcularSaldos(gastos, pagos).deudas).toEqual([
      { deudor: 'diego', acreedor: 'camila', monto: 2000 },
    ]);
    verificarInvariantes(gastos, pagos);
  });

  it('ignora gastos y pagos eliminados (regla 33)', () => {
    const gastos = [gasto('diego', { camila: 10000 }), gasto('diego', { camila: 5000 }, true)];
    const pagos = [pago('camila', 'diego', 10000, true)];
    expect(calcularSaldos(gastos, pagos).deudas).toEqual([
      { deudor: 'camila', acreedor: 'diego', monto: 10000 },
    ]);
  });

  it('quien pagó sin participar no se debe a sí mismo', () => {
    const gastos = [gasto('diego', { camila: 5000, vicente: 5000 })];
    const { netos } = calcularSaldos(gastos, []);
    expect(netos.get('diego')).toBe(10000);
    verificarInvariantes(gastos, []);
  });

  it('cumple los invariantes en un caso con varios gastos y pagos', () => {
    const gastos = [
      gasto('a', { a: 2500, b: 2500, c: 2500, d: 2500 }),
      gasto('b', { a: 1000, c: 4000 }),
      gasto('c', { a: 3334, b: 3333, c: 3333 }),
      gasto('d', { d: 700, b: 300 }),
    ];
    const pagos = [pago('b', 'a', 1500), pago('c', 'b', 9000), pago('a', 'd', 1)];
    verificarInvariantes(gastos, pagos);
  });

  it('ordena las deudas de mayor a menor', () => {
    const gastos = [gasto('x', { y: 100, z: 900 })];
    expect(calcularSaldos(gastos, []).deudas.map((d) => d.monto)).toEqual([900, 100]);
  });
});

describe('deudasDe', () => {
  it('devuelve solo las deudas donde participa', () => {
    const saldos = calcularSaldos([gasto('x', { y: 100, z: 900 })], []);
    expect(deudasDe(saldos, 'y')).toEqual([{ deudor: 'y', acreedor: 'x', monto: 100 }]);
  });
});

describe('gastos por cubrir', () => {
  it('no crean deudas entre rumis', () => {
    const porCubrir: GastoParaSaldo = {
      pagadoPor: null,
      eliminado: false,
      participaciones: [
        { integranteId: 'a', monto: 250000 },
        { integranteId: 'b', monto: 250000 },
      ],
    };
    const { netos, deudas } = calcularSaldos([porCubrir, gasto('a', { a: 500, b: 500 })], []);
    expect(deudas).toEqual([{ deudor: 'b', acreedor: 'a', monto: 500 }]);
    expect(netos.get('a')).toBe(500);
    verificarInvariantes([porCubrir], []);
  });
});
