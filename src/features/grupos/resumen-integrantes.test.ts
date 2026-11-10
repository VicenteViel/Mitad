import type { IntegranteDetalle } from './api';
import { contarIntegrantes, etiquetasIntegrante } from './resumen-integrantes';

function integrante(cambios: Partial<IntegranteDetalle>): IntegranteDetalle {
  return {
    id: 'i1',
    nombre: 'Diego',
    rol: 'integrante',
    avatar: 'hombre',
    color: 'azul',
    usuarioId: 'u1',
    ...cambios,
  };
}

describe('etiquetasIntegrante', () => {
  it('reconoce al usuario actual y al admin', () => {
    const etiquetas = etiquetasIntegrante(integrante({ rol: 'admin', usuarioId: 'yo' }), 'yo');
    expect(etiquetas).toEqual({ esYo: true, esAdmin: true, esPendiente: false });
  });

  it('un integrante sin usuario es pendiente y nunca soy yo', () => {
    const etiquetas = etiquetasIntegrante(integrante({ usuarioId: null }), 'yo');
    expect(etiquetas).toEqual({ esYo: false, esAdmin: false, esPendiente: true });
  });

  it('sin sesión nadie es "yo"', () => {
    expect(etiquetasIntegrante(integrante({}), undefined).esYo).toBe(false);
  });
});

describe('contarIntegrantes', () => {
  it('usa singular con uno solo', () => {
    expect(contarIntegrantes([integrante({})])).toBe('1 integrante');
  });

  it('agrega los pendientes cuando hay', () => {
    const lista = [
      integrante({}),
      integrante({ id: 'i2', usuarioId: null }),
      integrante({ id: 'i3', usuarioId: null }),
    ];
    expect(contarIntegrantes(lista)).toBe('3 integrantes · 2 pendientes');
  });
});
