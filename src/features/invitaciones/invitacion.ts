import { leerColor, type Avatar, type Color } from '@/features/grupos/apariencia';

// Lo que recibe un integrante al aceptar su link: el grupo al que entra y el
// lugar que el admin le preparó (nombre, ícono y color).
export type InvitacionAceptada = {
  grupo: { id: string; nombre: string; descripcion: string | null };
  integrante: { nombre: string; avatar: Avatar; color: Color };
};

// Datos de ejemplo para recorrer las pantallas en modo prueba.
export const INVITACION_DE_PRUEBA: InvitacionAceptada = {
  grupo: { id: 'grupo-de-prueba', nombre: 'Casa 4010', descripcion: 'Gastos y tareas del depto' },
  integrante: { nombre: 'Camila', avatar: 'mujer', color: 'rosado' },
};

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

// Valida en tiempo de ejecución lo que devuelve aceptar_invitacion: llega
// como JSON sin tipos garantizados.
export function parsearInvitacionAceptada(datos: unknown): InvitacionAceptada {
  if (!esObjeto(datos) || !esObjeto(datos.grupo) || !esObjeto(datos.integrante)) {
    throw new Error('Respuesta de invitación inesperada');
  }
  const { grupo, integrante } = datos;
  if (
    typeof grupo.id !== 'string' ||
    typeof grupo.nombre !== 'string' ||
    typeof integrante.nombre !== 'string'
  ) {
    throw new Error('Respuesta de invitación inesperada');
  }
  return {
    grupo: {
      id: grupo.id,
      nombre: grupo.nombre,
      descripcion: typeof grupo.descripcion === 'string' ? grupo.descripcion : null,
    },
    integrante: {
      nombre: integrante.nombre,
      avatar: integrante.avatar === 'mujer' ? 'mujer' : 'hombre',
      color: leerColor(integrante.color, integrante.avatar === 'mujer' ? 'mujer' : 'hombre'),
    },
  };
}

// La última invitación aceptada, para las pantallas "¡Te has unido!" y
// "Tus datos". Vive en memoria: solo hace falta justo después de aceptar.
let ultimaAceptada: InvitacionAceptada | null = null;

export function guardarInvitacionAceptada(invitacion: InvitacionAceptada): void {
  ultimaAceptada = invitacion;
}

export function leerInvitacionAceptada(): InvitacionAceptada | null {
  return ultimaAceptada;
}
