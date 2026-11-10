import { estadoCuenta } from './estado-cuenta';

describe('estadoCuenta', () => {
  it('cuenta con correo', () => {
    expect(estadoCuenta({ email: 'a@b.cl', is_anonymous: false })).toEqual({
      tipo: 'con-correo',
      correo: 'a@b.cl',
    });
  });

  it('cuenta sin correo que agregó uno pendiente de confirmar', () => {
    expect(estadoCuenta({ email: null, new_email: 'c@d.cl', is_anonymous: true })).toEqual({
      tipo: 'verificando',
      correo: 'c@d.cl',
    });
  });

  it('cuenta anónima sin correo', () => {
    expect(estadoCuenta({ is_anonymous: true })).toEqual({ tipo: 'sin-correo' });
  });

  it('sin usuario, como sin correo', () => {
    expect(estadoCuenta(null)).toEqual({ tipo: 'sin-correo' });
  });
});
