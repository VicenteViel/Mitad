import { leerMonto, MONTO_MAXIMO } from '@/features/gastos/validar-gasto';

export type DatosPago = { de: string | null; a: string | null; monto: string };
export type ErroresPago = Partial<Record<'de' | 'a' | 'monto', string>>;

export function validarPago(datos: DatosPago): ErroresPago {
  const errores: ErroresPago = {};
  if (!datos.de) errores.de = 'Elige quién pagó.';
  if (!datos.a) errores.a = 'Elige quién recibió el pago.';
  else if (datos.de && datos.de === datos.a) errores.a = 'Quien paga y quien recibe deben ser distintos.';

  const monto = leerMonto(datos.monto);
  if (monto === null || monto <= 0) errores.monto = 'Escribe un monto en pesos, sin decimales.';
  else if (monto > MONTO_MAXIMO) errores.monto = 'El monto es demasiado grande.';
  return errores;
}
