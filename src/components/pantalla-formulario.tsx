import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import { PALETA } from '@/theme/tema';

type Props = {
  children: ReactNode;
  // Muestra el logo de Rumi sobre la tarjeta (ingreso e invitaciones).
  logo?: boolean;
};

const LOGO = require('../../assets/images/logo.png');

// Pantalla de formulario: fondo morado profundo y todo el contenido dentro de
// una tarjeta blanca. Hace scroll y deja espacio al teclado en formularios largos.
export function PantallaFormulario({ children, logo = false }: Props) {
  return (
    <ScrollView
      style={styles.fondo}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      {/* Texto de la barra de estado en blanco sobre el fondo oscuro. */}
      <StatusBar style="light" />
      {logo && (
        <Image
          source={LOGO}
          style={styles.logo}
          accessibilityRole="image"
          accessibilityLabel="Logo de Rumi"
        />
      )}
      <View style={styles.tarjeta}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: PALETA.moradoProfundo },
  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 64,
    paddingBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 12,
  },
  tarjeta: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: PALETA.blanco,
    borderRadius: 24,
    padding: 24,
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
