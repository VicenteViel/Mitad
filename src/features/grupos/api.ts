import type { Json } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

import type { BorradorGrupo } from './borrador-grupo';

// Crea el grupo completo en una sola transacción: el grupo, quien lo crea
// (admin) y los integrantes pendientes. Devuelve el id del grupo.
export async function iniciarGrupo(borrador: BorradorGrupo): Promise<string> {
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
