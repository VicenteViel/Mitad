import { Pressable, StyleSheet, Text } from 'react-native';

import { PALETA } from '@/theme/tema';

type Props = {
  texto: string;
  activo: boolean;
  onPress: () => void;
  deshabilitado?: boolean;
};

// Opción tipo "píldora" para elegir una entre varias (categoría, quién pagó…).
export function Chip({ texto, activo, onPress, deshabilitado = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="radio"
      accessibilityState={{ selected: activo, disabled: deshabilitado }}
      style={[styles.chip, activo && styles.chipActivo, deshabilitado && styles.chipDeshabilitado]}
    >
      <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETA.borde,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipActivo: { backgroundColor: PALETA.morado, borderColor: PALETA.morado },
  chipDeshabilitado: { opacity: 0.4 },
  chipTexto: { fontSize: 15, color: PALETA.moradoOscuro },
  chipTextoActivo: { color: PALETA.blanco, fontWeight: '600' },
});
