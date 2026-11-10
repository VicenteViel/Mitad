import { Stack } from 'expo-router';

import { INVITACION_DE_PRUEBA } from '@/features/invitaciones/invitacion';
import { InvitacionProvider } from '@/features/invitaciones/invitacion-context';

// Flujo después de aceptar un link de invitación. Por ahora usa datos de
// prueba; con invitaciones reales, recibirá lo que devuelva Supabase al aceptar.
export default function UnirseLayout() {
  return (
    <InvitacionProvider invitacion={INVITACION_DE_PRUEBA}>
      <Stack screenOptions={{ headerShown: false }} />
    </InvitacionProvider>
  );
}
