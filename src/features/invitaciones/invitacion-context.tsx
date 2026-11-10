import { createContext, useContext, type ReactNode } from 'react';

import type { InvitacionAceptada } from './invitacion';

const Contexto = createContext<InvitacionAceptada | null>(null);

// Comparte la invitación aceptada entre las pantallas de "unirse a un grupo".
export function InvitacionProvider({
  invitacion,
  children,
}: {
  invitacion: InvitacionAceptada;
  children: ReactNode;
}) {
  return <Contexto.Provider value={invitacion}>{children}</Contexto.Provider>;
}

export function useInvitacion(): InvitacionAceptada {
  const invitacion = useContext(Contexto);
  if (!invitacion) {
    throw new Error('useInvitacion debe usarse dentro de InvitacionProvider');
  }
  return invitacion;
}
