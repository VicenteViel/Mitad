import { router, useTheme } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PantallaFormulario } from '@/components/pantalla-formulario';
import { useBorradorGrupo } from '@/features/grupos/borrador-grupo-context';
import { MAX_INTEGRANTES_POR_VEZ } from '@/features/grupos/validar-integrantes';
import { PALETA } from '@/theme/tema';

// El total de la casa te incluye a ti; el resto se agrega como pendientes.
const MIN_TOTAL = 1;
const MAX_TOTAL = MAX_INTEGRANTES_POR_VEZ + 1;

export default function CantidadIntegrantesScreen() {
  const { colors } = useTheme();
  const { borrador, definirCantidad } = useBorradorGrupo();
  // Si se vuelve a esta pantalla, parte desde lo que ya se había elegido.
  const [total, setTotal] = useState(() =>
    borrador.integrantes.length > 0 ? borrador.integrantes.length + 1 : 2,
  );

  function continuar() {
    definirCantidad(total - 1);
    router.push(total === 1 ? '/resumen-grupo' : '/agregar-integrantes');
  }

  const puedeRestar = total > MIN_TOTAL;
  const puedeSumar = total < MAX_TOTAL;

  return (
    <PantallaFormulario>
      <Text style={[styles.title, { color: colors.primary }]}>¿Cuántos rumis son?</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>Contándote a ti</Text>

      <View style={styles.contador}>
        <Pressable
          onPress={() => setTotal((t) => t - 1)}
          disabled={!puedeRestar}
          style={[styles.boton, { backgroundColor: PALETA.lilaClaro, opacity: puedeRestar ? 1 : 0.3 }]}
          accessibilityRole="button"
          accessibilityLabel="Uno menos"
        >
          <Text style={[styles.botonTexto, { color: colors.primary }]}>−</Text>
        </Pressable>

        <Text
          style={[styles.numero, { color: colors.text }]}
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${total} rumis`}
        >
          {total}
        </Text>

        <Pressable
          onPress={() => setTotal((t) => t + 1)}
          disabled={!puedeSumar}
          style={[styles.boton, { backgroundColor: PALETA.lilaClaro, opacity: puedeSumar ? 1 : 0.3 }]}
          accessibilityRole="button"
          accessibilityLabel="Uno más"
        >
          <Text style={[styles.botonTexto, { color: colors.primary }]}>+</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.continuar, { backgroundColor: colors.primary }]}
        onPress={continuar}
        accessibilityRole="button"
      >
        <Text style={styles.continuarTexto}>Continuar</Text>
      </Pressable>
    </PantallaFormulario>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonTexto: { fontSize: 32, fontWeight: '500' },
  numero: { fontSize: 56, fontWeight: '700', minWidth: 72, textAlign: 'center' },
  continuar: { borderRadius: 12, padding: 16, alignItems: 'center' },
  continuarTexto: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
