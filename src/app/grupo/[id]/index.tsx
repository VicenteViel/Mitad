import { router, useLocalSearchParams, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
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
import { FilaGasto } from '@/features/gastos/components/fila-gasto';
import { useGastos } from '@/features/gastos/use-registrar-gasto';
import { FilaIntegranteGrupo } from '@/features/grupos/components/fila-integrante-grupo';
import { contarIntegrantes, etiquetasIntegrante } from '@/features/grupos/resumen-integrantes';
import { useGrupo } from '@/features/grupos/use-grupo';
import { FilaPago } from '@/features/saldos/components/fila-pago';
import { AvisosVencidos } from '@/features/saldos/components/avisos-vencidos';
import { TarjetaSaldos } from '@/features/saldos/components/tarjeta-saldos';
import { ordenarMovimientos } from '@/features/saldos/movimientos';
import type { Deuda } from '@/features/saldos/saldos';
import { usePagos, useRumisSaldo, useSaldos } from '@/features/saldos/use-saldos';
import { useVencidos } from '@/features/saldos/use-vencidos';
import { PALETA } from '@/theme/tema';

// En la pantalla del grupo se ven los últimos; el resto, en Historial.
const MOVIMIENTOS_RECIENTES = 5;

export default function GrupoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const grupoId = id ?? '';
  const insets = useSafeAreaInsets();
  const { sesion } = useSesion();
  const { data: grupo, isPending, isError, refetch, isRefetching } = useGrupo(grupoId);
  const gastos = useGastos(grupoId);
  const pagos = usePagos(grupoId);
  const rumis = useRumisSaldo(grupoId);
  const { saldos } = useSaldos(grupoId);
  const vencidos = useVencidos(grupoId);

  const rutaNuevoGasto = `/grupo/${grupoId}/nuevo-gasto` as Href;
  const yo = grupo?.integrantes.find((i) => i.usuarioId === sesion?.user.id);
  const yoSaldo = rumis.data?.find((r) => r.usuarioId === sesion?.user.id);
  const soyAdmin = yo?.rol === 'admin';
  const hoy = hoyLocal();

  const nombreRumi = (integranteId: string) =>
    integranteId === yo?.id
      ? 'Tú'
      : (rumis.data?.find((r) => r.id === integranteId)?.nombre ?? 'Ex-rumi');
  const movimientos =
    gastos.data && pagos.data ? ordenarMovimientos(gastos.data, pagos.data) : undefined;

  function registrarPago(deuda?: Deuda) {
    router.push({
      pathname: '/grupo/[id]/pago/nuevo',
      params: deuda
        ? { id: grupoId, de: deuda.deudor, a: deuda.acreedor, monto: String(deuda.monto) }
        : { id: grupoId },
    });
  }

  function verHistorial() {
    router.push({ pathname: '/grupo/[id]/historial', params: { id: grupoId } });
  }

  function recargarTodo() {
    void refetch();
    void gastos.refetch();
    void pagos.refetch();
    void rumis.refetch();
  }

  return (
    <ScrollView
      style={styles.fondo}
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + 8 }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching || gastos.isRefetching || pagos.isRefetching}
          onRefresh={recargarTodo}
          tintColor={PALETA.morado}
        />
      }
    >
      <StatusBar style="dark" />
      <View style={styles.barra}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver a Inicio"
          hitSlop={10}
          style={styles.volver}
        >
          <Text style={styles.volverTexto}>‹ Inicio</Text>
        </Pressable>
        {grupo && (
          <Pressable
            onPress={() => router.push({ pathname: '/grupo/[id]/ajustes', params: { id: grupoId } })}
            accessibilityRole="button"
            accessibilityLabel="Ajustes del grupo"
            hitSlop={10}
            style={styles.volver}
          >
            <Text style={styles.volverTexto}>Ajustes ⚙︎</Text>
          </Pressable>
        )}
      </View>

      {isPending && <ActivityIndicator color={PALETA.morado} style={styles.cargando} />}

      {isError && (
        <Pressable onPress={() => refetch()} accessibilityRole="button" style={styles.error}>
          <Text style={styles.errorTitulo}>No pudimos cargar el grupo</Text>
          <Text style={styles.errorTexto}>Toca para intentar de nuevo.</Text>
        </Pressable>
      )}

      {grupo && (
        <>
          {/* Encabezado del grupo */}
          <View style={styles.hero}>
            <View style={[styles.burbuja, styles.burbujaGrande]} />
            <View style={styles.heroInicial}>
              <Text style={styles.heroInicialTexto}>
                {grupo.nombre.trim().charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.heroNombre} accessibilityRole="header">
              {grupo.nombre}
            </Text>
            {grupo.descripcion && <Text style={styles.heroDescripcion}>{grupo.descripcion}</Text>}
            <Text style={styles.heroConteo}>{contarIntegrantes(grupo.integrantes)}</Text>
          </View>

          {/* Lo que tengo vencido (decisión 52) */}
          <AvisosVencidos
            vencidos={vencidos}
            hoy={hoy}
            nombreRumi={nombreRumi}
            onAbrirGasto={(gastoId) => router.push(`/grupo/${grupoId}/gasto/${gastoId}` as Href)}
            onPagar={(acreedor, monto) =>
              yoSaldo && registrarPago({ deudor: yoSaldo.id, acreedor, monto })
            }
          />

          {/* Acciones */}
          <View style={styles.acciones}>
            <Pressable
              onPress={() => router.push(rutaNuevoGasto)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.accion, styles.accionPrincipal, pressed && styles.presionado]}
            >
              <Text style={styles.accionIcono}>＋</Text>
              <Text style={styles.accionPrincipalTexto}>Agregar gasto</Text>
            </Pressable>
            <Pressable
              onPress={() => registrarPago()}
              accessibilityRole="button"
              style={({ pressed }) => [styles.accion, styles.accionSecundaria, pressed && styles.presionado]}
            >
              <Text style={styles.accionSecundariaTexto}>💸 Registrar pago</Text>
            </Pressable>
          </View>

          {/* Saldos: quién le debe a quién */}
          {saldos && rumis.data && (
            <TarjetaSaldos
              saldos={saldos}
              rumis={rumis.data}
              yo={yoSaldo}
              onRegistrarPago={registrarPago}
            />
          )}

          {/* Historial: gastos y pagos */}
          <View style={styles.seccionFila}>
            <Text style={styles.seccion}>Últimos movimientos</Text>
            {movimientos && movimientos.length > 0 && (
              <Pressable onPress={verHistorial} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.verTodo}>Ver todo ›</Text>
              </Pressable>
            )}
          </View>
          {(gastos.isPending || pagos.isPending) && <ActivityIndicator color={PALETA.morado} />}
          {(gastos.isError || pagos.isError) && (
            <Pressable onPress={recargarTodo} accessibilityRole="button" style={styles.error}>
              <Text style={styles.errorTitulo}>No pudimos cargar los movimientos</Text>
              <Text style={styles.errorTexto}>Toca para intentar de nuevo.</Text>
            </Pressable>
          )}
          {movimientos?.length === 0 && (
            <View style={styles.vacio}>
              <Text style={styles.vacioTitulo}>Todavía no hay gastos</Text>
              <Text style={styles.vacioTexto}>
                Toca “Agregar gasto” para registrar el primero.
              </Text>
            </View>
          )}
          {movimientos && movimientos.length > 0 && (
            <View style={styles.tarjeta}>
              {movimientos.slice(0, MOVIMIENTOS_RECIENTES).map((m, i) => (
                <View key={`${m.tipo}-${m.id}`}>
                  {i > 0 && <View style={styles.separador} />}
                  {m.tipo === 'gasto' ? (
                    <FilaGasto
                      gasto={m.gasto}
                      miIntegranteId={yo?.id}
                      hoy={hoy}
                      onPress={() => router.push(`/grupo/${grupoId}/gasto/${m.id}` as Href)}
                    />
                  ) : (
                    <FilaPago
                      pago={m.pago}
                      nombre={nombreRumi}
                      hoy={hoy}
                      onPress={() => router.push(`/grupo/${grupoId}/pago/${m.id}` as Href)}
                    />
                  )}
                </View>
              ))}
            </View>
          )}
          {movimientos && movimientos.length > 0 && (
            <Pressable
              onPress={verHistorial}
              accessibilityRole="button"
              style={({ pressed }) => [styles.botonHistorial, pressed && styles.presionado]}
            >
              <Text style={styles.botonHistorialTexto}>
                🧾 Ver historial completo ({movimientos.length})
              </Text>
            </Pressable>
          )}

          {/* Rumis (integrantes) */}
          <Text style={styles.seccion}>Rumis</Text>
          <View style={styles.tarjeta}>
            {grupo.integrantes.map((integrante, i) => (
              <View key={integrante.id}>
                {i > 0 && <View style={styles.separador} />}
                <FilaIntegranteGrupo
                  integrante={integrante}
                  etiquetas={etiquetasIntegrante(integrante, sesion?.user.id)}
                  onInvitar={
                    soyAdmin && integrante.usuarioId === null
                      ? () =>
                          router.push(
                            `/grupo/${grupoId}/invitar/${integrante.id}` as Href,
                          )
                      : undefined
                  }
                />
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: PALETA.crema },
  contenido: { paddingHorizontal: 20, paddingBottom: 48, gap: 14 },
  barra: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  volver: { paddingVertical: 6 },
  volverTexto: { color: PALETA.morado, fontSize: 17, fontWeight: '600' },
  cargando: { marginVertical: 40 },

  error: { backgroundColor: PALETA.blanco, borderRadius: 20, padding: 16, gap: 4 },
  errorTitulo: { fontSize: 16, fontWeight: '700', color: PALETA.error },
  errorTexto: { fontSize: 14, color: PALETA.textoSuave },

  hero: {
    backgroundColor: PALETA.morado,
    borderRadius: 28,
    padding: 24,
    gap: 6,
    overflow: 'hidden',
  },
  burbuja: { position: 'absolute', borderRadius: 999, backgroundColor: PALETA.violeta },
  burbujaGrande: { width: 200, height: 200, top: -80, right: -60, opacity: 0.5 },
  heroInicial: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: PALETA.lilaClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  heroInicialTexto: { fontSize: 26, fontWeight: '800', color: PALETA.morado },
  heroNombre: { color: PALETA.blanco, fontSize: 26, fontWeight: '800' },
  heroDescripcion: { color: PALETA.lilaClaro, fontSize: 15 },
  heroConteo: { color: PALETA.blanco, fontSize: 14, fontWeight: '600', marginTop: 4, opacity: 0.9 },

  acciones: { flexDirection: 'row', gap: 10 },
  accion: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  accionPrincipal: { backgroundColor: PALETA.violeta, flexDirection: 'row', gap: 6 },
  accionIcono: { color: PALETA.blanco, fontSize: 18, fontWeight: '800' },
  accionPrincipalTexto: { color: PALETA.blanco, fontSize: 16, fontWeight: '700' },
  accionSecundaria: { backgroundColor: PALETA.blanco, borderWidth: 1.5, borderColor: PALETA.violeta },
  accionSecundariaTexto: { color: PALETA.morado, fontSize: 16, fontWeight: '700' },
  presionado: { opacity: 0.85 },

  seccion: { fontSize: 20, fontWeight: '800', color: PALETA.moradoOscuro, marginTop: 8 },
  seccionFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verTodo: { color: PALETA.morado, fontSize: 15, fontWeight: '700', marginTop: 8 },
  botonHistorial: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: PALETA.violeta,
    backgroundColor: PALETA.blanco,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonHistorialTexto: { color: PALETA.morado, fontSize: 15, fontWeight: '800' },
  tarjeta: {
    backgroundColor: PALETA.blanco,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: PALETA.moradoOscuro,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  separador: { height: 1, backgroundColor: PALETA.lilaClaro },

  vacio: {
    gap: 4,
    padding: 18,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: PALETA.borde,
  },
  vacioTitulo: { fontSize: 16, fontWeight: '700', color: PALETA.moradoOscuro },
  vacioTexto: { fontSize: 14, color: PALETA.textoSuave, lineHeight: 20 },
});
