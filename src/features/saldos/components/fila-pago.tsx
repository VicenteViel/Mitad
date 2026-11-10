import { Pressable, StyleSheet, Text, View } from 'react-native';

import { textoFecha } from '@/features/gastos/historial';
import { formatearPesos } from '@/features/gastos/validar-gasto';
import { PALETA } from '@/theme/tema';

import type { Pago } from '../api';

type Props = {
  pago: Pago;
  nombre: (integranteId: string) => string;
  hoy: string;
  onPress: () => void;
};

// Un pago en el historial: "Camila le pagó a Diego". Los borrados, tachados.
export function FilaPago({ pago, nombre, hoy, onPress }: Props) {
  const texto = `${nombre(pago.de)} le pagó a ${nombre(pago.a)}`;
  const fecha = textoFecha(pago.fecha, hoy);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fila, pago.eliminado && styles.eliminado, pressed && styles.presionada]}
      accessibilityRole="button"
      accessibilityLabel={`${texto}, ${formatearPesos(pago.monto)}, ${fecha}${pago.eliminado ? ', eliminado' : ''}`}
      accessibilityHint="Abre el detalle del pago"
    >
      <View style={styles.icono}>
        <Text style={styles.iconoTexto}>💸</Text>
      </View>
      <View style={styles.textos}>
        <Text style={[styles.titulo, pago.eliminado && styles.tachado]} numberOfLines={1}>
          {texto}
        </Text>
        <Text style={styles.detalle}>{pago.eliminado ? 'Eliminado' : `Pago · ${fecha}`}</Text>
      </View>
      <Text style={[styles.monto, pago.eliminado && styles.tachado]}>{formatearPesos(pago.monto)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  eliminado: { opacity: 0.5 },
  presionada: { backgroundColor: PALETA.lilaClaro, borderRadius: 12 },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E3F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoTexto: { fontSize: 22 },
  textos: { flex: 1, gap: 2 },
  titulo: { fontSize: 16, fontWeight: '700', color: PALETA.moradoOscuro },
  detalle: { fontSize: 13, color: PALETA.textoSuave },
  tachado: { textDecorationLine: 'line-through' },
  monto: { fontSize: 16, fontWeight: '800', color: '#1E8E5A' },
});
