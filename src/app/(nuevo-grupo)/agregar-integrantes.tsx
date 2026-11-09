import { router, useTheme } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useBorradorGrupo } from '@/features/grupos/borrador-grupo-context';
import { SelectorAvatar } from '@/features/grupos/components/selector-avatar';
import {
  hayErrores,
  validarIntegrantes,
  type ErroresIntegrantes,
} from '@/features/grupos/validar-integrantes';
import { LIMITES } from '@/features/grupos/validar-nuevo-grupo';

export default function AgregarIntegrantesScreen() {
  const { colors } = useTheme();
  const { borrador, actualizarIntegrante } = useBorradorGrupo();
  const [errores, setErrores] = useState<ErroresIntegrantes>({ porFila: {} });

  function continuar() {
    const nuevosErrores = validarIntegrantes(borrador.integrantes);
    setErrores(nuevosErrores);
    if (hayErrores(nuevosErrores)) return;

    router.push('/resumen-grupo');
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

      {borrador.integrantes.map((integrante, i) => (
        <View key={i} style={styles.fila}>
          <Text style={[styles.label, { color: colors.text }]}>Nombre</Text>
          <View style={styles.filaContenido}>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={integrante.nombre}
              onChangeText={(nombre) => actualizarIntegrante(i, { nombre })}
              placeholder={`Integrante ${i + 2}`}
              placeholderTextColor="#888"
              maxLength={LIMITES.nombreIntegrante}
              accessibilityLabel={`Nombre del integrante ${i + 2}`}
            />
            <SelectorAvatar
              compacto
              value={integrante.avatar}
              onChange={(avatar) => actualizarIntegrante(i, { avatar })}
            />
          </View>
          {errores.porFila[i] && <Text style={styles.error}>{errores.porFila[i]}</Text>}
        </View>
      ))}

      {errores.general && <Text style={styles.error}>{errores.general}</Text>}

      <Pressable
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={continuar}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Continuar</Text>
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
});
