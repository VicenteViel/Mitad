// Validación del formulario "Nuevo gasto". El servidor (registrar_gasto) vuelve
// a validar todo; esto solo da errores claros antes de enviar.

export const CATEGORIAS = [
  { valor: 'alimentacion', etiqueta: 'Alimentación' },
  { valor: 'arriendo', etiqueta: 'Arriendo' },
  { valor: 'servicios_basicos', etiqueta: 'Servicios básicos' },
  { valor: 'transporte', etiqueta: 'Transporte' },
  { valor: 'limpieza', etiqueta: 'Limpieza' },
  { valor: 'compras', etiqueta: 'Compras' },
  { valor: 'otros', etiqueta: 'Otros' },
] as const;

export type Categoria = (typeof CATEGORIAS)[number]['valor'];
export type TipoDivision = 'equitativa' | 'personalizada';

export const LIMITE_DESCRIPCION = 80;
// Muy por debajo del máximo de `integer` en Postgres (2.147.483.647).
export const MONTO_MAXIMO = 1_000_000_000;

// Lee lo que escribió la persona: "10000" o "10.000" (puntos de miles).
// Devuelve null si no es un entero de pesos válido (decimales, letras, vacío).
export function leerMonto(texto: string): number | null {
  const limpio = texto.trim();
  if (!/^(\d+|\d{1,3}(\.\d{3})+)$/.test(limpio)) return null;
  return Number(limpio.replace(/\./g, ''));
}

export function formatearPesos(monto: number): string {
  return '$' + String(monto).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Pone los puntos de miles mientras se escribe: "10000" → "10.000". Descarta
// lo que no sea dígito y limita a 9 cifras (cabe en un integer de Postgres).
export function formatearEntradaMonto(texto: string): string {
  const digitos = texto.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
  return digitos ? formatearPesos(Number(digitos)).slice(1) : '';
}

export type DatosGasto = {
  descripcion: string;
  monto: string;
  participantes: string[];
  tipoDivision: TipoDivision;
  // Solo para la personalizada: texto escrito por cada participante.
  montosPersonalizados: Record<string, string>;
};

export type ErroresGasto = {
  descripcion?: string;
  monto?: string;
  participantes?: string;
  personalizada?: string;
};

export function validarGasto(datos: DatosGasto): ErroresGasto {
  const errores: ErroresGasto = {};

  const descripcion = datos.descripcion.trim();
  if (!descripcion) {
    errores.descripcion = 'Escribe en qué se gastó.';
  } else if (descripcion.length > LIMITE_DESCRIPCION) {
    errores.descripcion = `Máximo ${LIMITE_DESCRIPCION} caracteres.`;
  }

  const monto = leerMonto(datos.monto);
  if (monto === null || monto <= 0) {
    errores.monto = 'Escribe un monto en pesos, sin decimales.';
  } else if (monto > MONTO_MAXIMO) {
    errores.monto = `El monto máximo es ${formatearPesos(MONTO_MAXIMO)}.`;
  }

  if (datos.participantes.length === 0) {
    errores.participantes = 'Marca al menos a una persona.';
  }

  if (errores.monto || errores.participantes || monto === null) return errores;

  if (datos.tipoDivision === 'equitativa') {
    if (monto < datos.participantes.length) {
      errores.monto = 'El monto debe ser al menos $1 por persona.';
    }
    return errores;
  }

  let suma = 0;
  for (const id of datos.participantes) {
    const parte = leerMonto(datos.montosPersonalizados[id] ?? '');
    if (parte === null || parte <= 0) {
      errores.personalizada = 'Cada persona marcada debe tener un monto mayor que $0.';
      return errores;
    }
    suma += parte;
  }
  if (suma !== monto) {
    errores.personalizada =
      suma < monto
        ? `Falta repartir ${formatearPesos(monto - suma)}.`
        : `Se repartieron ${formatearPesos(suma - monto)} de más.`;
  }

  return errores;
}
