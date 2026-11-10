import { validarPago } from './validar-pago';

describe('validarPago', () => {
  it('acepta un pago válido, con o sin puntos de miles', () => {
    expect(validarPago({ de: 'a', a: 'b', monto: '7000' })).toEqual({});
    expect(validarPago({ de: 'a', a: 'b', monto: '7.000' })).toEqual({});
  });

  it('pide quién pagó y quién recibió', () => {
    const errores = validarPago({ de: null, a: null, monto: '1000' });
    expect(errores.de).toBeDefined();
    expect(errores.a).toBeDefined();
  });

  it('rechaza que paguen y reciban la misma persona', () => {
    expect(validarPago({ de: 'a', a: 'a', monto: '1000' }).a).toBeDefined();
  });

  it('rechaza montos vacíos, cero, con decimales o enormes', () => {
    expect(validarPago({ de: 'a', a: 'b', monto: '' }).monto).toBeDefined();
    expect(validarPago({ de: 'a', a: 'b', monto: '0' }).monto).toBeDefined();
    expect(validarPago({ de: 'a', a: 'b', monto: '10,5' }).monto).toBeDefined();
    expect(validarPago({ de: 'a', a: 'b', monto: '9999999999' }).monto).toBeDefined();
  });
});
