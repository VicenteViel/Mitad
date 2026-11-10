import type { Avatar, Color } from '@/features/grupos/apariencia';

// Lo que recibe un integrante al aceptar su link: el grupo al que entra y el
// lugar que el admin le preparó (nombre, ícono y color).
export type InvitacionAceptada = {
  grupo: { nombre: string; descripcion: string | null };
  integrante: { nombre: string; avatar: Avatar; color: Color };
};

// Datos de ejemplo para recorrer las pantallas en modo prueba, mientras las
// invitaciones reales no existen.
export const INVITACION_DE_PRUEBA: InvitacionAceptada = {
  grupo: { nombre: 'Casa 4010', descripcion: 'Gastos y tareas del depto' },
  integrante: { nombre: 'Camila', avatar: 'mujer', color: 'rosado' },
};
