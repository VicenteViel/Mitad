import { Pressable, StyleSheet, View } from 'react-native';

import { COLORES, type Color } from '../apariencia';

type Props = {
  value: Color;
  onChange: (color: Color) => void;
};

const NOMBRES: Record<Color, string> = { azul: 'Azul', rosado: 'Rosado' };

// Círculos de color; el elegido lleva un anillo alrededor.
export function SelectorColor({ value, onChange }: Props) {
  const colores = Object.keys(COLORES) as Color[];

  return (
    <View style={styles.contenedor} accessibilityRole="radiogroup">
      {colores.map((color) => {
        const seleccionado = color === value;
        return (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            hitSlop={6}
            accessibilityRole="radio"
            accessibilityState={{ checked: seleccionado }}
            accessibilityLabel={NOMBRES[color]}
            style={[styles.anillo, seleccionado && { borderColor: COLORES[color] }]}
          >
            <View style={[styles.circulo, { backgroundColor: COLORES[color] }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flexDirection: 'row', gap: 6 },
  anillo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circulo: { width: 22, height: 22, borderRadius: 11 },
});
