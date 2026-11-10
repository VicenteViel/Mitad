import type { Json } from '@/lib/database.types';
import { esperar, SIMULAR_GUARDADO } from '@/lib/desarrollo';
import { supabase } from '@/lib/supabase';

import type { Avatar, Color } from './apariencia';
import type { BorradorGrupo } from './borrador-grupo';

// Crea el grupo completo en una sola transacción: el grupo, quien lo crea
// (admin) y los integrantes pendientes. Devuelve el id del grupo.
export async function iniciarGrupo(borrador: BorradorGrupo): Promise<string> {
  if (SIMULAR_GUARDADO) {
    // Modo prueba: no escribe en Supabase. La pausa deja ver el spinner.
    console.log('[modo prueba] iniciar_grupo simulado:', borrador);
    await esperar(800);
    return 'grupo-de-prueba';
  }

  const integrantes: Json = borrador.integrantes.map((i) => ({
    nombre: i.nombre.trim(),
    avatar: i.avatar,
    color: i.color,
  }));

  const { data, error } = await supabase.rpc('iniciar_grupo', {
    p_nombre: borrador.nombre,
    p_descripcion: borrador.descripcion,
    p_nombre_integrante: borrador.yo.nombre,
    p_avatar: borrador.yo.avatar,
    p_color: borrador.yo.color,
    p_integrantes: integrantes,
  });

  if (error) {
    throw new Error(`Error al iniciar el grupo: ${error.message}`);
  }

  return data;
}

export type IntegranteDetalle = {
  id: string;
  nombre: string;
  rol: 'admin' | 'integrante';
  avatar: Avatar;
  color: Color;
  // Vacío = pendiente (no ha aceptado su invitación).
  usuarioId: string | null;
};

export type GrupoDetalle = {
  id: string;
  nombre: string;
  descripcion: string | null;
  integrantes: IntegranteDetalle[];
};

// Un grupo con sus integrantes actuales (activos y pendientes), por orden de
// llegada. RLS solo lo devuelve si soy integrante; si no, no llega nada.
export async function obtenerGrupo(grupoId: string): Promise<GrupoDetalle> {
  const { data, error } = await supabase
    .from('grupos')
    .select('id, nombre, descripcion, integrantes(id, nombre, rol, avatar, color, usuario_id)')
    .eq('id', grupoId)
    .is('integrantes.salio_en', null)
    .order('unido_en', { referencedTable: 'integrantes', ascending: true })
    .single();

  if (error) {
    throw new Error(`Error al cargar el grupo: ${error.message}`);
  }

  return {
    id: data.id,
    nombre: data.nombre,
    descripcion: data.descripcion,
    integrantes: data.integrantes.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      rol: i.rol === 'admin' ? 'admin' : 'integrante',
      avatar: i.avatar === 'mujer' ? 'mujer' : 'hombre',
      color: i.color === 'rosado' ? 'rosado' : 'azul',
      usuarioId: i.usuario_id,
    })),
  };
}

export type GrupoResumen = {
  id: string;
  nombre: string;
  descripcion: string | null;
  cantidadIntegrantes: number;
};

// Grupos donde participo, del más nuevo al más antiguo. RLS ya filtra: solo
// llegan los grupos donde soy integrante. Cuenta activos y pendientes.
export async function obtenerMisGrupos(): Promise<GrupoResumen[]> {
  const { data, error } = await supabase
    .from('grupos')
    .select('id, nombre, descripcion, integrantes(count)')
    .is('integrantes.salio_en', null)
    .order('creado_en', { ascending: false });

  if (error) {
    throw new Error(`Error al cargar los grupos: ${error.message}`);
  }

  return data.map((g) => ({
    id: g.id,
    nombre: g.nombre,
    descripcion: g.descripcion,
    cantidadIntegrantes: g.integrantes[0]?.count ?? 0,
  }));
}
