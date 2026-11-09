import { Stack } from 'expo-router';

import { BorradorGrupoProvider } from '@/features/grupos/borrador-grupo-context';

// Flujo para crear un grupo. Todas estas pantallas comparten el mismo borrador,
// que se descarta al salir del flujo.
export default function NuevoGrupoLayout() {
  return (
    <BorradorGrupoProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </BorradorGrupoProvider>
  );
}
