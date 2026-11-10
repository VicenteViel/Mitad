import { leerColor, type Color } from '@/features/grupos/apariencia';
import type { Json } from '@/lib/database.types';
import { esperar, SIMULAR_GUARDADO } from '@/lib/desarrollo';
import { supabase } from '@/lib/supabase';

import type { Participacion } from './division';
import { esCategoria, type GastoHistorial } from './historial';
import type { Categoria, TipoDivision } from './validar-gasto';

export type IntegranteGasto = {
  id: string;
  nombre: string;
  pendiente: boolean;
  esYo: boolean;
  color: Color;
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
    .select('id, nombre, usuario_id, rol, avatar, color')
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
      color: leerColor(i.color, i.avatar === 'mujer' ? 'mujer' : 'hombre'),
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
  fechaLimite: string | null;
  // null: gasto por cubrir (solo admins).
  pagadoPor: string | null;
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
    p_fecha_limite: gasto.fechaLimite,
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

export type NuevoGastoMensual = Omit<NuevoGasto, 'fecha' | 'fechaLimite'> & {
  diaVencimiento: number; // 1 a 31; en meses más cortos, el último día
};

// Crea la plantilla mensual (solo admins). El servidor genera el gasto de este
// mes si su fecha límite aún no pasa, y luego uno al empezar cada mes.
export async function crearGastoMensual(gasto: NuevoGastoMensual): Promise<string> {
  if (SIMULAR_GUARDADO) {
    console.log('[modo prueba] crear_gasto_mensual simulado:', gasto);
    await esperar(800);
    return 'mensual-de-prueba';
  }

  const { data, error } = await supabase.rpc('crear_gasto_mensual', {
    p_grupo_id: gasto.grupoId,
    p_descripcion: gasto.descripcion,
    p_monto: gasto.monto,
    p_categoria: gasto.categoria,
    p_dia_vencimiento: gasto.diaVencimiento,
    p_pagado_por: gasto.pagadoPor,
    p_tipo_division: gasto.tipoDivision,
    p_participantes: gasto.participaciones.map((p) => ({
      integrante_id: p.integranteId,
      monto: p.monto,
    })),
    p_clave_idempotencia: gasto.claveIdempotencia,
  });

  if (error) {
    throw new Error(`Error al crear el gasto mensual: ${error.message}`);
  }
  return data;
}

// Historial del grupo, del más reciente al más antiguo (fecha y luego hora de
// creación). Incluye los borrados para mostrarlos como "eliminado" (regla 33).
// Antes genera los gastos mensuales de los meses que ya empezaron.
export async function obtenerGastos(grupoId: string): Promise<GastoHistorial[]> {
  const generados = await supabase.rpc('generar_gastos_mensuales', { p_grupo_id: grupoId });
  if (generados.error) {
    // No bloquea el historial: se reintenta en la próxima carga.
    console.warn('generar_gastos_mensuales falló', generados.error.message);
  }

  const { data, error } = await supabase
    .from('gastos')
    .select(
      'id, descripcion, monto, categoria, fecha, fecha_limite, gasto_mensual_id, creado_en, ' +
        'borrado_en, pagado_por, pagador:integrantes!gastos_pagado_por_fkey(nombre), ' +
        'participaciones(integrante_id, monto, pagada_en)',
    )
    .eq('grupo_id', grupoId)
    .order('fecha', { ascending: false })
    .order('creado_en', { ascending: false });

  if (error) {
    throw new Error(`Error al cargar los gastos: ${error.message}`);
  }

  return (data as unknown as FilaGasto[]).map((g) => ({
    id: g.id,
    descripcion: g.descripcion,
    monto: g.monto,
    categoria: esCategoria(g.categoria) ? g.categoria : 'otros',
    fecha: g.fecha,
    creadoEn: g.creado_en,
    eliminado: g.borrado_en !== null,
    pagadoPorId: g.pagado_por,
    pagadoPorNombre: g.pagado_por ? (g.pagador?.nombre ?? 'Alguien') : null,
    fechaLimite: g.fecha_limite,
    mensual: g.gasto_mensual_id !== null,
    participaciones: g.participaciones.map((p) => ({
      integranteId: p.integrante_id,
      monto: p.monto,
      pagada: p.pagada_en !== null,
    })),
  }));
}

// Marca (o desmarca) como pagada la parte de un rumi en un gasto por cubrir.
// La propia persona, o un admin para cualquiera.
export async function marcarPartePagada(datos: {
  gastoId: string;
  integranteId: string;
  pagada: boolean;
}): Promise<void> {
  if (SIMULAR_GUARDADO) {
    console.log('[modo prueba] marcar_parte_pagada simulado:', datos);
    await esperar(500);
    return;
  }
  const { error } = await supabase.rpc('marcar_parte_pagada', {
    p_gasto_id: datos.gastoId,
    p_integrante_id: datos.integranteId,
    p_pagada: datos.pagada,
  });
  if (error) {
    throw new Error(`No pudimos marcar la parte: ${error.message}`);
  }
}

export type GastoMensual = {
  id: string;
  descripcion: string;
  monto: number;
  categoria: Categoria;
  diaVencimiento: number;
  porCubrir: boolean;
  proximoMes: string; // YYYY-MM-01
};

// Plantillas activas del grupo, para verlas y detenerlas en Ajustes.
export async function obtenerGastosMensuales(grupoId: string): Promise<GastoMensual[]> {
  const { data, error } = await supabase
    .from('gastos_mensuales')
    .select('id, descripcion, monto, categoria, dia_vencimiento, pagado_por, proximo_mes')
    .eq('grupo_id', grupoId)
    .eq('activo', true)
    .order('creado_en');
  if (error) {
    throw new Error(`Error al cargar los gastos mensuales: ${error.message}`);
  }
  return data.map((m) => ({
    id: m.id,
    descripcion: m.descripcion,
    monto: m.monto,
    categoria: esCategoria(m.categoria) ? m.categoria : 'otros',
    diaVencimiento: m.dia_vencimiento,
    porCubrir: m.pagado_por === null,
    proximoMes: m.proximo_mes,
  }));
}

// Deja de generar gastos (solo admins). Los ya generados se conservan.
export async function detenerGastoMensual(gastoMensualId: string): Promise<void> {
  const { error } = await supabase.rpc('detener_gasto_mensual', {
    p_gasto_mensual_id: gastoMensualId,
  });
  if (error) {
    throw new Error(`No pudimos detener el gasto mensual: ${error.message}`);
  }
}

// Forma de cada fila de la consulta anterior (el embebido con alias no se
// infiere bien de los tipos generados).
type FilaGasto = {
  id: string;
  descripcion: string;
  monto: number;
  categoria: string;
  fecha: string;
  fecha_limite: string | null;
  gasto_mensual_id: string | null;
  creado_en: string;
  borrado_en: string | null;
  pagado_por: string | null;
  pagador: { nombre: string } | null;
  participaciones: { integrante_id: string; monto: number; pagada_en: string | null }[];
};

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
