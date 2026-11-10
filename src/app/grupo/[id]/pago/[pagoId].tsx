import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSesion } from '@/features/auth/use-sesion';
import { hoyLocal } from '@/features/gastos/api';
import { SeccionEvidencia } from '@/features/gastos/components/seccion-evidencia';
import { textoFecha } from '@/features/gastos/historial';
import { formatearPesos } from '@/features/gastos/validar-gasto';
import { usePagos, useRumisSaldo } from '@/features/saldos/use-saldos';
import { PALETA } from '@/theme/tema';

// Detalle de un pago entre dos rumis, con la evidencia (captura de la
// transferencia).
export default function DetallePagoScreen() {
  const { id, pagoId } = useLocalSearchParams<{ id: string; pagoId: string }>();
  const grupoId = id ?? '';
  const insets = useSafeAreaInsets();
  const { sesion } = useSesion();
  const pagos = usePagos(grupoId);
  const rumis = useRumisSaldo(grupoId);

  const pago = pagos.data?.find((p) => p.id === pagoId);
  const porId = new Map((rumis.data ?? []).map((r) => [r.id, r]));
  const yo = rumis.data?.find((r) => r.usuarioId === sesion?.user.id);
  const nombre = (integranteId: string) =>
    integranteId === yo?.id ? 'Tú' : (porId.get(integranteId)?.nombre ?? 'Ex-rumi');
  const hoy = hoyLocal();

  return (
    <ScrollView
      style={styles.fondo}
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + 8 }]}
    >
      <StatusBar style="dark" />
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Volver al grupo"
        hitSlop={10}
        style={styles.volver}
      >
        <Text style={styles.volverTexto}>‹ Grupo</Text>
      </Pressable>

      {(pagos.isPending || rumis.isPending) && <ActivityIndicator color={PALETA.morado} />}
      {pagos.data && !pago && <Text style={styles.error}>No encontramos este pago.</Text>}

      {pago && (
        <>
          <View style={styles.hero}>
            <Text style={styles.heroIcono}>💸</Text>
            <Text style={[styles.heroTexto, pago.eliminado && styles.tachado]} accessibilityRole="header">
              {nombre(pago.de)} le pagó a {nombre(pago.a)}
            </Text>
            <Text style={[styles.heroMonto, pago.eliminado && styles.tachado]}>
              {formatearPesos(pago.monto)}
            </Text>
            <Text style={styles.heroDetalle}>{textoFecha(pago.fecha, hoy)}</Text>
            {pago.eliminado && <Text style={styles.eliminado}>Este pago fue eliminado</Text>}
          </View>

          <Text style={styles.registro}>
            Registrado por {nombre(pago.declaradaPor)} · {textoFecha(pago.creadoEn.slice(0, 10), hoy)}
          </Text>

          <SeccionEvidencia
            grupoId={grupoId}
            origen={{ tipo: 'pago', id: pago.id }}
            miIntegranteId={yo?.id}
            soyAdmin={yo?.rol === 'admin'}
            hoy={hoy}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: PALETA.crema },
  contenido: { paddingHorizontal: 20, paddingBottom: 48, gap: 14 },
  volver: { alignSelf: 'flex-start', paddingVertical: 6 },
  volverTexto: { color: PALETA.morado, fontSize: 17, fontWeight: '600' },
  error: { color: PALETA.error, fontSize: 15 },
  tachado: { textDecorationLine: 'line-through' },
  hero: {
    backgroundColor: '#1E8E5A',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  heroIcono: { fontSize: 40 },
  heroTexto: { color: PALETA.blanco, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  heroMonto: { color: PALETA.blanco, fontSize: 38, fontWeight: '800' },
  heroDetalle: { color: '#D8F3E4', fontSize: 14 },
  eliminado: {
    color: PALETA.blanco,
    backgroundColor: PALETA.error,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 4,
  },
  registro: { fontSize: 13, color: PALETA.textoSuave, textAlign: 'center' },
});
