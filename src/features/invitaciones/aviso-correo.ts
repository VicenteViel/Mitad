// Recordatorio de correo que muestra Inicio después de unirse a un grupo.
// - 'agregar': no dejó correo; sin él no puede recuperar su lugar.
// - 'verificar': dejó un correo que aún no confirma.
// Por ahora vive en memoria (modo prueba). Con invitaciones reales se deducirá
// de la sesión: usuario sin correo, o con correo sin confirmar.

export type AvisoCorreo = { tipo: 'agregar' } | { tipo: 'verificar'; correo: string } | null;

let aviso: AvisoCorreo = null;

export function definirAvisoCorreo(nuevo: AvisoCorreo): void {
  aviso = nuevo;
}

export function leerAvisoCorreo(): AvisoCorreo {
  return aviso;
}
