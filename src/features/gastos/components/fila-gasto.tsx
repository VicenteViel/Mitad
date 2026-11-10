import { StyleSheet, Text, View } from 'react-native';

import { PALETA } from '@/theme/tema';

import {
  etiquetaCategoria,
  iconoCategoria,
  miParte,
  textoFecha,
  type GastoHistorial,
} from '../historial';
import { formatearPesos } from '../validar-gasto';

type Props = {
  gasto: GastoHistorial;
  miIntegranteId: string | undefined;
  hoy: string;
};

// Un gasto en el historial: categoría, descripción, quién pagó, cuándo, el
// total y cuánto me toca. Los borrados se muestran tachados (regla 33).
export function FilaGasto({ gasto, miIntegranteId, hoy }: Props) {
  const parte = miParte(gasto, miIntegranteId);
  const paguéYo = gasto.pagadoPorId === miIntegranteId;
  const quienPago = paguéYo ? 'Pagaste tú' : `Pagó ${gasto.pagadoPorNombre}`;
  const fecha = textoFecha(gasto.fecha, hoy);

  const descripcionAccesible = [
    gasto.descripcion,
    etiquetaCategoria(gasto.categoria),
    formatearPesos(gasto.monto),
    quienPago,
    fecha,
    parte !== null && `tu parte ${formatearPesos(parte)}`,
    gasto.eliminado && 'eliminado',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View
      style={[styles.fila, gasto.eliminado && styles.eliminado]}
      accessible
      accessibilityLabel={descripcionAccesible}
    >
      <View style={styles.icono}>
        <Text style={styles.iconoTexto}>{iconoCategoria(gasto.categoria)}</Text>
      </View>

      <View style={styles.textos}>
        <Text
          style={[styles.descripcion, gasto.eliminado && styles.tachado]}
          numberOfLines={1}
        >
          {gasto.descripcion}
        </Text>
        <Text style={styles.detalle} numberOfLines={1}>
          {gasto.eliminado ? 'Eliminado' : `${quienPago} · ${fecha}`}
        </Text>
      </View>

      <View style={styles.montos}>
        <Text style={[styles.total, gasto.eliminado && styles.tachado]}>
          {formatearPesos(gasto.monto)}
        </Text>
        {!gasto.eliminado && parte !== null && (
          <Text style={styles.parte}>Tu parte {formatearPesos(parte)}</Text>
        )}
        {!gasto.eliminado && parte === null && <Text style={styles.noParticipas}>No participas</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  eliminado: { opacity: 0.5 },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: PALETA.lilaClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoTexto: { fontSize: 22 },
  textos: { flex: 1, gap: 2 },
  descripcion: { fontSize: 16, fontWeight: '700', color: PALETA.moradoOscuro },
  detalle: { fontSize: 13, color: PALETA.textoSuave },
  tachado: { textDecorationLine: 'line-through' },
  montos: { alignItems: 'flex-end', gap: 2 },
  total: { fontSize: 16, fontWeight: '800', color: PALETA.moradoOscuro },
  parte: { fontSize: 12, fontWeight: '700', color: PALETA.violeta },
  noParticipas: { fontSize: 12, color: PALETA.textoSuave },
});
