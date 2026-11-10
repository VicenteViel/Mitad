import { puedeRegistrarPago, type RumiParaPermiso } from './permisos';

function rumi(id: string, cambios: Partial<RumiParaPermiso> = {}): RumiParaPermiso {
  return { id, rol: 'integrante', usuarioId: `u-${id}`, salio: false, ...cambios };
}

const admin = rumi('admin', { rol: 'admin' });
const camila = rumi('camila');
const diego = rumi('diego');
const abuela = rumi('abuela', { usuarioId: null });
const ex = rumi('ex', { usuarioId: null, salio: true });

describe('puedeRegistrarPago', () => {
  it('cualquiera de las dos partes puede registrarlo', () => {
    expect(puedeRegistrarPago(camila, camila, diego)).toBe(true);
    expect(puedeRegistrarPago(diego, camila, diego)).toBe(true);
  });

  it('un tercero no puede, aunque sea admin, si las partes están activas', () => {
    expect(puedeRegistrarPago(rumi('otro'), camila, diego)).toBe(false);
    expect(puedeRegistrarPago(admin, camila, diego)).toBe(false);
  });

  it('con un pendiente, solo un admin (regla 14b)', () => {
    expect(puedeRegistrarPago(diego, abuela, diego)).toBe(false);
    expect(puedeRegistrarPago(admin, abuela, diego)).toBe(true);
  });

  it('si una parte salió, la otra o un admin', () => {
    expect(puedeRegistrarPago(diego, ex, diego)).toBe(true);
    expect(puedeRegistrarPago(admin, ex, diego)).toBe(true);
    expect(puedeRegistrarPago(camila, ex, diego)).toBe(false);
  });

  it('nunca entre la misma persona ni sin saber quién soy', () => {
    expect(puedeRegistrarPago(camila, camila, camila)).toBe(false);
    expect(puedeRegistrarPago(undefined, camila, diego)).toBe(false);
  });
});
