import { CATEGORIAS, type Categoria } from './validar-gasto';

// Un gasto tal como se muestra en el historial del grupo.
export type GastoHistorial = {
  id: string;
  descripcion: string;
  monto: number;
  categoria: Categoria;
  fecha: string; // YYYY-MM-DD
  creadoEn: string;
  eliminado: boolean;
  pagadoPorId: string;
  pagadoPorNombre: string;
  participaciones: { integranteId: string; monto: number }[];
};

const ICONOS: Record<Categoria, string> = {
  alimentacion: '🛒',
  arriendo: '🏠',
  servicios_basicos: '💡',
  transporte: '🚌',
  limpieza: '🧽',
  compras: '🛍️',
  otros: '📦',
};

export function iconoCategoria(categoria: Categoria): string {
  return ICONOS[categoria];
}

export function etiquetaCategoria(categoria: Categoria): string {
  return CATEGORIAS.find((c) => c.valor === categoria)?.etiqueta ?? 'Otros';
}

export function esCategoria(valor: string): valor is Categoria {
  return CATEGORIAS.some((c) => c.valor === valor);
}

// Cuánto me toca de un gasto; null si no participo.
export function miParte(gasto: GastoHistorial, miIntegranteId: string | undefined): number | null {
  if (!miIntegranteId) return null;
  return gasto.participaciones.find((p) => p.integranteId === miIntegranteId)?.monto ?? null;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// "Hoy", "Ayer" o "12 nov" (y el año si no es el actual). Fechas YYYY-MM-DD.
export function textoFecha(fecha: string, hoy: string): string {
  if (fecha === hoy) return 'Hoy';
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const [anioHoy, mesHoy, diaHoy] = hoy.split('-').map(Number);
  const ayer = new Date(anioHoy, mesHoy - 1, diaHoy - 1);
  if (anio === ayer.getFullYear() && mes === ayer.getMonth() + 1 && dia === ayer.getDate()) {
    return 'Ayer';
  }
  const base = `${dia} ${MESES[mes - 1]}`;
  return anio === anioHoy ? base : `${base} ${anio}`;
}
