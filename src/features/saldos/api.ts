import { esperar, SIMULAR_GUARDADO } from '@/lib/desarrollo';
import { supabase } from '@/lib/supabase';

import type { RumiParaPermiso } from './permisos';

// Todos los rumis del grupo, incluidos los que salieron: sus nombres hacen
// falta para mostrar saldos e historial antiguos.
export type RumiSaldo = RumiParaPermiso & { nombre: string };

export async function obtenerRumisSaldo(grupoId: string): Promise<RumiSaldo[]> {
  const { data, error } = await supabase
    .from('integrantes')
    .select('id, nombre, rol, usuario_id, salio_en')
    .eq('grupo_id', grupoId)
    .order('unido_en');

  if (error) {
    throw new Error(`Error al cargar los rumis: ${error.message}`);
  }

  return data.map((i) => ({
    id: i.id,
    nombre: i.nombre,
    rol: i.rol === 'admin' ? 'admin' : 'integrante',
    usuarioId: i.usuario_id,
    salio: i.salio_en !== null,
  }));
}

export type Pago = {
  id: string;
  de: string;
  a: string;
  monto: number;
  fecha: string;
  creadoEn: string;
  eliminado: boolean;
  declaradaPor: string;
};

export async function obtenerPagos(grupoId: string): Promise<Pago[]> {
  const { data, error } = await supabase
    .from('liquidaciones')
    .select('id, de, a, monto, fecha, creado_en, borrado_en, declarada_por')
    .eq('grupo_id', grupoId)
    .order('fecha', { ascending: false })
    .order('creado_en', { ascending: false });

  if (error) {
    throw new Error(`Error al cargar los pagos: ${error.message}`);
  }

  return data.map((l) => ({
    id: l.id,
    de: l.de,
    a: l.a,
    monto: l.monto,
    fecha: l.fecha,
    creadoEn: l.creado_en,
    eliminado: l.borrado_en !== null,
    declaradaPor: l.declarada_por,
  }));
}

export type NuevoPago = {
  grupoId: string;
  de: string;
  a: string;
  monto: number;
  fecha: string; // YYYY-MM-DD
  claveIdempotencia: string;
};

// Registra un pago entre dos rumis. Idempotente: si la clave ya se usó,
// devuelve el mismo pago. Devuelve su id.
export async function registrarPago(pago: NuevoPago): Promise<string> {
  if (SIMULAR_GUARDADO) {
    await esperar(700);
    return 'pago-de-prueba';
  }

  const { data, error } = await supabase.rpc('registrar_liquidacion', {
    p_grupo_id: pago.grupoId,
    p_de: pago.de,
    p_a: pago.a,
    p_monto: pago.monto,
    p_fecha: pago.fecha,
    p_clave_idempotencia: pago.claveIdempotencia,
  });

  if (error) {
    throw new Error(`Error al registrar el pago: ${error.message}`);
  }
  return data;
}
