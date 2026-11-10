import { validarDatosIntegrante } from './validar-datos-integrante';

describe('validarDatosIntegrante', () => {
  it('acepta alias y correo vacíos (ambos son opcionales)', () => {
    expect(validarDatosIntegrante({ alias: '', correo: '' })).toEqual({});
  });

  it('acepta un alias y un correo válidos', () => {
    expect(validarDatosIntegrante({ alias: 'Cami', correo: 'cami@correo.cl' })).toEqual({});
  });

  it('acepta un correo con espacios alrededor', () => {
    expect(validarDatosIntegrante({ alias: '', correo: '  cami@correo.cl ' })).toEqual({});
  });

  it('rechaza un correo sin arroba', () => {
    expect(validarDatosIntegrante({ alias: '', correo: 'camicorreo.cl' }).correo).toBeDefined();
  });

  it('rechaza un alias de más de 40 caracteres', () => {
    expect(validarDatosIntegrante({ alias: 'a'.repeat(41), correo: '' }).alias).toBeDefined();
  });
});
