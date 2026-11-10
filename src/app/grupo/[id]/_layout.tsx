import { Stack } from 'expo-router';

// Pantallas de un grupo: su detalle (index) y las que cuelgan de él, como
// registrar un gasto. Quedan protegidas por la sesión desde el layout raíz.
export default function GrupoLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
