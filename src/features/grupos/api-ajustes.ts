import { supabase } from '@/lib/supabase';

import type { Avatar, Color } from './apariencia';

// Mensajes de las funciones del servidor que se pueden mostrar tal cual.
const MENSAJES_CONOCIDOS = [
  'Solo un admin puede hacer esto',
  'Solo un rumi con correo puede ser admin',
  'No puedes quitar el rol al último admin',
  'Solo un rumi activo puede cambiar de rol',
  'Agrega tu correo para poder ser admin',
  'El grupo ya tiene admin',
  'Para irte, usa Salir del grupo',
];

function lanzar(error: { message: string } | null, porDefecto: string): void {
  if (!error) return;
  const conocido = MENSAJES_CONOCIDOS.find((m) => error.message.includes(m));
  throw new Error(conocido ?? porDefecto);
}

export async function editarGrupo(grupoId: string, nombre: string, descripcion: string) {
  const { error } = await supabase.rpc('editar_grupo', {
    p_grupo_id: grupoId,
    p_nombre: nombre,
    p_descripcion: descripcion,
  });
  lanzar(error, 'No pudimos guardar los cambios del grupo.');
}

export async function cambiarRol(integranteId: string, rol: 'admin' | 'integrante') {
  const { error } = await supabase.rpc('cambiar_rol', { p_integrante_id: integranteId, p_rol: rol });
  lanzar(error, 'No pudimos cambiar el rol.');
}

export async function quitarIntegrante(integranteId: string) {
  const { error } = await supabase.rpc('quitar_integrante', { p_integrante_id: integranteId });
  lanzar(error, 'No pudimos quitar a este rumi.');
}

export async function salirDelGrupo(grupoId: string) {
  const { error } = await supabase.rpc('salir_del_grupo', { p_grupo_id: grupoId });
  lanzar(error, 'No pudimos sacarte del grupo.');
}

export async function tomarAdmin(grupoId: string) {
  const { error } = await supabase.rpc('tomar_admin', { p_grupo_id: grupoId });
  lanzar(error, 'No pudimos darte el rol de admin.');
}

export async function cambiarApariencia(integranteId: string, avatar: Avatar, color: Color) {
  const { error } = await supabase.rpc('cambiar_apariencia', {
    p_integrante_id: integranteId,
    p_avatar: avatar,
    p_color: color,
  });
  lanzar(error, 'No pudimos cambiar la apariencia.');
}

// Agrega rumis pendientes a un grupo que ya existe (solo admins).
export async function agregarRumi(grupoId: string, nombre: string, avatar: Avatar) {
  const { error } = await supabase.rpc('agregar_integrantes', {
    p_grupo_id: grupoId,
    p_integrantes: [{ nombre: nombre.trim(), avatar }],
  });
  lanzar(error, 'No pudimos agregar al rumi.');
}
