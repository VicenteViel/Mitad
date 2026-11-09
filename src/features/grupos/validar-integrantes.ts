import type { NuevoIntegrante } from './api';
import { LIMITES } from './validar-nuevo-grupo';

export const MAX_INTEGRANTES_POR_VEZ = 20;

export type ErroresIntegrantes = {
  general?: string;
  // Error de cada fila, por su posición en la lista.
  porFila: Record<number, string>;
};

export function validarIntegrantes(integrantes: NuevoIntegrante[]): ErroresIntegrantes {
  const errores: ErroresIntegrantes = { porFila: {} };

  if (integrantes.length === 0) {
    errores.general = 'Agrega al menos un integrante.';
  } else if (integrantes.length > MAX_INTEGRANTES_POR_VEZ) {
    errores.general = `Máximo ${MAX_INTEGRANTES_POR_VEZ} integrantes a la vez.`;
  }

  integrantes.forEach((integrante, i) => {
    const nombre = integrante.nombre.trim();
    if (!nombre) {
      errores.porFila[i] = 'Escribe un nombre.';
    } else if (nombre.length > LIMITES.nombreIntegrante) {
      errores.porFila[i] = `Máximo ${LIMITES.nombreIntegrante} caracteres.`;
    }
  });

  return errores;
}

export function hayErrores(errores: ErroresIntegrantes): boolean {
  return errores.general !== undefined || Object.keys(errores.porFila).length > 0;
}
