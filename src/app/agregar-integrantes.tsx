import { router, useLocalSearchParams, useTheme } from 'expo-router';
import { useRef, useState } from 'react';
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

type Fila = { id: number; nombre: string; avatar: Avatar };

export default function AgregarIntegrantesScreen() {
  const { colors } = useTheme();
  const { grupoId } = useLocalSearchParams<{ grupoId: string }>();
  const siguienteId = useRef(1);
  const [filas, setFilas] = useState<Fila[]>([{ id: 0, nombre: '', avatar: 'hombre' }]);
  const [errores, setErrores] = useState<ErroresIntegrantes>({ porFila: {} });
  const { mutate, isPending, error } = useAgregarIntegrantes();

  function agregarFila() {
    const id = siguienteId.current++;
    setFilas((actuales) => [...actuales, { id, nombre: '', avatar: 'hombre' }]);
  }

  function actualizarFila(id: number, cambios: Partial<Fila>) {
    setFilas((actuales) => actuales.map((f) => (f.id === id ? { ...f, ...cambios } : f)));
  }

  function quitarFila(id: number) {
    setFilas((actuales) => actuales.filter((f) => f.id !== id));
  }

  function guardar() {
    if (!grupoId) return;
    const integrantes = filas.map(({ nombre, avatar }) => ({ nombre, avatar }));
    const nuevosErrores = validarIntegrantes(integrantes);
    setErrores(nuevosErrores);
    if (hayErrores(nuevosErrores)) return;

    mutate({ grupoId, integrantes }, { onSuccess: () => router.replace('/') });
  }

  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border }];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={[styles.title, { color: colors.text }]}>¿Quién vive contigo?</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Agrega a las personas de tu casa. Quedarán pendientes hasta que acepten su invitación.
      </Text>

      {filas.map((fila, i) => (
        <View key={fila.id} style={[styles.fila, { borderColor: colors.border }]}>
          <View style={styles.filaEncabezado}>
            <Text style={[styles.label, { color: colors.text }]}>Integrante {i + 1}</Text>
            {filas.length > 1 && (
              <Pressable
                onPress={() => quitarFila(fila.id)}
                accessibilityRole="button"
                accessibilityLabel={`Quitar integrante ${i + 1}`}
              >
                <Text style={styles.quitar}>Quitar</Text>
              </Pressable>
            )}
          </View>
          <TextInput
            style={inputStyle}
            value={fila.nombre}
            onChangeText={(nombre) => actualizarFila(fila.id, { nombre })}
            placeholder="Nombre"
            placeholderTextColor="#888"
            maxLength={LIMITES.nombreIntegrante}
            accessibilityLabel={`Nombre del integrante ${i + 1}`}
          />
          {errores.porFila[i] && <Text style={styles.error}>{errores.porFila[i]}</Text>}
          <SelectorAvatar
            value={fila.avatar}
            onChange={(avatar) => actualizarFila(fila.id, { avatar })}
          />
        </View>
      ))}

      {filas.length < MAX_INTEGRANTES_POR_VEZ && (
        <Pressable onPress={agregarFila} accessibilityRole="button" style={styles.agregar}>
          <Text style={[styles.link, { color: colors.primary }]}>+ Agregar integrante</Text>
        </Pressable>
      )}

      {errores.general && <Text style={styles.error}>{errores.general}</Text>}
      {error && <Text style={styles.error}>No pudimos agregar a los integrantes. Intenta de nuevo.</Text>}

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
  container: { padding: 24, paddingTop: 72, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, opacity: 0.7, textAlign: 'center', marginBottom: 8 },
  fila: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 8 },
  filaEncabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '600' },
  quitar: { color: '#D93025', fontSize: 15 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 18 },
  error: { color: '#D93025', fontSize: 14 },
  agregar: { paddingVertical: 8 },
  link: { textAlign: 'center', fontSize: 16 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
