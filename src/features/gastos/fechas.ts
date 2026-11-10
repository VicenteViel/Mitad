// Fechas de calendario en formato YYYY-MM-DD, sin horas ni zonas horarias:
// "5 de noviembre" es el mismo día en cualquier teléfono.

const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const dos = (n: number) => String(n).padStart(2, '0');

export function aTexto(anio: number, mes: number, dia: number): string {
  return `${anio}-${dos(mes)}-${dos(dia)}`;
}

export function leerFecha(fecha: string): { anio: number; mes: number; dia: number } {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return { anio, mes, dia };
}

export function diasDelMes(anio: number, mes: number): number {
  return new Date(anio, mes, 0).getDate();
}

// Mes siguiente o anterior (mes de 1 a 12).
export function moverMes(anio: number, mes: number, delta: number): { anio: number; mes: number } {
  const total = anio * 12 + (mes - 1) + delta;
  return { anio: Math.floor(total / 12), mes: (total % 12) + 1 };
}

// Celdas de un mes para un calendario que empieza el lunes: null = vacío.
export function celdasDelMes(anio: number, mes: number): (number | null)[] {
  const primerDia = new Date(anio, mes - 1, 1).getDay(); // 0 = domingo
  const vacios = (primerDia + 6) % 7;
  const dias = Array.from({ length: diasDelMes(anio, mes) }, (_, i) => i + 1);
  return [...Array<null>(vacios).fill(null), ...dias];
}

// El día elegido en ese mes; si el mes es más corto, su último día (igual que
// vencimiento_del_mes en el servidor).
export function vencimientoDelMes(anio: number, mes: number, dia: number): string {
  return aTexto(anio, mes, Math.min(dia, diasDelMes(anio, mes)));
}

// Primer vencimiento de un gasto mensual: el de este mes si aún no pasa, si no
// el del próximo (igual que crear_gasto_mensual).
export function primerVencimientoMensual(hoy: string, dia: number): string {
  const { anio, mes } = leerFecha(hoy);
  const este = vencimientoDelMes(anio, mes, dia);
  if (este >= hoy) return este;
  const siguiente = moverMes(anio, mes, 1);
  return vencimientoDelMes(siguiente.anio, siguiente.mes, dia);
}

export function nombreMes(mes: number): string {
  return MESES_LARGOS[mes - 1];
}

// "5 nov" (y el año si no es el de `hoy`).
export function fechaCorta(fecha: string, hoy: string): string {
  const { anio, mes, dia } = leerFecha(fecha);
  const base = `${dia} ${MESES_CORTOS[mes - 1]}`;
  return anio === leerFecha(hoy).anio ? base : `${base} ${anio}`;
}

// "5 de noviembre" (y el año si no es el de `hoy`).
export function fechaLarga(fecha: string, hoy: string): string {
  const { anio, mes, dia } = leerFecha(fecha);
  const base = `${dia} de ${MESES_LARGOS[mes - 1]}`;
  return anio === leerFecha(hoy).anio ? base : `${base} de ${anio}`;
}

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

// Encabezado de un día en el historial: "Hoy", "Ayer" o "lunes 9 de noviembre".
export function fechaConDia(fecha: string, hoy: string): string {
  if (fecha === hoy) return 'Hoy';
  const h = leerFecha(hoy);
  const ayer = new Date(h.anio, h.mes - 1, h.dia - 1);
  const { anio, mes, dia } = leerFecha(fecha);
  if (anio === ayer.getFullYear() && mes === ayer.getMonth() + 1 && dia === ayer.getDate()) {
    return 'Ayer';
  }
  const semana = DIAS_SEMANA[new Date(anio, mes - 1, dia).getDay()];
  return `${semana} ${fechaLarga(fecha, hoy)}`;
}

// Fecha y hora locales de un instante ISO: "9 nov · 14:35".
export function fechaYHora(instante: string, hoy: string): string {
  const d = new Date(instante);
  const fecha = aTexto(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${fechaCorta(fecha, hoy)} · ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}
