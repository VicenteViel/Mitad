import { esCodigoValido, formatearCodigo, normalizarCodigo } from './codigo';

describe('normalizarCodigo', () => {
  it('pasa a mayúsculas y quita guiones y espacios', () => {
    expect(normalizarCodigo(' abcde-23456 ')).toBe('ABCDE23456');
  });
});

describe('esCodigoValido', () => {
  it('acepta un código de 10 caracteres del alfabeto, con o sin guion', () => {
    expect(esCodigoValido('ABCDE-23456')).toBe(true);
    expect(esCodigoValido('abcde23456')).toBe(true);
  });

  it('rechaza códigos cortos o largos', () => {
    expect(esCodigoValido('ABCDE')).toBe(false);
    expect(esCodigoValido('ABCDE234567')).toBe(false);
  });

  it('rechaza caracteres confusos que el alfabeto no usa (0, O, 1, I)', () => {
    expect(esCodigoValido('ABCDE2345O')).toBe(false);
    expect(esCodigoValido('ABCDE23451')).toBe(false);
  });
});

describe('formatearCodigo', () => {
  it('muestra el código como XXXXX-XXXXX', () => {
    expect(formatearCodigo('abcde23456')).toBe('ABCDE-23456');
  });

  it('no agrega guion mientras se escriben los primeros 5', () => {
    expect(formatearCodigo('abc')).toBe('ABC');
  });
});
