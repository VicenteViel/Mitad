// Apariencia de un integrante (decisión 38): ícono + color.
// Es apariencia, no un dato personal: cada integrante la cambia desde su perfil.

export type Avatar = 'hombre' | 'mujer';

export const COLORES = {
  azul: '#2F80ED',
  rosado: '#E8559A',
} as const;

export type Color = keyof typeof COLORES;

export function colorPorDefecto(avatar: Avatar): Color {
  return avatar === 'mujer' ? 'rosado' : 'azul';
}
