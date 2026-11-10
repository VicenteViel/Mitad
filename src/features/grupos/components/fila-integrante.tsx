import { useTheme } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PALETA } from '@/theme/tema';

import type { IntegranteBorrador } from '../borrador-grupo';
import { LIMITES } from '../validar-nuevo-grupo';
import { SelectorAvatar } from './selector-avatar';
import { SelectorColor } from './selector-color';

type Props = {
  integrante: IntegranteBorrador;
  etiqueta: string;
  error?: string;
  onChange: (cambios: Partial<IntegranteBorrador>) => void;
  onQuitar?: () => void;
};

// Fila editable del resumen: nombre, ícono y color de un integrante.
export function FilaIntegrante({ integrante, etiqueta, error, onChange, onQuitar }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.tarjeta}>
      <View style={styles.encabezado}>
        <Text style={[styles.etiqueta, { color: colors.text }]}>{etiqueta}</Text>
        {onQuitar && (
          <Pressable
            onPress={onQuitar}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Quitar a ${integrante.nombre || 'este integrante'}`}
          >
            <Text style={styles.quitar}>Quitar</Text>
          </Pressable>
        )}
      </View>

      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        value={integrante.nombre}
        onChangeText={(nombre) => onChange({ nombre })}
        placeholder="Nombre"
        placeholderTextColor={PALETA.textoSuave}
        maxLength={LIMITES.nombreIntegrante}
        accessibilityLabel={`Nombre, ${etiqueta}`}
      />
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.apariencia}>
        <SelectorAvatar compacto value={integrante.avatar} onChange={(avatar) => onChange({ avatar })} />
        <SelectorColor value={integrante.color} onChange={(color) => onChange({ color })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderRadius: 16, padding: 12, gap: 8, backgroundColor: PALETA.lilaClaro },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  etiqueta: { fontSize: 14, fontWeight: '600', opacity: 0.7 },
  quitar: { color: PALETA.error, fontSize: 15 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 17, backgroundColor: PALETA.blanco },
  error: { color: PALETA.error, fontSize: 14 },
  apariencia: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
