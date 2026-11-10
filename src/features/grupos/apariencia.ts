// Apariencia de un integrante (decisión 38): ícono + color.
// Es apariencia, no un dato personal: cada integrante la cambia desde su perfil.

export type Avatar = 'hombre' | 'mujer';

// Mismos valores que acepta la columna integrantes.color en la base de datos.
export const COLORES = {
  azul: '#2F80ED',
  rosado: '#E8559A',
  morado: '#7B4FC0',
  celeste: '#2BA8D9',
  verde: '#27A35F',
  amarillo: '#E0A800',
  naranja: '#F07B2D',
  rojo: '#D64545',
} as const;

export type Color = keyof typeof COLORES;

export const NOMBRES_COLOR: Record<Color, string> = {
  azul: 'Azul',
  rosado: 'Rosado',
  morado: 'Morado',
  celeste: 'Celeste',
  verde: 'Verde',
  amarillo: 'Amarillo',
  naranja: 'Naranja',
  rojo: 'Rojo',
};

export function colorPorDefecto(avatar: Avatar): Color {
  return avatar === 'mujer' ? 'rosado' : 'azul';
}

export function esColor(valor: unknown): valor is Color {
  return typeof valor === 'string' && valor in COLORES;
}

// Lee un color guardado; si no se reconoce, usa el del ícono.
export function leerColor(valor: unknown, avatar: Avatar): Color {
  return esColor(valor) ? valor : colorPorDefecto(avatar);
}
