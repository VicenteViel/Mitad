import { parsearInvitacionAceptada } from './invitacion';

describe('parsearInvitacionAceptada', () => {
  it('convierte la respuesta de Supabase', () => {
    const resultado = parsearInvitacionAceptada({
      grupo: { id: 'g1', nombre: 'Casa 4010', descripcion: null },
      integrante: { nombre: 'Camila', avatar: 'mujer', color: 'rosado' },
    });
    expect(resultado).toEqual({
      grupo: { id: 'g1', nombre: 'Casa 4010', descripcion: null },
      integrante: { nombre: 'Camila', avatar: 'mujer', color: 'rosado' },
    });
  });

  it('usa valores seguros si el ícono o el color no son conocidos', () => {
    const resultado = parsearInvitacionAceptada({
      grupo: { id: 'g1', nombre: 'Casa' },
      integrante: { nombre: 'Diego', avatar: 'otro', color: 'verde' },
    });
    expect(resultado.integrante).toEqual({ nombre: 'Diego', avatar: 'hombre', color: 'azul' });
    expect(resultado.grupo.descripcion).toBeNull();
  });

  it('rechaza respuestas incompletas', () => {
    expect(() => parsearInvitacionAceptada(null)).toThrow();
    expect(() => parsearInvitacionAceptada({ grupo: { nombre: 'x' } })).toThrow();
  });
});
