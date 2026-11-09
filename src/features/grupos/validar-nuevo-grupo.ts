export const LIMITES = {
  nombre: 60,
  descripcion: 200,
  nombreIntegrante: 40,
} as const;

// Campos de texto del formulario. El ícono no se valida: siempre tiene un valor.
export type DatosGrupo = {
  nombre: string;
  descripcion?: string;
  nombreIntegrante: string;
};

export type ErroresNuevoGrupo = Partial<Record<keyof DatosGrupo, string>>;

export function validarNuevoGrupo(datos: DatosGrupo): ErroresNuevoGrupo {
  const errores: ErroresNuevoGrupo = {};

  const nombre = datos.nombre.trim();
  const nombreIntegrante = datos.nombreIntegrante.trim();
  const descripcion = datos.descripcion?.trim() ?? '';

  if (!nombre) {
    errores.nombre = 'Escribe un nombre para el grupo.';
  } else if (nombre.length > LIMITES.nombre) {
    errores.nombre = `Máximo ${LIMITES.nombre} caracteres.`;
  }

  if (!nombreIntegrante) {
    errores.nombreIntegrante = 'Escribe tu nombre.';
  } else if (nombreIntegrante.length > LIMITES.nombreIntegrante) {
    errores.nombreIntegrante = `Máximo ${LIMITES.nombreIntegrante} caracteres.`;
  }

  if (descripcion.length > LIMITES.descripcion) {
    errores.descripcion = `Máximo ${LIMITES.descripcion} caracteres.`;
  }

  return errores;
}