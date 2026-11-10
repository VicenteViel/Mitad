import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { estilosAjustes as e } from '@/features/grupos/components/ajustes-estilos';
import { PALETA } from '@/theme/tema';

import { fechaLarga, leerFecha, vencimientoDelMes } from '../fechas';
import { iconoCategoria } from '../historial';
import { useDetenerGastoMensual, useGastosMensuales } from '../use-registrar-gasto';
import { formatearPesos } from '../validar-gasto';

type Props = { grupoId: string; soyAdmin: boolean; hoy: string };

// Gastos que se crean solos cada mes (decisión 50). Todos los ven; solo los
// admins los detienen. Para cambiar el monto: detener y crear uno nuevo.
export function AjustesGastosMensuales({ grupoId, soyAdmin, hoy }: Props) {
  const { data: mensuales } = useGastosMensuales(grupoId);
  const detener = useDetenerGastoMensual(grupoId);

  if (!mensuales || mensuales.length === 0) return null;

  function confirmarDetener(id: string, descripcion: string) {
    Alert.alert(
      `¿Detener "${descripcion}"?`,
      'Dejará de crearse cada mes. Los gastos que ya se crearon se mantienen.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Detener', style: 'destructive', onPress: () => detener.mutate(id) },
      ],
    );
  }

  return (
    <View style={e.seccion}>
      <Text style={e.titulo}>Gastos mensuales</Text>
      <Text style={e.ayuda}>Se crean solos al empezar cada mes, con su fecha límite.</Text>
      {mensuales.map((m) => {
        const { anio, mes } = leerFecha(m.proximoMes);
        const proximo = vencimientoDelMes(anio, mes, m.diaVencimiento);
        return (
          <View key={m.id} style={styles.fila}>
            <Text style={styles.icono}>{iconoCategoria(m.categoria)}</Text>
            <View style={styles.textos}>
              <Text style={styles.nombre} numberOfLines={1}>
                {m.descripcion} · {formatearPesos(m.monto)}
              </Text>
              <Text style={styles.detalle}>
                Vence el día {m.diaVencimiento}
                {m.porCubrir ? ' · por cubrir' : ''} · próximo: {fechaLarga(proximo, hoy)}
              </Text>
            </View>
            {soyAdmin && (
              <Pressable
                onPress={() => confirmarDetener(m.id, m.descripcion)}
                disabled={detener.isPending}
                accessibilityRole="button"
                accessibilityLabel={`Detener ${m.descripcion}`}
                hitSlop={8}
              >
                <Text style={styles.detener}>Detener</Text>
              </Pressable>
            )}
          </View>
        );
      })}
      {detener.isError && <Text style={e.error}>{detener.error.message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: PALETA.crema,
    borderRadius: 14,
    padding: 12,
  },
  icono: { fontSize: 22 },
  textos: { flex: 1, gap: 2 },
  nombre: { fontSize: 15, fontWeight: '700', color: PALETA.moradoOscuro },
  detalle: { fontSize: 12, color: PALETA.textoSuave },
  detener: { fontSize: 14, fontWeight: '700', color: PALETA.error },
});
