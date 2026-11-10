import type { Json } from '@/lib/database.types';
import { esperar, SIMULAR_GUARDADO } from '@/lib/desarrollo';
import { supabase } from '@/lib/supabase';

import type { Participacion } from './division';
import type { Categoria, TipoDivision } from './validar-gasto';

export type IntegranteGasto = {
  id: string;
  nombre: string;
  pendiente: boolean;
  esYo: boolean;
};

export type DatosIntegrantesGasto = {
  integrantes: IntegranteGasto[];
  soyAdmin: boolean;
};

// Integrantes que pueden pagar o participar (activos y pendientes, regla 34),
// en orden de llegada: el mismo orden que usa registrar_gasto para el resto.
export async function obtenerIntegrantesGasto(grupoId: string): Promise<DatosIntegrantesGasto> {
  const { data: sesion } = await supabase.auth.getSession();
  const usuarioId = sesion.session?.user.id;

  const { data, error } = await supabase
    .from('integrantes')
    .select('id, nombre, usuario_id, rol')
    .eq('grupo_id', grupoId)
    .or('usuario_id.not.is.null,salio_en.is.null')
    .order('unido_en')
    .order('id');

  if (error) {
    throw new Error(`Error al cargar los integrantes: ${error.message}`);
  }

  return {
    integrantes: data.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      pendiente: i.usuario_id === null,
      esYo: i.usuario_id === usuarioId,
    })),
    soyAdmin: data.some((i) => i.usuario_id === usuarioId && i.rol === 'admin'),
  };
}

export type NuevoGasto = {
  grupoId: string;
  descripcion: string;
  monto: number;
  categoria: Categoria;
  fecha: string; // YYYY-MM-DD, día local del teléfono
  pagadoPor: string;
  tipoDivision: TipoDivision;
  // En la equitativa el servidor recalcula los montos; solo cuentan los ids.
  participaciones: Participacion[];
  claveIdempotencia: string;
};

// Crea el gasto y sus participaciones en una sola transacción. Si la clave ya
// se usó (reintento), el servidor devuelve el mismo gasto. Devuelve su id.
export async function registrarGasto(gasto: NuevoGasto): Promise<string> {
  if (SIMULAR_GUARDADO) {
    console.log('[modo prueba] registrar_gasto simulado:', gasto);
    await esperar(800);
    return 'gasto-de-prueba';
  }

  const participantes: Json = gasto.participaciones.map((p) => ({
    integrante_id: p.integranteId,
    monto: p.monto,
  }));

  const { data, error } = await supabase.rpc('registrar_gasto', {
    p_grupo_id: gasto.grupoId,
    p_descripcion: gasto.descripcion,
    p_monto: gasto.monto,
    p_categoria: gasto.categoria,
    p_fecha: gasto.fecha,
    p_pagado_por: gasto.pagadoPor,
    p_tipo_division: gasto.tipoDivision,
    p_participantes: participantes,
    p_clave_idempotencia: gasto.claveIdempotencia,
  });

  if (error) {
    throw new Error(`Error al registrar el gasto: ${error.message}`);
  }

  return data;
}

// Clave de idempotencia (uuid v4). expo-crypto no está instalado.
export function nuevaClaveIdempotencia(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // shortcut: Math.random no es criptográfico; basta para evitar duplicados
  // dentro de un grupo. Cambiar a expo-crypto si la clave pasa a ser secreta.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function hoyLocal(): string {
  const d = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}
