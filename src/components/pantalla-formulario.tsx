import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PALETA } from '@/theme/tema';

type Props = {
  children: ReactNode;
};

// Pantalla de formulario: fondo morado suave y todo el contenido dentro de una
// tarjeta blanca. Hace scroll y deja espacio al teclado en formularios largos.
export function PantallaFormulario({ children }: Props) {
  return (
    <ScrollView
      style={styles.fondo}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View style={styles.tarjeta}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: PALETA.lila },
  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 64,
    paddingBottom: 40,
  },
  tarjeta: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: PALETA.blanco,
    borderRadius: 24,
    padding: 24,
    gap: 10,
    shadowColor: PALETA.moradoOscuro,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
