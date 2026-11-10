// Quién puede registrar un pago entre dos rumis. Es la misma regla que aplica
// registrar_liquidacion en el servidor; aquí solo sirve para mostrar u ocultar
// botones. El servidor siempre vuelve a validar.

export type RumiParaPermiso = {
  id: string;
  rol: 'admin' | 'integrante';
  // Vacío = pendiente (o ex-integrante si salio).
  usuarioId: string | null;
  salio: boolean;
};

function esPendiente(r: RumiParaPermiso): boolean {
  return r.usuarioId === null && !r.salio;
}

export function puedeRegistrarPago(
  yo: RumiParaPermiso | undefined,
  de: RumiParaPermiso,
  a: RumiParaPermiso,
): boolean {
  if (!yo || de.id === a.id) return false;
  const soyAdmin = yo.rol === 'admin';
  // Regla 14b: con un pendiente de por medio, solo un admin.
  if (esPendiente(de) || esPendiente(a)) return soyAdmin;
  // Regla 18: cualquiera de las dos partes, sin confirmación.
  if (yo.id === de.id || yo.id === a.id) return true;
  // Un admin, solo si alguna parte ya salió del grupo.
  return soyAdmin && (de.salio || a.salio);
}
