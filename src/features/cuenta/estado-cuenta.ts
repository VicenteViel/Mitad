// Estado del correo de la cuenta, a partir del usuario de Supabase Auth.
// - con-correo: entró con correo (o ya confirmó el que agregó).
// - verificando: cuenta sin correo que agregó uno y aún no lo confirma.
// - sin-correo: cuenta anónima (entró con una invitación) sin correo.
export type EstadoCuenta =
  | { tipo: 'con-correo'; correo: string }
  | { tipo: 'verificando'; correo: string }
  | { tipo: 'sin-correo' };

export type UsuarioParaEstado = {
  email?: string | null;
  new_email?: string | null;
  is_anonymous?: boolean;
};

export function estadoCuenta(usuario: UsuarioParaEstado | null | undefined): EstadoCuenta {
  if (usuario?.email && !usuario.is_anonymous) {
    return { tipo: 'con-correo', correo: usuario.email };
  }
  if (usuario?.new_email) {
    return { tipo: 'verificando', correo: usuario.new_email };
  }
  return { tipo: 'sin-correo' };
}
