import * as Linking from 'expo-linking';

import { esperar, SIMULAR_GUARDADO } from '@/lib/desarrollo';
import { supabase } from '@/lib/supabase';

import { normalizarCodigo } from './codigo';
import {
  INVITACION_DE_PRUEBA,
  parsearInvitacionAceptada,
  type InvitacionAceptada,
} from './invitacion';

// Link que abre la app en la pantalla de la invitación. En Expo Go queda como
// exp://…/--/invitacion/CODIGO; en la app instalada, rumi://invitacion/CODIGO.
export function linkInvitacion(codigo: string): string {
  return Linking.createURL(`/invitacion/${normalizarCodigo(codigo)}`);
}

// El admin crea la invitación de un pendiente. Devuelve el código, que solo se
// conoce ahora: crear otra anula la anterior.
export async function crearInvitacion(integranteId: string): Promise<string> {
  if (SIMULAR_GUARDADO) {
    await esperar(500);
    return 'ABCDE23456';
  }

  const { data, error } = await supabase.rpc('crear_invitacion', {
    p_integrante_id: integranteId,
  });
  if (error) {
    throw new Error(`Error al crear la invitación: ${error.message}`);
  }
  return data;
}

// Mensajes de aceptar_invitacion que se pueden mostrar tal cual.
const ERRORES_CONOCIDOS = ['Invitación no válida o vencida', 'Ya eres parte de este grupo'];

// Acepta la invitación. Si la persona no tiene sesión, entra sin correo
// (sesión anónima de Supabase); después puede agregar su correo.
export async function aceptarInvitacion(codigo: string): Promise<InvitacionAceptada> {
  if (SIMULAR_GUARDADO) {
    await esperar(600);
    return INVITACION_DE_PRUEBA;
  }

  const { data: sesion } = await supabase.auth.getSession();
  if (!sesion.session) {
    const { error: errorAnonimo } = await supabase.auth.signInAnonymously();
    if (errorAnonimo) {
      throw new Error(`No pudimos crear tu sesión: ${errorAnonimo.message}`);
    }
  }

  const { data, error } = await supabase.rpc('aceptar_invitacion', {
    p_codigo: normalizarCodigo(codigo),
  });
  if (error) {
    const conocido = ERRORES_CONOCIDOS.find((m) => error.message.includes(m));
    throw new Error(conocido ?? 'No pudimos unirte al grupo. Intenta de nuevo.');
  }
  return parsearInvitacionAceptada(data);
}

export async function actualizarAlias(grupoId: string, alias: string): Promise<void> {
  const { error } = await supabase.rpc('actualizar_alias', {
    p_grupo_id: grupoId,
    p_alias: alias,
  });
  if (error) {
    throw new Error(`Error al guardar el apodo: ${error.message}`);
  }
}

// Agrega un correo a una cuenta sin correo. Supabase envía un enlace para
// confirmarlo; hasta entonces queda pendiente de verificar.
export async function agregarCorreo(correo: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email: correo.trim().toLowerCase() });
  if (error) {
    if (/already|registered|exists/i.test(error.message)) {
      throw new Error(
        'Ese correo ya tiene una cuenta en Rumi. Usa otro, o cierra sesión e ingresa con ese correo.',
      );
    }
    throw new Error('No pudimos guardar tu correo. Intenta de nuevo.');
  }
}
