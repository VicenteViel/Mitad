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
          <Stack.Protected guard={!sesion}>
            <Stack.Screen name="bienvenida" />
            <Stack.Screen name="recuperar" />
            <Stack.Screen name="ingresar" />
          </Stack.Protected>
          <Stack.Protected guard={!!sesion}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(nuevo-grupo)" />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );

  }