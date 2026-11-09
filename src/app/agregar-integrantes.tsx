import { router, useLocalSearchParams, useTheme } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Avatar } from '@/features/grupos/apariencia';
import { SelectorAvatar } from '@/features/grupos/components/selector-avatar';
import { useAgregarIntegrantes } from '@/features/grupos/use-agregar-integrantes';
import {
  hayErrores,
  MAX_INTEGRANTES_POR_VEZ,
  validarIntegrantes,
  type ErroresIntegrantes,
} from '@/features/grupos/validar-integrantes';
import { LIMITES } from '@/features/grupos/validar-nuevo-grupo';

type Fila = { nombre: string; avatar: Avatar };

function filasIniciales(cantidad: string | undefined): Fila[] {
  const n = Math.min(Math.max(Number(cantidad) || 1, 1), MAX_INTEGRANTES_POR_VEZ);
  return Array.from({ length: n }, () => ({ nombre: '', avatar: 'hombre' }));
}

export default function AgregarIntegrantesScreen() {
  const { colors } = useTheme();
  const { grupoId, cantidad } = useLocalSearchParams<{ grupoId: string; cantidad: string }>();
  const [filas, setFilas] = useState<Fila[]>(() => filasIniciales(cantidad));
  const [errores, setErrores] = useState<ErroresIntegrantes>({ porFila: {} });
  const { mutate, isPending, error } = useAgregarIntegrantes();

  function actualizarFila(indice: number, cambios: Partial<Fila>) {
    setFilas((actuales) => actuales.map((f, i) => (i === indice ? { ...f, ...cambios } : f)));
  }

  function guardar() {
    if (!grupoId) return;
    const nuevosErrores = validarIntegrantes(filas);
    setErrores(nuevosErrores);
    if (hayErrores(nuevosErrores)) return;

    mutate({ grupoId, integrantes: filas }, { onSuccess: () => router.replace('/') });
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={[styles.title, { color: colors.text }]}>¿Quién vive contigo?</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Quedarán pendientes hasta que acepten su invitación.
      </Text>

      {filas.map((fila, i) => (
        <View key={i} style={styles.fila}>
          <Text style={[styles.label, { color: colors.text }]}>Nombre</Text>
          <View style={styles.filaContenido}>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={fila.nombre}
              onChangeText={(nombre) => actualizarFila(i, { nombre })}
              placeholder={`Integrante ${i + 2}`}
              placeholderTextColor="#888"
              maxLength={LIMITES.nombreIntegrante}
              accessibilityLabel={`Nombre del integrante ${i + 2}`}
            />
            <SelectorAvatar
              compacto
              value={fila.avatar}
              onChange={(avatar) => actualizarFila(i, { avatar })}
            />
          </View>
          {errores.porFila[i] && <Text style={styles.error}>{errores.porFila[i]}</Text>}
        </View>
      ))}

      {errores.general && <Text style={styles.error}>{errores.general}</Text>}
      {error && (
        <Text style={styles.error}>No pudimos agregar a los integrantes. Intenta de nuevo.</Text>
      )}

      <Pressable
        style={[styles.button, { backgroundColor: colors.primary, opacity: isPending ? 0.6 : 1 }]}
        onPress={guardar}
        disabled={isPending}
        accessibilityRole="button"
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Guardar</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.replace('/')} accessibilityRole="button">
        <Text style={[styles.link, { color: colors.primary }]}>Ahora no</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 72, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, opacity: 0.6, textAlign: 'center', marginBottom: 8 },
  fila: { gap: 6 },
  filaContenido: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontSize: 15, fontWeight: '600' },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 18 },
  error: { color: '#D93025', fontSize: 14 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', fontSize: 16 },
});
