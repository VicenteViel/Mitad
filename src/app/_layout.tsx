import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useSesion } from '@/features/auth/use-sesion';
import { temaRumi } from '@/theme/tema';

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

export default function RootLayout() {
  const { sesion, cargando } = useSesion();

  useEffect(() => {
    if (!cargando) SplashScreen.hideAsync();
  }, [cargando]);

  if (cargando) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={temaRumi}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Con sesión, las pantallas de acceso llevan a Inicio. */}
          <Stack.Protected guard={!sesion} redirectTo="/">
            <Stack.Screen name="bienvenida" />
            <Stack.Screen name="recuperar" />
            <Stack.Screen name="ingresar" />
          </Stack.Protected>
          {/* Sin sesión, todo lo demás lleva a la bienvenida (no a Ingresar). */}
          <Stack.Protected guard={!!sesion} redirectTo="/bienvenida">
            <Stack.Screen name="index" />
            <Stack.Screen name="(nuevo-grupo)" />
            <Stack.Screen name="(unirse)" options={{ gestureEnabled: false }} />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );

  }