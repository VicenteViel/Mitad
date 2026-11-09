import { hayErrores, validarIntegrantes } from './validar-integrantes';

describe('validarIntegrantes', () => {
  it('acepta una lista válida', () => {
    const errores = validarIntegrantes([{ nombre: 'Diego' }, { nombre: 'Camila' }]);
    expect(hayErrores(errores)).toBe(false);
  });

  it('acepta una lista vacía (vivir solo)', () => {
    expect(hayErrores(validarIntegrantes([]))).toBe(false);
  });

  it('rechaza más de 20 integrantes', () => {
    const lista = Array.from({ length: 21 }, (_, i) => ({ nombre: `Persona ${i}` }));
    expect(validarIntegrantes(lista).general).toBeDefined();
  });

  it('marca solo la fila con el nombre vacío', () => {
    const errores = validarIntegrantes([{ nombre: 'Diego' }, { nombre: '   ' }]);
    expect(errores.porFila[0]).toBeUndefined();
    expect(errores.porFila[1]).toBeDefined();
  });

  it('rechaza un nombre de más de 40 caracteres', () => {
    const errores = validarIntegrantes([{ nombre: 'a'.repeat(41) }]);
    expect(errores.porFila[0]).toBeDefined();
  });
});
