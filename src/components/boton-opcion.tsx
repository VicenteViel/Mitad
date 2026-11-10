import { Pressable, StyleSheet, Text } from 'react-native';

import { PALETA } from '@/theme/tema';

type Props = {
  titulo: string;
  detalle?: string;
  onPress: () => void;
  // Relleno morado para la opción principal; lila claro para las demás.
  principal?: boolean;
};

// Botón grande con título y una línea de explicación, para elegir un camino.
export function BotonOpcion({ titulo, detalle, onPress, principal = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={detalle}
      style={({ pressed }) => [
        styles.boton,
        principal ? styles.principal : styles.secundario,
        pressed && styles.presionado,
      ]}
    >
      <Text style={[styles.titulo, principal && styles.textoPrincipal]}>{titulo}</Text>
      {detalle && (
        <Text style={[styles.detalle, principal && styles.textoPrincipal]}>{detalle}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 20, gap: 4 },
  principal: { backgroundColor: PALETA.morado },
  secundario: { backgroundColor: PALETA.lilaClaro },
  presionado: { opacity: 0.8 },
  titulo: { fontSize: 18, fontWeight: '700', color: PALETA.morado },
  detalle: { fontSize: 14, color: PALETA.textoSuave },
  textoPrincipal: { color: PALETA.blanco },
});
