import { ajustarCantidad, aplicarCambios, integranteVacio } from './borrador-grupo';

describe('aplicarCambios', () => {
  it('al cambiar a mujer, el color pasa a rosado', () => {
    const resultado = aplicarCambios(integranteVacio(), { avatar: 'mujer' });
    expect(resultado).toEqual({ nombre: '', avatar: 'mujer', color: 'rosado' });
  });

  it('respeta el color si se elige junto con el ícono', () => {
    const resultado = aplicarCambios(integranteVacio(), { avatar: 'mujer', color: 'azul' });
    expect(resultado.color).toBe('azul');
  });

  it('cambiar solo el color no toca el ícono', () => {
    const resultado = aplicarCambios(integranteVacio(), { color: 'rosado' });
    expect(resultado).toEqual({ nombre: '', avatar: 'hombre', color: 'rosado' });
  });
});

describe('ajustarCantidad', () => {
  const diego = { nombre: 'Diego', avatar: 'hombre', color: 'azul' } as const;
  const camila = { nombre: 'Camila', avatar: 'mujer', color: 'rosado' } as const;

  it('agrega filas vacías al final y conserva las escritas', () => {
    const resultado = ajustarCantidad([diego], 3);
    expect(resultado).toHaveLength(3);
    expect(resultado[0]).toEqual(diego);
    expect(resultado[2].nombre).toBe('');
  });

  it('quita filas desde el final', () => {
    expect(ajustarCantidad([diego, camila], 1)).toEqual([diego]);
  });

  it('acepta cero (vivir solo)', () => {
    expect(ajustarCantidad([diego], 0)).toEqual([]);
  });

  it('no pasa de 20', () => {
    expect(ajustarCantidad([], 50)).toHaveLength(20);
  });
});
