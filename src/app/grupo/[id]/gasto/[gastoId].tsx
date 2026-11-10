import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSesion } from '@/features/auth/use-sesion';
import { hoyLocal } from '@/features/gastos/api';
import { SeccionEvidencia } from '@/features/gastos/components/seccion-evidencia';
import { fechaLarga } from '@/features/gastos/fechas';
import { etiquetaCategoria, iconoCategoria, textoFecha } from '@/features/gastos/historial';
import { useMarcarPartePagada } from '@/features/gastos/use-registrar-gasto';
import { AccionesAdmin } from '@/components/acciones-admin';
import {
  useDetalleGasto,
  useEliminarGasto,
  useEvidencias,
} from '@/features/gastos/use-detalle-gasto';
import { formatearPesos } from '@/features/gastos/validar-gasto';
import { useGrupo } from '@/features/grupos/use-grupo';
import { PALETA } from '@/theme/tema';

// Detalle de un gasto: total, quién pagó, cómo se dividió, quién lo registró
// y la evidencia (comprobantes).
export default function DetalleGastoScreen() {
  const { id, gastoId } = useLocalSearchParams<{ id: string; gastoId: string }>();
  const insets = useSafeAreaInsets();
  const { sesion } = useSesion();
  const { data: grupo } = useGrupo(id ?? '');
  const { data: gasto, isPending, isError, refetch, isRefetching } = useDetalleGasto(gastoId ?? '');
  const evidencias = useEvidencias({ tipo: 'gasto', id: gastoId ?? '' });
  const eliminar = useEliminarGasto(id ?? '');

  const marcar = useMarcarPartePagada(id ?? '');

  const yo = grupo?.integrantes.find((i) => i.usuarioId === sesion?.user.id);
  const soyAdmin = yo?.rol === 'admin';
  const hoy = hoyLocal();
  const porCubrir = gasto?.pagadoPorId === null;
  const pagadas = gasto?.participaciones.filter((p) => p.pagada).length ?? 0;

  return (
    <ScrollView
      style={styles.fondo}
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + 8 }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching || evidencias.isRefetching}
          onRefresh={() => {
            void refetch();
            void evidencias.refetch();
          }}
          tintColor={PALETA.morado}
        />
      }
    >
      <StatusBar style="dark" />
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Volver al grupo"
        hitSlop={10}
        style={styles.volver}
      >
        <Text style={styles.volverTexto}>‹ {grupo?.nombre ?? 'Grupo'}</Text>
      </Pressable>

      {isPending && <ActivityIndicator color={PALETA.morado} style={styles.cargando} />}
      {isError && (
        <Pressable onPress={() => refetch()} accessibilityRole="button" style={styles.tarjeta}>
          <Text style={styles.error}>No pudimos cargar el gasto. Toca para reintentar.</Text>
        </Pressable>
      )}

      {gasto && (
        <>
          {/* Resumen */}
          <View style={styles.hero}>
            <View style={styles.heroIcono}>
              <Text style={styles.heroIconoTexto}>{iconoCategoria(gasto.categoria)}</Text>
            </View>
            <Text style={[styles.heroDescripcion, gasto.eliminado && styles.tachado]} accessibilityRole="header">
              {gasto.descripcion}
            </Text>
            <Text style={[styles.heroMonto, gasto.eliminado && styles.tachado]}>
              {formatearPesos(gasto.monto)}
            </Text>
            <Text style={styles.heroDetalle}>
              {etiquetaCategoria(gasto.categoria)} · {textoFecha(gasto.fecha, hoy)}
            </Text>
            {(gasto.fechaLimite || gasto.mensual) && !gasto.eliminado && (
              <View style={styles.insignias}>
                {gasto.fechaLimite && (
                  <Text style={[styles.insignia, gasto.fechaLimite < hoy && styles.insigniaVencida]}>
                    {gasto.fechaLimite < hoy ? '⚠ Venció' : '📅 Vence'} el{' '}
                    {fechaLarga(gasto.fechaLimite, hoy)}
                  </Text>
                )}
                {gasto.mensual && <Text style={styles.insignia}>🔁 Mensual</Text>}
              </View>
            )}
            {gasto.eliminado && <Text style={styles.eliminado}>Este gasto fue eliminado</Text>}
          </View>

          {/* Quién pagó */}
          <View style={styles.tarjeta}>
            {porCubrir ? (
              <>
                <Text style={styles.etiqueta}>Por cubrir</Text>
                <Text style={styles.valor}>
                  {pagadas} de {gasto.participaciones.length} partes pagadas
                </Text>
                <View style={styles.barra}>
                  <View
                    style={[
                      styles.barraRelleno,
                      { width: `${(pagadas / Math.max(gasto.participaciones.length, 1)) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.ayuda}>
                  Cada rumi paga su parte por fuera y la marca como pagada aquí.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.etiqueta}>Pagó</Text>
                <Text style={styles.valor}>
                  {gasto.pagadoPorId === yo?.id ? `${gasto.pagadoPorNombre} (tú)` : gasto.pagadoPorNombre}
                </Text>
              </>
            )}
          </View>

          {/* División */}
          <View style={styles.tarjeta}>
            <Text style={styles.etiqueta}>
              División {gasto.tipoDivision === 'equitativa' ? 'en partes iguales' : 'personalizada'}
            </Text>
            {gasto.participaciones.map((p, i) => {
              const puedoMarcar = !gasto.eliminado && (p.integranteId === yo?.id || soyAdmin);
              return (
                <View key={p.integranteId}>
                  {i > 0 && <View style={styles.separador} />}
                  <View style={styles.filaParte}>
                    <View style={styles.parteTextos}>
                      <Text style={styles.parteNombre}>
                        {p.nombre}
                        {p.integranteId === yo?.id && <Text style={styles.tu}> (tú)</Text>}
                      </Text>
                      <Text style={styles.parteMonto}>{formatearPesos(p.monto)}</Text>
                    </View>
                    {porCubrir &&
                      (p.pagada ? (
                        <Pressable
                          disabled={!puedoMarcar || marcar.isPending}
                          onPress={() =>
                            Alert.alert(
                              '¿Desmarcar como pagada?',
                              `La parte de ${p.nombre} volverá a quedar pendiente.`,
                              [
                                { text: 'Cancelar', style: 'cancel' },
                                {
                                  text: 'Desmarcar',
                                  style: 'destructive',
                                  onPress: () =>
                                    marcar.mutate({
                                      gastoId: gasto.id,
                                      integranteId: p.integranteId,
                                      pagada: false,
                                    }),
                                },
                              ],
                            )
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Parte de ${p.nombre} pagada`}
                        >
                          <Text style={styles.pagada}>✓ Pagada</Text>
                        </Pressable>
                      ) : puedoMarcar ? (
                        <Pressable
                          disabled={marcar.isPending}
                          onPress={() =>
                            marcar.mutate({ gastoId: gasto.id, integranteId: p.integranteId, pagada: true })
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Marcar como pagada la parte de ${p.nombre}`}
                          style={({ pressed }) => [styles.marcar, pressed && styles.presionado]}
                        >
                          <Text style={styles.marcarTexto}>Marcar pagada</Text>
                        </Pressable>
                      ) : (
                        <Text style={styles.pendiente}>Pendiente</Text>
                      ))}
                  </View>
                </View>
              );
            })}
            {marcar.isError && <Text style={styles.error}>{marcar.error.message}</Text>}
          </View>

          <Text style={styles.registro}>
            Registrado por {gasto.creadoPorNombre} · {textoFecha(gasto.creadoEn.slice(0, 10), hoy)}
          </Text>
          {gasto.editadoEn && (
            <Text style={styles.registro}>
              Editado por {gasto.editadoPorNombre ?? 'un admin'} ·{' '}
              {textoFecha(gasto.editadoEn.slice(0, 10), hoy)}
            </Text>
          )}
          {gasto.eliminado && gasto.eliminadoPorNombre && (
            <Text style={styles.registro}>Eliminado por {gasto.eliminadoPorNombre}</Text>
          )}

          {soyAdmin && !gasto.eliminado && (
            <AccionesAdmin
              que="gasto"
              onEditar={() =>
                router.push({
                  pathname: '/grupo/[id]/nuevo-gasto',
                  params: { id: gasto.grupoId, editar: gasto.id },
                })
              }
              onEliminar={() =>
                eliminar.mutate(gasto.id, { onSuccess: () => router.back() })
              }
              eliminando={eliminar.isPending}
              error={eliminar.error?.message}
            />
          )}

          {/* Evidencia */}
          <SeccionEvidencia
            grupoId={gasto.grupoId}
            origen={{ tipo: 'gasto', id: gasto.id }}
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
  cargando: { marginVertical: 40 },
  error: { color: PALETA.error, fontSize: 15 },
  tachado: { textDecorationLine: 'line-through' },

  hero: {
    backgroundColor: PALETA.morado,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  heroIcono: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: PALETA.lilaClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroIconoTexto: { fontSize: 30 },
  heroDescripcion: { color: PALETA.blanco, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  heroMonto: { color: PALETA.blanco, fontSize: 38, fontWeight: '800' },
  heroDetalle: { color: PALETA.lilaClaro, fontSize: 14 },
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

  tarjeta: { backgroundColor: PALETA.blanco, borderRadius: 20, padding: 16, gap: 6 },
  etiqueta: { fontSize: 13, fontWeight: '700', color: PALETA.textoSuave, textTransform: 'uppercase' },
  valor: { fontSize: 17, fontWeight: '700', color: PALETA.moradoOscuro },
  separador: { height: 1, backgroundColor: PALETA.lilaClaro },
  filaParte: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  parteTextos: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  parteNombre: { fontSize: 16, color: PALETA.moradoOscuro, flexShrink: 1 },
  tu: { color: PALETA.textoSuave },
  parteMonto: { fontSize: 16, fontWeight: '700', color: PALETA.moradoOscuro },
  ayuda: { fontSize: 13, color: PALETA.textoSuave, lineHeight: 19 },
  presionado: { opacity: 0.8 },
  insignias: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 4 },
  insignia: {
    color: PALETA.morado,
    backgroundColor: PALETA.lilaClaro,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  insigniaVencida: { color: PALETA.blanco, backgroundColor: PALETA.error },
  barra: { height: 8, borderRadius: 4, backgroundColor: PALETA.lilaClaro, overflow: 'hidden' },
  barraRelleno: { height: 8, borderRadius: 4, backgroundColor: '#27A35F' },
  pagada: {
    color: '#1E8E5A',
    backgroundColor: '#E3F5EA',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  marcar: {
    backgroundColor: PALETA.morado,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  marcarTexto: { color: PALETA.blanco, fontSize: 13, fontWeight: '800' },
  pendiente: { color: PALETA.textoSuave, fontSize: 13, fontWeight: '700' },
  registro: { fontSize: 13, color: PALETA.textoSuave, textAlign: 'center' },
});
