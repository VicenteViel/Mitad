import { router, useLocalSearchParams, useTheme } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MAX_INTEGRANTES_POR_VEZ } from '@/features/grupos/validar-integrantes';

// El total de la casa te incluye a ti; el resto se agrega como pendientes.
const MIN_TOTAL = 1;
const MAX_TOTAL = MAX_INTEGRANTES_POR_VEZ + 1;

export default function CantidadIntegrantesScreen() {
  const { colors } = useTheme();
  const { grupoId } = useLocalSearchParams<{ grupoId: string }>();
  const [total, setTotal] = useState(2);

  function continuar() {
    if (!grupoId || total === 1) {
      router.replace('/');
      return;
    }
    router.push({
      pathname: '/agregar-integrantes',
      params: { grupoId, cantidad: String(total - 1) },
    });
  }

  const puedeRestar = total > MIN_TOTAL;
  const puedeSumar = total < MAX_TOTAL;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>¿Cuántos integrantes son?</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>Contándote a ti</Text>

      <View style={styles.contador}>
        <Pressable
          onPress={() => setTotal((t) => t - 1)}
          disabled={!puedeRestar}
          style={[styles.boton, { borderColor: colors.border, opacity: puedeRestar ? 1 : 0.3 }]}
          accessibilityRole="button"
          accessibilityLabel="Uno menos"
        >
          <Text style={[styles.botonTexto, { color: colors.text }]}>−</Text>
        </Pressable>

        <Text
          style={[styles.numero, { color: colors.text }]}
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${total} integrantes`}
        >
          {total}
        </Text>

        <Pressable
          onPress={() => setTotal((t) => t + 1)}
          disabled={!puedeSumar}
          style={[styles.boton, { borderColor: colors.border, opacity: puedeSumar ? 1 : 0.3 }]}
          accessibilityRole="button"
          accessibilityLabel="Uno más"
        >
          <Text style={[styles.botonTexto, { color: colors.text }]}>+</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.continuar, { backgroundColor: colors.primary }]}
        onPress={continuar}
        accessibilityRole="button"
      >
        <Text style={styles.continuarTexto}>Continuar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, opacity: 0.6, textAlign: 'center' },
  contador: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginVertical: 40,
  },
  boton: {
    width: 64,
    height: 64,
    borderWidth: 1.5,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonTexto: { fontSize: 32, fontWeight: '500' },
  numero: { fontSize: 56, fontWeight: '700', minWidth: 72, textAlign: 'center' },
  continuar: { borderRadius: 12, padding: 16, alignItems: 'center' },
  continuarTexto: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
