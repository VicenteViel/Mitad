import { supabase } from '@/lib/supabase';

import { nuevaClaveIdempotencia } from './api';
import { rutaEvidencia } from './evidencia';
import { esCategoria } from './historial';
import type { Categoria, TipoDivision } from './validar-gasto';

export type GastoDetalle = {
  id: string;
  grupoId: string;
  descripcion: string;
  monto: number;
  categoria: Categoria;
  fecha: string;
  tipoDivision: TipoDivision;
  eliminado: boolean;
  pagadoPorId: string | null; // null: gasto por cubrir
  pagadoPorNombre: string | null;
  fechaLimite: string | null;
  mensual: boolean;
  creadoPorNombre: string;
  creadoEn: string;
  // Para editar sin pisar a otro admin (decisión 32).
  version: number;
  editadoPorNombre: string | null;
  editadoEn: string | null;
  eliminadoPorNombre: string | null;
  participaciones: { integranteId: string; nombre: string; monto: number; pagada: boolean }[];
};

type FilaDetalle = {
  version: number;
  editado_en: string | null;
  editor: { nombre: string } | null;
  borrador: { nombre: string } | null;
  id: string;
  grupo_id: string;
  descripcion: string;
  monto: number;
  categoria: string;
  fecha: string;
  tipo_division: string;
  borrado_en: string | null;
  pagado_por: string | null;
  fecha_limite: string | null;
  gasto_mensual_id: string | null;
  creado_en: string;
  pagador: { nombre: string } | null;
  creador: { nombre: string } | null;
  participaciones: {
    integrante_id: string;
    monto: number;
    pagada_en: string | null;
    integrante: { nombre: string } | null;
  }[];
};

export async function obtenerDetalleGasto(gastoId: string): Promise<GastoDetalle> {
  const { data, error } = await supabase
    .from('gastos')
    .select(
      'id, grupo_id, descripcion, monto, categoria, fecha, tipo_division, borrado_en, ' +
        'pagado_por, fecha_limite, gasto_mensual_id, creado_en, version, editado_en, ' +
        'pagador:integrantes!gastos_pagado_por_fkey(nombre), ' +
        'creador:integrantes!gastos_creado_por_fkey(nombre), ' +
        'editor:integrantes!gastos_editado_por_fkey(nombre), ' +
        'borrador:integrantes!gastos_borrado_por_fkey(nombre), ' +
        'participaciones(integrante_id, monto, pagada_en, integrante:integrantes(nombre))',
    )
    .eq('id', gastoId)
    .single();

  if (error) {
    throw new Error(`Error al cargar el gasto: ${error.message}`);
  }

  const g = data as unknown as FilaDetalle;
  return {
    id: g.id,
    grupoId: g.grupo_id,
    descripcion: g.descripcion,
    monto: g.monto,
    categoria: esCategoria(g.categoria) ? g.categoria : 'otros',
    fecha: g.fecha,
    tipoDivision: g.tipo_division === 'personalizada' ? 'personalizada' : 'equitativa',
    eliminado: g.borrado_en !== null,
    pagadoPorId: g.pagado_por,
    pagadoPorNombre: g.pagado_por ? (g.pagador?.nombre ?? 'Alguien') : null,
    fechaLimite: g.fecha_limite,
    mensual: g.gasto_mensual_id !== null,
    creadoPorNombre: g.creador?.nombre ?? 'Alguien',
    creadoEn: g.creado_en,
    version: g.version,
    editadoPorNombre: g.editor?.nombre ?? null,
    editadoEn: g.editado_en,
    eliminadoPorNombre: g.borrador?.nombre ?? null,
    participaciones: g.participaciones
      .map((p) => ({
        integranteId: p.integrante_id,
        nombre: p.integrante?.nombre ?? 'Rumi',
        monto: p.monto,
        pagada: p.pagada_en !== null,
      }))
      .sort((a, b) => b.monto - a.monto || a.nombre.localeCompare(b.nombre)),
  };
}

export type CambiosGasto = {
  gastoId: string;
  grupoId: string;
  version: number;
  descripcion: string;
  monto: number;
  categoria: Categoria;
  fechaLimite: string | null;
  pagadoPor: string | null;
  tipoDivision: TipoDivision;
  participaciones: { integranteId: string; monto: number }[];
};

// Mensajes del servidor que se pueden mostrar tal cual.
function mensajeServidor(mensaje: string, porDefecto: string): string {
  return /Otro admin modificó|Solo un admin|está eliminado/.test(mensaje) ? mensaje : porDefecto;
}

// Solo admins. Si otro admin lo cambió antes (versión distinta), falla con un
// mensaje que pide recargar.
export async function editarGasto(cambios: CambiosGasto): Promise<void> {
  const { error } = await supabase.rpc('editar_gasto', {
    p_gasto_id: cambios.gastoId,
    p_version: cambios.version,
    p_descripcion: cambios.descripcion,
    p_monto: cambios.monto,
    p_categoria: cambios.categoria,
    p_fecha_limite: cambios.fechaLimite,
    p_pagado_por: cambios.pagadoPor,
    p_tipo_division: cambios.tipoDivision,
    p_participantes: cambios.participaciones.map((p) => ({
      integrante_id: p.integranteId,
      monto: p.monto,
    })),
  });
  if (error) {
    throw new Error(mensajeServidor(error.message, 'No pudimos guardar los cambios.'));
  }
}

// Borrado lógico: queda en el historial como "eliminado" y no cuenta.
export async function eliminarGasto(gastoId: string): Promise<void> {
  const { error } = await supabase.rpc('eliminar_gasto', { p_gasto_id: gastoId });
  if (error) {
    throw new Error(mensajeServidor(error.message, 'No pudimos eliminar el gasto.'));
  }
}

export type EvidenciaGasto = {
  id: string;
  ruta: string;
  url: string | null; // enlace temporal firmado; null si no se pudo generar
  subidaPorId: string;
  subidaPorNombre: string;
  subidaEn: string;
};

type FilaEvidencia = {
  id: string;
  ruta: string;
  subida_por: string;
  subida_en: string;
  autor: { nombre: string } | null;
};

const BUCKET = 'evidencias';
const VIGENCIA_ENLACE_SEGUNDOS = 60 * 60;

// A qué pertenece una evidencia: un gasto (boleta) o un pago (transferencia).
export type OrigenEvidencia = { tipo: 'gasto' | 'pago'; id: string };

// Evidencias de un gasto o pago, las más nuevas primero, con enlaces
// temporales: el bucket es privado y solo los rumis del grupo pueden generarlos.
export async function obtenerEvidencias(origen: OrigenEvidencia): Promise<EvidenciaGasto[]> {
  const { data, error } = await supabase
    .from('evidencias')
    .select('id, ruta, subida_por, subida_en, autor:integrantes!evidencias_subida_por_fkey(nombre)')
    .eq(origen.tipo === 'gasto' ? 'gasto_id' : 'liquidacion_id', origen.id)
    .order('subida_en', { ascending: false });

  if (error) {
    throw new Error(`Error al cargar las evidencias: ${error.message}`);
  }

  const filas = data as unknown as FilaEvidencia[];
  if (filas.length === 0) return [];

  const { data: firmadas } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(
      filas.map((f) => f.ruta),
      VIGENCIA_ENLACE_SEGUNDOS,
    );
  const urlPorRuta = new Map((firmadas ?? []).map((f) => [f.path, f.signedUrl]));

  return filas.map((f) => ({
    id: f.id,
    ruta: f.ruta,
    url: urlPorRuta.get(f.ruta) ?? null,
    subidaPorId: f.subida_por,
    subidaPorNombre: f.autor?.nombre ?? 'Rumi',
    subidaEn: f.subida_en,
  }));
}

export type NuevaEvidencia = {
  grupoId: string;
  origen: OrigenEvidencia;
  uri: string;
  mimeType: string | null | undefined;
};

// Sube la imagen a Storage y la registra como evidencia. Si el registro falla,
// borra la imagen para no dejar archivos huérfanos.
export async function subirEvidencia(evidencia: NuevaEvidencia): Promise<void> {
  const ruta = rutaEvidencia(
    evidencia.grupoId,
    evidencia.origen.id,
    nuevaClaveIdempotencia(),
    evidencia.mimeType,
  );
  const contenido = await fetch(evidencia.uri).then((r) => r.arrayBuffer());

  const { error: errorSubida } = await supabase.storage.from(BUCKET).upload(ruta, contenido, {
    contentType: evidencia.mimeType ?? 'image/jpeg',
    upsert: false,
  });
  if (errorSubida) {
    throw new Error(`No pudimos subir la imagen: ${errorSubida.message}`);
  }

  const { error } =
    evidencia.origen.tipo === 'gasto'
      ? await supabase.rpc('registrar_evidencia', { p_gasto_id: evidencia.origen.id, p_ruta: ruta })
      : await supabase.rpc('registrar_evidencia_liquidacion', {
          p_liquidacion_id: evidencia.origen.id,
          p_ruta: ruta,
        });
  if (error) {
    await supabase.storage.from(BUCKET).remove([ruta]);
    throw new Error(`No pudimos guardar la evidencia: ${error.message}`);
  }
}

export async function borrarEvidencia(evidenciaId: string): Promise<void> {
  const { data: ruta, error } = await supabase.rpc('borrar_evidencia', {
    p_evidencia_id: evidenciaId,
  });
  if (error) {
    throw new Error(`No pudimos borrar la evidencia: ${error.message}`);
  }
  // Si fallara, queda solo la imagen sin registro (no se muestra en la app).
  await supabase.storage.from(BUCKET).remove([ruta]);
}
