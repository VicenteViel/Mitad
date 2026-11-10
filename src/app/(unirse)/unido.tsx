import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PantallaFormulario } from '@/components/pantalla-formulario';
import { useInvitacion } from '@/features/invitaciones/invitacion-context';
import { PALETA } from '@/theme/tema';

// Confirmación al aceptar un link: tick animado y el grupo al que se entró.
export default function UnidoScreen() {
  const { grupo } = useInvitacion();
  const escala = useSharedValue(0);
  const opacidad = useSharedValue(0);

  useEffect(() => {
    escala.set(withSpring(1, { damping: 9, stiffness: 140 }));
    opacidad.set(withDelay(250, withTiming(1, { duration: 300 })));
  }, [escala, opacidad]);

  const estiloTick = useAnimatedStyle(() => ({ transform: [{ scale: escala.get() }] }));
  const estiloContenido = useAnimatedStyle(() => ({ opacity: opacidad.get() }));

  return (
    <PantallaFormulario>
      <Animated.View style={[styles.tick, estiloTick]} accessibilityElementsHidden>
        <Text style={styles.tickTexto}>✓</Text>
      </Animated.View>

      <Animated.View style={[styles.contenido, estiloContenido]}>
        <Text style={styles.titulo} accessibilityRole="header">
          ¡Te has unido a un grupo!
        </Text>

        <View style={styles.grupo}>
          <Text style={styles.grupoNombre}>{grupo.nombre}</Text>
          {grupo.descripcion && <Text style={styles.grupoDescripcion}>{grupo.descripcion}</Text>}
        </View>

        <Pressable
          onPress={() => router.push('/tus-datos')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
        >
          <Text style={styles.botonTexto}>Siguiente</Text>
        </Pressable>
      </Animated.View>
    </PantallaFormulario>
  );
}

const styles = StyleSheet.create({
  tick: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: PALETA.morado,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: PALETA.morado,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  tickTexto: { color: PALETA.blanco, fontSize: 52, fontWeight: '800', marginTop: -4 },
  contenido: { gap: 14 },
  titulo: { fontSize: 26, fontWeight: '800', color: PALETA.moradoOscuro, textAlign: 'center' },
  grupo: {
    backgroundColor: PALETA.lilaClaro,
    borderRadius: 18,
    padding: 18,
    gap: 4,
    alignItems: 'center',
  },
  grupoNombre: { fontSize: 20, fontWeight: '800', color: PALETA.morado, textAlign: 'center' },
  grupoDescripcion: { fontSize: 15, color: PALETA.textoSuave, textAlign: 'center' },
  boton: {
    backgroundColor: PALETA.morado,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  botonTexto: { color: PALETA.blanco, fontSize: 16, fontWeight: '700' },
  presionado: { opacity: 0.85 },
});
