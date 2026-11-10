import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { COLORES, type Color } from '@/features/grupos/apariencia';
import { PALETA } from '@/theme/tema';

export type OpcionRumi = {
  id: string;
  nombre: string;
  color: Color;
  esYo?: boolean;
  pendiente?: boolean;
  deshabilitado?: boolean;
};

type CirculoProps = { nombre: string; color: Color; tamano?: number; pendiente?: boolean };

// Círculo con la inicial y el color del rumi (el mismo de la pantalla del grupo).
export function CirculoRumi({ nombre, color, tamano = 40, pendiente = false }: CirculoProps) {
  return (
    <View
      style={[
        styles.circulo,
        { width: tamano, height: tamano, borderRadius: tamano / 2, backgroundColor: COLORES[color] },
        pendiente && styles.pendiente,
      ]}
    >
      <Text style={[styles.inicial, { fontSize: tamano * 0.42 }]}>
        {nombre.trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

type Props = {
  rumis: OpcionRumi[];
  elegido: string | null;
  onElegir: (id: string) => void;
  // Para lectores de pantalla, ej. "Pagó".
  etiqueta: string;
};

// Fila deslizable de rumis para elegir uno (quién pagó, a quién).
export function SelectorRumi({ rumis, elegido, onElegir, etiqueta }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.fila}
    >
      {rumis.map((r) => {
        const activo = elegido === r.id;
        return (
          <Pressable
            key={r.id}
            onPress={() => onElegir(r.id)}
            disabled={r.deshabilitado}
            accessibilityRole="radio"
            accessibilityState={{ selected: activo, disabled: r.deshabilitado }}
            accessibilityLabel={`${etiqueta}: ${r.nombre}${r.esYo ? ', tú' : ''}${r.pendiente ? ', pendiente' : ''}`}
            style={[styles.opcion, activo && styles.opcionActiva, r.deshabilitado && styles.deshabilitado]}
          >
            <View>
              <CirculoRumi nombre={r.nombre} color={r.color} tamano={52} pendiente={r.pendiente} />
              {activo && (
                <View style={styles.marca}>
                  <Text style={styles.marcaTexto}>✓</Text>
                </View>
              )}
            </View>
            <Text style={[styles.nombre, activo && styles.nombreActivo]} numberOfLines={1}>
              {r.esYo ? 'Tú' : r.nombre}
            </Text>
            {r.pendiente && <Text style={styles.subtexto}>pendiente</Text>}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  circulo: { alignItems: 'center', justifyContent: 'center' },
  pendiente: { opacity: 0.55 },
  inicial: { color: PALETA.blanco, fontWeight: '800' },

  fila: { gap: 10, paddingVertical: 2 },
  opcion: {
    width: 84,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: PALETA.crema,
  },
  opcionActiva: { borderColor: PALETA.violeta, backgroundColor: PALETA.lilaClaro },
  deshabilitado: { opacity: 0.35 },
  marca: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PALETA.morado,
    borderWidth: 2,
    borderColor: PALETA.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaTexto: { color: PALETA.blanco, fontSize: 11, fontWeight: '800' },
  nombre: { fontSize: 14, fontWeight: '600', color: PALETA.moradoOscuro, maxWidth: 72 },
  nombreActivo: { color: PALETA.morado, fontWeight: '800' },
  subtexto: { fontSize: 11, color: PALETA.textoSuave, marginTop: -4 },
});
