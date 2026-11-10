import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { formatearEntradaMonto } from '@/features/gastos/validar-gasto';
import { PALETA } from '@/theme/tema';

type Props = {
  etiqueta: string;
  valor: string;
  onCambiar: (texto: string) => void;
  error?: string;
  // Contenido extra bajo el monto (descripción, quién → quién, etc.).
  children?: ReactNode;
};

// Tarjeta morada con el monto en grande: lo primero que se escribe.
export function TarjetaMonto({ etiqueta, valor, onCambiar, error, children }: Props) {
  return (
    <View style={styles.tarjeta}>
      <View style={[styles.burbuja, styles.burbujaGrande]} />
      <View style={[styles.burbuja, styles.burbujaChica]} />
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <View style={styles.fila}>
        <Text style={styles.signo}>$</Text>
        <TextInput
          style={styles.input}
          value={valor}
          onChangeText={(texto) => onCambiar(formatearEntradaMonto(texto))}
          placeholder="0"
          placeholderTextColor="rgba(255,255,255,0.45)"
          keyboardType="number-pad"
          selectionColor={PALETA.lila}
          accessibilityLabel={`${etiqueta}, en pesos`}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: PALETA.morado,
    borderRadius: 28,
    padding: 22,
    gap: 10,
    overflow: 'hidden',
  },
  burbuja: { position: 'absolute', borderRadius: 999, backgroundColor: PALETA.violeta },
  burbujaGrande: { width: 220, height: 220, top: -90, right: -70, opacity: 0.5 },
  burbujaChica: { width: 90, height: 90, bottom: -40, left: -20, opacity: 0.35 },
  etiqueta: { color: PALETA.lilaClaro, fontSize: 15, fontWeight: '700' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  signo: { color: PALETA.blanco, fontSize: 40, fontWeight: '800' },
  input: {
    flex: 1,
    color: PALETA.blanco,
    fontSize: 46,
    fontWeight: '800',
    paddingVertical: 0,
  },
  error: {
    alignSelf: 'flex-start',
    color: PALETA.blanco,
    backgroundColor: 'rgba(198,40,40,0.85)',
    fontSize: 13,
    fontWeight: '600',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
});
