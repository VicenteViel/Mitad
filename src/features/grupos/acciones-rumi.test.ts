import { accionesSobreRumi, type RumiAjustes } from './acciones-rumi';

const admin: RumiAjustes = { id: 'admin', rol: 'admin', usuarioId: 'u-admin' };
const otroAdmin: RumiAjustes = { id: 'admin2', rol: 'admin', usuarioId: 'u-admin2' };
const camila: RumiAjustes = { id: 'camila', rol: 'integrante', usuarioId: 'u-camila' };
const abuela: RumiAjustes = { id: 'abuela', rol: 'integrante', usuarioId: null };

describe('accionesSobreRumi', () => {
  it('un admin puede hacer admin y quitar a un rumi activo', () => {
    expect(accionesSobreRumi(camila, admin, 1)).toEqual({
      hacerAdmin: true,
      quitarAdmin: false,
      quitarDelGrupo: true,
      cambiarApariencia: false,
    });
  });

  it('un pendiente no puede ser admin, pero un admin cambia su apariencia', () => {
    const acciones = accionesSobreRumi(abuela, admin, 1);
    expect(acciones.hacerAdmin).toBe(false);
    expect(acciones.cambiarApariencia).toBe(true);
    expect(acciones.quitarDelGrupo).toBe(true);
  });

  it('nunca se le quita el rol al último admin', () => {
    expect(accionesSobreRumi(admin, admin, 1).quitarAdmin).toBe(false);
    expect(accionesSobreRumi(otroAdmin, admin, 2).quitarAdmin).toBe(true);
  });

  it('nadie se quita a sí mismo del grupo, pero sí cambia su apariencia', () => {
    const acciones = accionesSobreRumi(admin, admin, 2);
    expect(acciones.quitarDelGrupo).toBe(false);
    expect(acciones.cambiarApariencia).toBe(true);
  });

  it('un rumi que no es admin solo puede cambiar lo suyo', () => {
    expect(accionesSobreRumi(camila, camila, 1)).toEqual({
      hacerAdmin: false,
      quitarAdmin: false,
      quitarDelGrupo: false,
      cambiarApariencia: true,
    });
    expect(accionesSobreRumi(abuela, camila, 1).cambiarApariencia).toBe(false);
  });
});
