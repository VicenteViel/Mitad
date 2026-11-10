import { LIMITES } from '@/features/grupos/validar-nuevo-grupo';

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type DatosIntegrante = {
  alias: string;
  correo: string;
};

export type ErroresDatosIntegrante = Partial<Record<keyof DatosIntegrante, string>>;

// Alias y correo son opcionales, pero si se escriben deben ser válidos.
export function validarDatosIntegrante(datos: DatosIntegrante): ErroresDatosIntegrante {
  const errores: ErroresDatosIntegrante = {};

  if (datos.alias.trim().length > LIMITES.nombreIntegrante) {
    errores.alias = `Máximo ${LIMITES.nombreIntegrante} caracteres.`;
  }

  const correo = datos.correo.trim();
  if (correo && !CORREO_VALIDO.test(correo)) {
    errores.correo = 'Escribe un correo válido.';
  }

  return errores;
}
