import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { PantallaFormulario } from '@/components/pantalla-formulario';
import { aceptarInvitacion } from '@/features/invitaciones/api';
import { guardarInvitacionAceptada } from '@/features/invitaciones/invitacion';
import { PALETA } from '@/theme/tema';

// Se abre desde el link (o desde "Me invitaron"). Acepta la invitación una sola
// vez; si no hay sesión, entra sin correo. Luego muestra "¡Te has unido!".
export default function AceptarInvitacionScreen() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const queryClient = useQueryClient();
  const intentado = useRef(false);

  const { mutate, isError, error } = useMutation({
    mutationFn: aceptarInvitacion,
    onSuccess: (invitacion) => {
      guardarInvitacionAceptada(invitacion);
      void queryClient.invalidateQueries();
      router.replace('/unido');
    },
  });

  useEffect(() => {
    if (intentado.current || !codigo) return;
    intentado.current = true;
    mutate(codigo);
  }, [codigo, mutate]);

  return (
    <PantallaFormulario logo>
      {!isError && (
        <>
          <ActivityIndicator color={PALETA.morado} size="large" />
          <Text style={styles.titulo}>Uniéndote a tu grupo…</Text>
        </>
      )}

      {isError && (
        <>
          <Text style={styles.titulo} accessibilityRole="header">
            No pudimos unirte
          </Text>
          <Text style={styles.texto}>{error.message}</Text>
          <Text style={styles.texto}>
            Pídele al administrador una invitación nueva si esta ya se usó o venció.
          </Text>
          <Pressable
            onPress={() => router.replace('/invitacion')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
          >
            <Text style={styles.botonTexto}>Escribir otro código</Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/')} accessibilityRole="button">
            <Text style={styles.enlace}>Ir al inicio</Text>
          </Pressable>
        </>
      )}
    </PantallaFormulario>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 22, fontWeight: '800', color: PALETA.morado, textAlign: 'center' },
  texto: { fontSize: 15, color: PALETA.textoSuave, textAlign: 'center', lineHeight: 21 },
  boton: {
    backgroundColor: PALETA.morado,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  botonTexto: { color: PALETA.blanco, fontSize: 16, fontWeight: '700' },
  presionado: { opacity: 0.85 },
  enlace: { color: PALETA.morado, fontSize: 15, fontWeight: '600', textAlign: 'center', paddingVertical: 6 },
});
