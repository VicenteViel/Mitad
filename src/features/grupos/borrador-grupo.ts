import { colorPorDefecto, type Avatar, type Color } from './apariencia';
import { MAX_INTEGRANTES_POR_VEZ } from './validar-integrantes';

// Un grupo en construcción. Vive solo en el teléfono hasta "Iniciar grupo".

export type IntegranteBorrador = {
  nombre: string;
  avatar: Avatar;
  color: Color;
};

export type BorradorGrupo = {
  nombre: string;
  descripcion: string;
  yo: IntegranteBorrador;
  integrantes: IntegranteBorrador[];
};

export function integranteVacio(): IntegranteBorrador {
  return { nombre: '', avatar: 'hombre', color: colorPorDefecto('hombre') };
}

export function borradorVacio(): BorradorGrupo {
  return { nombre: '', descripcion: '', yo: integranteVacio(), integrantes: [] };
}

// Al cambiar el ícono, el color vuelve al de ese ícono (azul o rosado),
// salvo que en el mismo cambio se elija un color.
export function aplicarCambios(
  integrante: IntegranteBorrador,
  cambios: Partial<IntegranteBorrador>,
): IntegranteBorrador {
  const actualizado = { ...integrante, ...cambios };
  if (cambios.avatar && !cambios.color) {
    actualizado.color = colorPorDefecto(cambios.avatar);
  }
  return actualizado;
}

// Deja la lista con `cantidad` integrantes: conserva los que ya estaban
// escritos y agrega o quita filas al final.
export function ajustarCantidad(
  integrantes: IntegranteBorrador[],
  cantidad: number,
): IntegranteBorrador[] {
  const n = Math.min(Math.max(Math.trunc(cantidad), 0), MAX_INTEGRANTES_POR_VEZ);
  if (n <= integrantes.length) return integrantes.slice(0, n);
  return [...integrantes, ...Array.from({ length: n - integrantes.length }, integranteVacio)];
}
