// Opciones solo para desarrollo. En una compilación de producción `__DEV__` es
// false, así que nada de esto se activa aunque la variable exista.

// Con EXPO_PUBLIC_SIMULAR_GUARDADO=true en .env.local, las operaciones que
// escriben en Supabase se simulan: se puede recorrer el flujo completo sin
// llenar la base de datos de grupos e integrantes de prueba.
export const SIMULAR_GUARDADO =
  __DEV__ && process.env.EXPO_PUBLIC_SIMULAR_GUARDADO === 'true';

export function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
