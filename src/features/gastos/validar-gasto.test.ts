import {
  formatearEntradaMonto,
  formatearPesos,
  leerMonto,
  validarGasto,
  type DatosGasto,
} from './validar-gasto';

const base: DatosGasto = {
  descripcion: 'Supermercado',
  monto: '10000',
  participantes: ['ana', 'diego', 'camila'],
  tipoDivision: 'equitativa',
  montosPersonalizados: {},
};

describe('leerMonto', () => {
  it('acepta enteros con o sin puntos de miles', () => {
    expect(leerMonto('10000')).toBe(10000);
    expect(leerMonto(' 10.000 ')).toBe(10000);
    expect(leerMonto('1.234.567')).toBe(1234567);
  });

  it('rechaza decimales, letras y vacío', () => {
    for (const texto of ['', '10,5', '10.5', '1.00', 'abc', '-100', '1e3']) {
      expect(leerMonto(texto)).toBeNull();
    }
  });
});

describe('formatearPesos', () => {
  it('agrega puntos de miles', () => {
    expect(formatearPesos(5)).toBe('$5');
    expect(formatearPesos(3334)).toBe('$3.334');
    expect(formatearPesos(1234567)).toBe('$1.234.567');
  });
});

describe('validarGasto', () => {
  it('acepta un gasto equitativo válido', () => {
    expect(validarGasto(base)).toEqual({});
  });

  it('exige descripción y monto entero mayor que 0', () => {
    const errores = validarGasto({ ...base, descripcion: '  ', monto: '0' });
    expect(errores.descripcion).toBeDefined();
    expect(errores.monto).toBeDefined();
    expect(validarGasto({ ...base, monto: '99,9' }).monto).toBeDefined();
    expect(validarGasto({ ...base, monto: '2000000000' }).monto).toBeDefined();
  });

  it('exige al menos un participante', () => {
    expect(validarGasto({ ...base, participantes: [] }).participantes).toBeDefined();
  });

  it('en la equitativa, al menos $1 por persona', () => {
    expect(validarGasto({ ...base, monto: '2' }).monto).toBeDefined();
    expect(validarGasto({ ...base, monto: '3' })).toEqual({});
  });

  it('la personalizada debe sumar exacto', () => {
    const personalizada: DatosGasto = {
      ...base,
      tipoDivision: 'personalizada',
      montosPersonalizados: { ana: '5.000', diego: '3000', camila: '2000' },
    };
    expect(validarGasto(personalizada)).toEqual({});

    const falta = validarGasto({
      ...personalizada,
      montosPersonalizados: { ana: '5000', diego: '3000', camila: '1000' },
    });
    expect(falta.personalizada).toBe('Falta repartir $1.000.');

    const sobra = validarGasto({
      ...personalizada,
      montosPersonalizados: { ana: '5000', diego: '3000', camila: '3000' },
    });
    expect(sobra.personalizada).toBe('Se repartieron $1.000 de más.');
  });

  it('en la personalizada, cada marcado necesita un monto mayor que 0', () => {
    const errores = validarGasto({
      ...base,
      tipoDivision: 'personalizada',
      montosPersonalizados: { ana: '10000', diego: '0' },
    });
    expect(errores.personalizada).toBeDefined();
  });

  it('ignora montos de personas desmarcadas', () => {
    const errores = validarGasto({
      ...base,
      participantes: ['ana'],
      tipoDivision: 'personalizada',
      montosPersonalizados: { ana: '10000', diego: '500' },
    });
    expect(errores).toEqual({});
  });
});

describe('formatearEntradaMonto', () => {
  it('pone los puntos de miles mientras se escribe', () => {
    expect(formatearEntradaMonto('10000')).toBe('10.000');
    expect(formatearEntradaMonto('10.0005')).toBe('100.005');
    expect(formatearEntradaMonto('999')).toBe('999');
  });

  it('descarta letras, ceros iniciales y lo que pase de 9 cifras', () => {
    expect(formatearEntradaMonto('')).toBe('');
    expect(formatearEntradaMonto('abc')).toBe('');
    expect(formatearEntradaMonto('000')).toBe('');
    expect(formatearEntradaMonto('0012')).toBe('12');
    expect(formatearEntradaMonto('12345678901')).toBe('123.456.789');
  });

  it('lo que devuelve lo entiende leerMonto', () => {
    expect(leerMonto(formatearEntradaMonto('1234567'))).toBe(1234567);
  });
});
