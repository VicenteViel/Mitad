import { LIMITES } from './validar-nuevo-grupo';

export const MAX_INTEGRANTES_POR_VEZ = 20;

export type ErroresIntegrantes = {
  general?: string;
  // Error de cada fila, por su posición en la lista.
  porFila: Record<number, string>;
};

// La lista puede estar vacía: alguien que vive solo inicia el grupo sin pendientes.
export function validarIntegrantes(integrantes: { nombre: string }[]): ErroresIntegrantes {
  const errores: ErroresIntegrantes = { porFila: {} };

  if (integrantes.length > MAX_INTEGRANTES_POR_VEZ) {
    errores.general = `Máximo ${MAX_INTEGRANTES_POR_VEZ} rumis a la vez.`;
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
