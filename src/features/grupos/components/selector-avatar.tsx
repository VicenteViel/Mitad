import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { COLORES, colorPorDefecto, type Avatar } from '../apariencia';

const GRIS = '#9AA0A6';
const BLANCO = '#FFFFFF';
const TRANSPARENTE = 'rgba(0, 0, 0, 0)';

type Props = {
  value: Avatar;
  onChange: (avatar: Avatar) => void;
  // Versión pequeña para ponerla al lado de un campo de texto.
  compacto?: boolean;
};

// Dos figuras en un mismo contenedor. La elegida se pinta de azul (hombre)
// o rosado (mujer) con una pequeña animación de rebote.
export function SelectorAvatar({ value, onChange, compacto = false }: Props) {
  return (
    <View
      style={[styles.contenedor, compacto && styles.contenedorCompacto]}
      accessibilityRole="radiogroup"
    >
      <Opcion
        avatar="hombre"
        seleccionado={value === 'hombre'}
        onPress={() => onChange('hombre')}
        compacto={compacto}
      />
      <Opcion
        avatar="mujer"
        seleccionado={value === 'mujer'}
        onPress={() => onChange('mujer')}
        compacto={compacto}
      />
    </View>
  );
}

type OpcionProps = {
  avatar: Avatar;
  seleccionado: boolean;
  onPress: () => void;
  compacto: boolean;
};

function Opcion({ avatar, seleccionado, onPress, compacto }: OpcionProps) {
  const progreso = useSharedValue(seleccionado ? 1 : 0);
  const escala = useSharedValue(1);
  const colorActivo = COLORES[colorPorDefecto(avatar)];

  useEffect(() => {
    progreso.set(withTiming(seleccionado ? 1 : 0, { duration: 200 }));
    if (seleccionado) {
      escala.set(withSequence(withTiming(1.12, { duration: 120 }), withSpring(1)));
    }
  }, [seleccionado, progreso, escala]);

  const estiloCelda = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progreso.get(), [0, 1], [TRANSPARENTE, colorActivo]),
  }));

  const estiloFigura = useAnimatedStyle(() => ({
    transform: [{ scale: escala.get() }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={compacto ? undefined : styles.pressable}
      hitSlop={compacto ? 6 : undefined}
      accessibilityRole="radio"
      accessibilityState={{ checked: seleccionado }}
      accessibilityLabel={avatar === 'hombre' ? 'Hombre' : 'Mujer'}
    >
      <Animated.View style={[styles.celda, compacto && styles.celdaCompacta, estiloCelda]}>
        <Animated.View style={estiloFigura}>
          <View style={compacto && styles.figuraCompacta}>
            <Figura avatar={avatar} color={seleccionado ? BLANCO : GRIS} />
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// Figura de cabeza y hombros dibujada con bordes, como en el boceto.
function Figura({ avatar, color }: { avatar: Avatar; color: string }) {
  const esMujer = avatar === 'mujer';
  const linea = { borderColor: color };

  return (
    <View style={styles.figura}>
      {esMujer && <View style={[styles.pelo, linea]} />}
      <View style={[styles.cabeza, linea]} />
      <View style={[esMujer ? styles.cuerpoMujer : styles.cuerpoHombre, linea]} />
    </View>
  );
}

const ANCHO_FIGURA = 44;
const GROSOR = 2.5;

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: GRIS,
    borderRadius: 16,
    padding: 6,
    gap: 6,
  },
  contenedorCompacto: { borderRadius: 12, padding: 4, gap: 4 },
  pressable: { flex: 1 },
  celda: {
    height: 72,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celdaCompacta: { width: 44, height: 44, borderRadius: 9 },
  figuraCompacta: { transform: [{ scale: 0.65 }] },
  figura: { width: ANCHO_FIGURA, height: 48 },
  cabeza: {
    position: 'absolute',
    top: 4,
    left: (ANCHO_FIGURA - 16) / 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: GROSOR,
  },
  pelo: {
    position: 'absolute',
    top: 1,
    left: (ANCHO_FIGURA - 24) / 2,
    width: 24,
    height: 26,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: GROSOR,
    borderBottomWidth: 0,
  },
  cuerpoHombre: {
    position: 'absolute',
    bottom: 0,
    left: (ANCHO_FIGURA - 32) / 2,
    width: 32,
    height: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: GROSOR,
    borderBottomWidth: 0,
  },
  cuerpoMujer: {
    position: 'absolute',
    bottom: 0,
    left: (ANCHO_FIGURA - 26) / 2,
    width: 26,
    height: 20,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    borderWidth: GROSOR,
    borderBottomWidth: 0,
  },
});
