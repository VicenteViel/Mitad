import { Pressable, StyleSheet, View } from 'react-native';

import { COLORES, NOMBRES_COLOR, type Color } from '../apariencia';

type Props = {
  value: Color;
  onChange: (color: Color) => void;
  // Colores a mostrar; por defecto, todos.
  colores?: Color[];
};


const TODOS = Object.keys(COLORES) as Color[];

// Círculos de color; el elegido lleva un anillo alrededor.
export function SelectorColor({ value, onChange, colores = TODOS }: Props) {

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
            accessibilityLabel={NOMBRES_COLOR[color]}
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
  contenedor: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
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
