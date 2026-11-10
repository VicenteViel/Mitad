import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PALETA } from '@/theme/tema';

type SegmentoProps<T extends string> = {
  valor: T;
  onCambiar: (valor: T) => void;
  opciones: { valor: T; texto: string }[];
};

// Control segmentado: una opción de varias, como pestañas.
export function Segmento<T extends string>({ valor, onCambiar, opciones }: SegmentoProps<T>) {
  return (
    <View style={styles.segmento} accessibilityRole="radiogroup">
      {opciones.map((o) => {
        const activo = valor === o.valor;
        return (
          <Pressable
            key={o.valor}
            onPress={() => onCambiar(o.valor)}
            accessibilityRole="radio"
            accessibilityState={{ selected: activo }}
            style={[styles.segmentoOpcion, activo && styles.segmentoActivo]}
          >
            <Text
              style={[styles.segmentoTexto, activo && styles.segmentoTextoActivo]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {o.texto}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segmento: {
    flexDirection: 'row',
    backgroundColor: PALETA.crema,
    borderRadius: 14,
    padding: 4,
  },
  segmentoOpcion: { flex: 1, borderRadius: 11, paddingVertical: 10, alignItems: 'center' },
  segmentoActivo: {
    backgroundColor: PALETA.blanco,
    shadowColor: PALETA.moradoOscuro,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentoTexto: { fontSize: 14, fontWeight: '600', color: PALETA.textoSuave },
  segmentoTextoActivo: { color: PALETA.morado, fontWeight: '800' },
});
