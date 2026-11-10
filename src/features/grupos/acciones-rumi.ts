// Qué acciones de ajustes se le muestran a quien mira la ficha de un rumi.
// Solo decide qué botones mostrar: el servidor siempre vuelve a validar.

export type RumiAjustes = {
  id: string;
  rol: 'admin' | 'integrante';
  usuarioId: string | null; // null = pendiente
};

export type AccionesRumi = {
  hacerAdmin: boolean;
  quitarAdmin: boolean;
  quitarDelGrupo: boolean;
  cambiarApariencia: boolean;
};

export function accionesSobreRumi(
  rumi: RumiAjustes,
  yo: RumiAjustes | undefined,
  cantidadAdmins: number,
): AccionesRumi {
  const soyAdmin = yo?.rol === 'admin';
  const esYo = rumi.id === yo?.id;
  const activo = rumi.usuarioId !== null;
  return {
    // El servidor además exige que tenga correo (regla 12).
    hacerAdmin: soyAdmin && activo && rumi.rol !== 'admin',
    // Nunca al último admin (regla 35).
    quitarAdmin: soyAdmin && rumi.rol === 'admin' && cantidadAdmins > 1,
    // A uno mismo no: para eso está "Salir del grupo".
    quitarDelGrupo: soyAdmin && !esYo,
    // Lo propio, o un admin para un pendiente.
    cambiarApariencia: esYo || (soyAdmin && !activo),
  };
}
