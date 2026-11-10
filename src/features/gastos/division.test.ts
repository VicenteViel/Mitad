import { dividirEquitativo } from './division';

const montoDe = (r: { integranteId: string; monto: number }[], id: string) =>
  r.find((p) => p.integranteId === id)?.monto;

describe('dividirEquitativo', () => {
  it('divide exacto cuando no sobra nada', () => {
    const r = dividirEquitativo(9000, ['ana', 'diego', 'camila'], 'ana');
    expect(r.map((p) => p.monto)).toEqual([3000, 3000, 3000]);
  });

  it('quien pagó absorbe el resto si participa', () => {
    const r = dividirEquitativo(10000, ['ana', 'diego', 'camila'], 'diego');
    expect(montoDe(r, 'diego')).toBe(3334);
    expect(montoDe(r, 'ana')).toBe(3333);
    expect(montoDe(r, 'camila')).toBe(3333);
  });

  it('si quien pagó no participa, el resto va de a 1 peso por orden de llegada', () => {
    const r = dividirEquitativo(10001, ['ana', 'diego', 'camila'], 'pedro');
    expect(r.map((p) => p.monto)).toEqual([3334, 3334, 3333]);
  });

  it('si quien pagó no participa, nadie absorbe todo el resto', () => {
    const r = dividirEquitativo(10000, ['ana', 'diego', 'camila'], 'pedro');
    expect(r.map((p) => p.monto)).toEqual([3334, 3333, 3333]);
  });

  it('la suma siempre es igual al monto', () => {
    for (const monto of [1, 7, 100, 9999, 48000, 1234567]) {
      for (const n of [1, 2, 3, 4, 7]) {
        if (monto < n) continue;
        const ids = Array.from({ length: n }, (_, i) => `p${i}`);
        const suma = dividirEquitativo(monto, ids, 'p0').reduce((s, p) => s + p.monto, 0);
        expect(suma).toBe(monto);
      }
    }
  });

  it('rechaza datos inválidos', () => {
    expect(() => dividirEquitativo(0, ['ana'], 'ana')).toThrow();
    expect(() => dividirEquitativo(10.5, ['ana'], 'ana')).toThrow();
    expect(() => dividirEquitativo(100, [], 'ana')).toThrow();
    expect(() => dividirEquitativo(100, ['ana', 'ana'], 'ana')).toThrow();
    expect(() => dividirEquitativo(2, ['ana', 'diego', 'camila'], 'ana')).toThrow();
  });
});
describe('dividirEquitativo sin pagador (gasto por cubrir)', () => {
  it('reparte el resto de a 1 peso por orden de llegada', () => {
    expect(dividirEquitativo(10, ['a', 'b', 'c'], null)).toEqual([
      { integranteId: 'a', monto: 4 },
      { integranteId: 'b', monto: 3 },
      { integranteId: 'c', monto: 3 },
    ]);
  });
});
