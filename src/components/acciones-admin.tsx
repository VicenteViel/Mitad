import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PALETA } from '@/theme/tema';

type Props = {
  // "gasto" o "pago": se usa en los textos de confirmación.
  que: string;
  onEditar: () => void;
  onEliminar: () => void;
  eliminando: boolean;
  error?: string | null;
};

// Editar / Eliminar para admins (decisión 14). Eliminar pide confirmación y es
// un borrado lógico: queda en el historial como "eliminado".
export function AccionesAdmin({ que, onEditar, onEliminar, eliminando, error }: Props) {
  function confirmar() {
    Alert.alert(
      `¿Eliminar este ${que}?`,
      `Quedará en el historial como eliminado y dejará de contar en los saldos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: onEliminar },
      ],
    );
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Solo admins</Text>
      <View style={styles.fila}>
        <Pressable
          onPress={onEditar}
          accessibilityRole="button"
          style={({ pressed }) => [styles.boton, styles.editar, pressed && styles.presionado]}
        >
          <Text style={styles.editarTexto}>Editar</Text>
        </Pressable>
        <Pressable
          onPress={confirmar}
          disabled={eliminando}
          accessibilityRole="button"
          style={({ pressed }) => [styles.boton, styles.eliminar, pressed && styles.presionado]}
        >
          {eliminando ? (
            <ActivityIndicator color={PALETA.blanco} />
          ) : (
            <Text style={styles.eliminarTexto}>Eliminar</Text>
          )}
        </Pressable>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: 8 },
  titulo: { fontSize: 13, fontWeight: '700', color: PALETA.textoSuave, textTransform: 'uppercase' },
  fila: { flexDirection: 'row', gap: 10 },
  boton: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  editar: { backgroundColor: PALETA.blanco, borderWidth: 1.5, borderColor: PALETA.violeta },
  editarTexto: { color: PALETA.morado, fontSize: 15, fontWeight: '700' },
  eliminar: { backgroundColor: PALETA.error },
  eliminarTexto: { color: PALETA.blanco, fontSize: 15, fontWeight: '700' },
  presionado: { opacity: 0.8 },
  error: { color: PALETA.error, fontSize: 14 },
});
