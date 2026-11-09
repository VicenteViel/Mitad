import { validarNuevoGrupo } from './validar-nuevo-grupo';

describe('validarNuevoGrupo', () => {
  it('acepta datos válidos sin descripción', () => {
    expect(validarNuevoGrupo({ nombre: 'Depto', nombreIntegrante: 'Vicente' })).toEqual({});
  });

  it('rechaza un nombre de grupo vacío o solo con espacios', () => {
    const errores = validarNuevoGrupo({ nombre: '   ', nombreIntegrante: 'Vicente' });
    expect(errores.nombre).toBeDefined();
  });

  it('rechaza un nombre de grupo de más de 60 caracteres', () => {
    const errores = validarNuevoGrupo({ nombre: 'a'.repeat(61), nombreIntegrante: 'Vicente' });
    expect(errores.nombre).toBeDefined();
  });

  it('acepta un nombre de grupo de exactamente 60 caracteres', () => {
    const errores = validarNuevoGrupo({ nombre: 'a'.repeat(60), nombreIntegrante: 'Vicente' });
    expect(errores.nombre).toBeUndefined();
  });

  it('rechaza una descripción de más de 200 caracteres', () => {
    const errores = validarNuevoGrupo({
      nombre: 'Depto',
      descripcion: 'a'.repeat(201),
      nombreIntegrante: 'Vicente',
    });
    expect(errores.descripcion).toBeDefined();
  });
});