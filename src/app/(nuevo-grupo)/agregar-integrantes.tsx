import { router, useTheme } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PantallaFormulario } from '@/components/pantalla-formulario';
import { useBorradorGrupo } from '@/features/grupos/borrador-grupo-context';
import { SelectorAvatar } from '@/features/grupos/components/selector-avatar';
import {
  hayErrores,
  validarIntegrantes,
  type ErroresIntegrantes,
} from '@/features/grupos/validar-integrantes';
import { LIMITES } from '@/features/grupos/validar-nuevo-grupo';
import { PALETA } from '@/theme/tema';

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
    <PantallaFormulario>
      <Text style={[styles.title, { color: colors.primary }]}>¿Quién vive contigo?</Text>
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
              placeholder={`Rumi ${i + 2}`}
              placeholderTextColor={PALETA.textoSuave}
              maxLength={LIMITES.nombreIntegrante}
              accessibilityLabel={`Nombre del rumi ${i + 2}`}
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
    </PantallaFormulario>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, opacity: 0.6, textAlign: 'center', marginBottom: 8 },
  fila: { gap: 6 },
  filaContenido: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontSize: 15, fontWeight: '600' },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 18 },
  error: { color: PALETA.error, fontSize: 14 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
