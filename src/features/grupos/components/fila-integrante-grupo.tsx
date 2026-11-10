import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PALETA } from '@/theme/tema';

import { COLORES } from '../apariencia';
import type { IntegranteDetalle } from '../api';
import type { EtiquetasIntegrante } from '../resumen-integrantes';

type Props = {
  integrante: IntegranteDetalle;
  etiquetas: EtiquetasIntegrante;
  // Solo para admins y rumis pendientes: abre la invitación.
  onInvitar?: () => void;
};

// Un rumi en la pantalla del grupo: círculo con su inicial y color, nombre,
// apodo y etiquetas (tú, admin, pendiente). Los admins ven "Invitar" en los
// pendientes.
export function FilaIntegranteGrupo({ integrante, etiquetas, onInvitar }: Props) {
  const inicial = integrante.nombre.charAt(0).toUpperCase();
  const descripcion = [
    integrante.nombre,
    integrante.alias && `le dicen ${integrante.alias}`,
    etiquetas.esYo && 'tú',
    etiquetas.esAdmin && 'administrador',
    etiquetas.esPendiente && 'pendiente',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.fila}>
      <View style={styles.identidad} accessible accessibilityLabel={descripcion}>
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
          {integrante.alias && (
            <Text style={styles.subtexto} numberOfLines={1}>
              “{integrante.alias}”
            </Text>
          )}
          {etiquetas.esPendiente && (
            <Text style={styles.subtexto}>Aún no acepta su invitación</Text>
          )}
        </View>
      </View>

      {etiquetas.esAdmin && <Text style={[styles.chip, styles.chipAdmin]}>Admin</Text>}
      {etiquetas.esPendiente && onInvitar && (
        <Pressable
          onPress={onInvitar}
          accessibilityRole="button"
          accessibilityLabel={`Invitar a ${integrante.nombre}`}
          hitSlop={6}
          style={({ pressed }) => [styles.botonInvitar, pressed && styles.presionado]}
        >
          <Text style={styles.botonInvitarTexto}>Invitar</Text>
        </Pressable>
      )}
      {etiquetas.esPendiente && !onInvitar && (
        <Text style={[styles.chip, styles.chipPendiente]}>Pendiente</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  identidad: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  botonInvitar: {
    backgroundColor: PALETA.violeta,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  botonInvitarTexto: { color: PALETA.blanco, fontSize: 13, fontWeight: '700' },
  presionado: { opacity: 0.8 },
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
