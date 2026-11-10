import { router, useLocalSearchParams, type Href } from 'expo-router';
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
import { FilaIntegranteGrupo } from '@/features/grupos/components/fila-integrante-grupo';
import { contarIntegrantes, etiquetasIntegrante } from '@/features/grupos/resumen-integrantes';
import { useGrupo } from '@/features/grupos/use-grupo';
import { PALETA } from '@/theme/tema';

export default function GrupoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const grupoId = id ?? '';
  const insets = useSafeAreaInsets();
  const { sesion } = useSesion();
  const { data: grupo, isPending, isError, refetch, isRefetching } = useGrupo(grupoId);

  const rutaNuevoGasto = `/grupo/${grupoId}/nuevo-gasto` as Href;
  const soyAdmin =
    grupo?.integrantes.some((i) => i.usuarioId === sesion?.user.id && i.rol === 'admin') ?? false;

  return (
    <ScrollView
      style={styles.fondo}
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + 8 }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={PALETA.morado}
        />
      }
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Volver a Inicio"
        hitSlop={10}
        style={styles.volver}
      >
        <Text style={styles.volverTexto}>‹ Inicio</Text>
      </Pressable>

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
          </View>

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

          {/* Gastos (llegan con el registro de gastos) */}
          <Text style={styles.seccion}>Gastos</Text>
          <View style={styles.vacio}>
            <Text style={styles.vacioTitulo}>Todavía no hay gastos</Text>
            <Text style={styles.vacioTexto}>
              Cuando registren el primero, aquí verán el historial y quién le debe a quién.
            </Text>
          </View>
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
  presionado: { opacity: 0.85 },

  seccion: { fontSize: 20, fontWeight: '800', color: PALETA.moradoOscuro, marginTop: 8 },
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
