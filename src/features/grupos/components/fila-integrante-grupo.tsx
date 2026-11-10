import { StyleSheet, Text, View } from 'react-native';

import { PALETA } from '@/theme/tema';

import { COLORES } from '../apariencia';
import type { IntegranteDetalle } from '../api';
import type { EtiquetasIntegrante } from '../resumen-integrantes';

type Props = {
  integrante: IntegranteDetalle;
  etiquetas: EtiquetasIntegrante;
};

// Un integrante en la pantalla del grupo: círculo con su inicial y color,
// nombre y etiquetas (tú, admin, pendiente).
export function FilaIntegranteGrupo({ integrante, etiquetas }: Props) {
  const inicial = integrante.nombre.charAt(0).toUpperCase();
  const descripcion = [
    integrante.nombre,
    etiquetas.esYo && 'tú',
    etiquetas.esAdmin && 'administrador',
    etiquetas.esPendiente && 'pendiente',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.fila} accessible accessibilityLabel={descripcion}>
      <View
        style={[
          styles.circulo,
          { backgroundColor: COLORES[integrante.color] },
          etiquetas.esPendiente && styles.circuloPendiente,
        ]}
      >
        <Text style={styles.inicial}>{inicial}</Text>
      </View>

      <View style={styles.textos}>
        <Text style={styles.nombre} numberOfLines={1}>
          {integrante.nombre}
          {etiquetas.esYo && <Text style={styles.tu}> (tú)</Text>}
        </Text>
        {etiquetas.esPendiente && (
          <Text style={styles.subtexto}>Aún no acepta su invitación</Text>
        )}
      </View>

      {etiquetas.esAdmin && <Text style={[styles.chip, styles.chipAdmin]}>Admin</Text>}
      {etiquetas.esPendiente && <Text style={[styles.chip, styles.chipPendiente]}>Pendiente</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  circulo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloPendiente: { opacity: 0.55 },
  inicial: { color: PALETA.blanco, fontSize: 18, fontWeight: '800' },
  textos: { flex: 1, gap: 2 },
  nombre: { fontSize: 16, fontWeight: '700', color: PALETA.moradoOscuro },
  tu: { fontWeight: '500', color: PALETA.textoSuave },
  subtexto: { fontSize: 13, color: PALETA.textoSuave },
  chip: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  chipAdmin: { backgroundColor: PALETA.morado, color: PALETA.blanco },
  chipPendiente: { backgroundColor: PALETA.lilaClaro, color: PALETA.morado },
});
