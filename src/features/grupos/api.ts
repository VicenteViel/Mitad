import type { Json } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

import type { Avatar } from './apariencia';

export type NuevoGrupo = {
  nombre: string;
  descripcion?: string;
  nombreIntegrante: string;
  avatar: Avatar;
};

export type NuevoIntegrante = {
  nombre: string;
  avatar: Avatar;
};

export async function crearGrupo(datos: NuevoGrupo): Promise<string> {
  const { data, error } = await supabase.rpc('crear_grupo', {
    p_nombre: datos.nombre,
    p_descripcion: datos.descripcion ?? '',
    p_nombre_integrante: datos.nombreIntegrante,
    p_avatar: datos.avatar,
  });

  if (error) {
    throw new Error(`Error al crear el grupo: ${error.message}`);
  }

  return data;
}

export async function agregarIntegrantes(
  grupoId: string,
  integrantes: NuevoIntegrante[],
): Promise<number> {
  const lista: Json = integrantes.map((i) => ({ nombre: i.nombre.trim(), avatar: i.avatar }));

  const { data, error } = await supabase.rpc('agregar_integrantes', {
    p_grupo_id: grupoId,
    p_integrantes: lista,
  });

  if (error) {
    throw new Error(`Error al agregar integrantes: ${error.message}`);
  }

  return data;
}
