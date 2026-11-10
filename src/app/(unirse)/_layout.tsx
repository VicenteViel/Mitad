import { Redirect, Stack } from 'expo-router';

import {
  INVITACION_DE_PRUEBA,
  leerInvitacionAceptada,
} from '@/features/invitaciones/invitacion';
import { InvitacionProvider } from '@/features/invitaciones/invitacion-context';
import { SIMULAR_GUARDADO } from '@/lib/desarrollo';

// Flujo justo después de aceptar una invitación. Usa la invitación recién
// aceptada; en modo prueba, si no hay una, usa datos de ejemplo.
export default function UnirseLayout() {
  const invitacion =
    leerInvitacionAceptada() ?? (SIMULAR_GUARDADO ? INVITACION_DE_PRUEBA : null);

  if (!invitacion) {
    return <Redirect href="/" />;
  }

  return (
    <InvitacionProvider invitacion={invitacion}>
      <Stack screenOptions={{ headerShown: false }} />
    </InvitacionProvider>
  );
}
