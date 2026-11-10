import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotonOpcion } from '@/components/boton-opcion';
import { useSesion } from '@/features/auth/use-sesion';
import { TarjetaGrupo } from '@/features/grupos/components/tarjeta-grupo';
import { useMisGrupos } from '@/features/grupos/use-mis-grupos';
import { useAvisoCorreo } from '@/features/invitaciones/use-aviso-correo';
import { SIMULAR_GUARDADO } from '@/lib/desarrollo';
import { supabase } from '@/lib/supabase';
import { PALETA } from '@/theme/tema';

export default function InicioScreen() {
  const { sesion } = useSesion();
  const insets = useSafeAreaInsets();
  const { data: grupos, isPending, isError, refetch, isRefetching } = useMisGrupos();

  // El camino lo decide la cuenta, no lo que la persona eligió al entrar:
  // con grupos ve sus grupos; sin grupos ve "¿Qué quieres hacer?".
  const sinGrupos = grupos?.length === 0;
  const conGrupos = grupos !== undefined && grupos.length > 0;

  // Recordatorio de correo (sin correo o sin confirmar); se revisa cada vez que
  // se vuelve a Inicio, por si ya confirmó el enlace.
  const { aviso: avisoCorreo, recargar: recargarAviso } = useAvisoCorreo();
  useFocusEffect(
    useCallback(() => {
      void recargarAviso();
    }, [recargarAviso]),
  );

  const correo = sesion?.user.email || 'Sin correo';
  const inicial = correo.charAt(0).toUpperCase() || 'R';

  return (
    <ScrollView
      style={styles.fondo}
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + 16 }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
            void recargarAviso();
          }}
          tintColor={PALETA.morado}
        />
      }
    >
      <StatusBar style="dark" />
      {/* Encabezado */}
      <View style={styles.encabezado}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          accessibilityRole="image"
          accessibilityLabel="Logo de Rumi"
        />
        <View style={styles.saludo}>
          <Text style={styles.hola}>¡Hola!</Text>
          <Text style={styles.correo} numberOfLines={1}>
            {correo}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/cuenta')}
          accessibilityRole="button"
          accessibilityLabel="Mi cuenta"
          hitSlop={8}
          style={({ pressed }) => [styles.avatar, pressed && styles.presionado]}
        >
          <Text style={styles.avatarTexto}>{inicial}</Text>
        </Pressable>
      </View>

      {SIMULAR_GUARDADO && (
        <View style={styles.filaPrueba}>
          <Text style={styles.modoPrueba}>Modo prueba activo</Text>
          <Pressable onPress={() => router.push('/unido')} accessibilityRole="button">
            <Text style={styles.enlacePrueba}>Probar: aceptar una invitación</Text>
          </Pressable>
        </View>
      )}

      {avisoCorreo && (
        <Pressable
          onPress={() => router.push('/cuenta')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.avisoCorreo, pressed && styles.presionado]}
        >
          <Text style={styles.avisoCorreoTitulo}>
            {avisoCorreo.tipo === 'verificar' ? 'Verifica tu correo' : 'Agrega tu correo'}
          </Text>
          <Text style={styles.avisoCorreoTexto}>
            {avisoCorreo.tipo === 'verificar'
              ? `Te enviamos un enlace a ${avisoCorreo.correo}. Confírmalo para poder recuperar tu lugar si pierdes el teléfono.`
              : 'Sin correo no podrás recuperar tu lugar en el grupo si pierdes el teléfono.'}
          </Text>
          <Text style={styles.avisoCorreoEnlace}>Ir a Mi cuenta →</Text>
        </Pressable>
      )}

      {isPending && <ActivityIndicator color={PALETA.morado} style={styles.cargando} />}

      {isError && (
        <Pressable onPress={() => refetch()} accessibilityRole="button" style={styles.aviso}>
          <Text style={styles.avisoTitulo}>No pudimos cargar tus grupos</Text>
          <Text style={styles.avisoTexto}>Toca para intentar de nuevo.</Text>
        </Pressable>
      )}

      {/* Sin grupos: la cuenta es nueva (o entró con otro correo). */}
      {sinGrupos && (
        <>
          <Text style={styles.comenzarTitulo}>¿Qué quieres hacer?</Text>
          <BotonOpcion
            principal
            titulo="Crear un grupo"
            detalle="Para tu casa, tu pareja o tus amigos."
            onPress={() => router.push('/crear-grupo')}
          />
          <BotonOpcion
            titulo="Me invitaron"
            detalle="Tengo un código o un link del administrador."
            onPress={() => router.push('/invitacion')}
          />

          <View style={styles.otroCorreo}>
            <Text style={styles.otroCorreoTitulo}>¿Esperabas ver tus grupos?</Text>
            <Text style={styles.otroCorreoTexto}>
              Entraste con {correo}. Si antes usabas otro correo, entra con ese.
            </Text>
            <Pressable onPress={() => supabase.auth.signOut()} accessibilityRole="button">
              <Text style={styles.otroCorreoBoton}>Cambiar de correo</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Con grupos: tarjeta principal y la lista. */}
      {conGrupos && (
        <>
          <View style={styles.hero}>
            <View style={[styles.burbuja, styles.burbujaGrande]} />
            <View style={[styles.burbuja, styles.burbujaChica]} />
            <Text style={styles.heroMarca}>Rumi</Text>
            <Text style={styles.heroTitulo}>
              Comparte gastos.{'\n'}Comparte responsabilidades.
            </Text>
            <Pressable
              onPress={() => router.push('/crear-grupo')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.heroBoton, pressed && styles.presionado]}
            >
              <Text style={styles.heroBotonTexto}>+ Crear grupo</Text>
            </Pressable>
          </View>

          <View style={styles.seccionEncabezado}>
            <Text style={styles.seccionTitulo}>Tus grupos</Text>
            <Text style={styles.seccionContador}>{grupos.length}</Text>
          </View>

          {grupos.map((grupo) => (
            <TarjetaGrupo
              key={grupo.id}
              grupo={grupo}
              onPress={() => router.push({ pathname: '/grupo/[id]', params: { id: grupo.id } })}
            />
          ))}

          <Pressable
            onPress={() => router.push('/invitacion')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.invitacion, pressed && styles.presionado]}
          >
            <Text style={styles.invitacionTitulo}>¿Te invitaron a otro grupo?</Text>
            <Text style={styles.invitacionTexto}>
              Abre el link en este teléfono o toca aquí para escribir el código.
            </Text>
          </Pressable>
        </>
      )}

      <Pressable
        onPress={() => router.push('/cuenta')}
        accessibilityRole="button"
        style={styles.salir}
      >
        <Text style={styles.salirTexto}>Mi cuenta</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: PALETA.crema },
  contenido: { paddingHorizontal: 20, paddingBottom: 48, gap: 14 },

  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 52, height: 52, borderRadius: 14, marginRight: 12 },
  saludo: { flex: 1, gap: 2 },
  hola: { fontSize: 28, fontWeight: '800', color: PALETA.moradoOscuro },
  correo: { fontSize: 14, color: PALETA.textoSuave },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PALETA.violeta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { color: PALETA.blanco, fontSize: 20, fontWeight: '800' },

  filaPrueba: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  enlacePrueba: { color: PALETA.morado, fontSize: 13, fontWeight: '700' },
  avisoCorreo: {
    backgroundColor: PALETA.blanco,
    borderLeftWidth: 4,
    borderLeftColor: PALETA.violeta,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  avisoCorreoTitulo: { fontSize: 16, fontWeight: '700', color: PALETA.moradoOscuro },
  avisoCorreoTexto: { fontSize: 14, color: PALETA.textoSuave, lineHeight: 20 },
  avisoCorreoEnlace: { fontSize: 14, fontWeight: '700', color: PALETA.morado, marginTop: 2 },
  modoPrueba: {
    alignSelf: 'flex-start',
    backgroundColor: PALETA.lilaClaro,
    color: PALETA.morado,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },

  hero: {
    backgroundColor: PALETA.morado,
    borderRadius: 28,
    padding: 24,
    gap: 8,
    overflow: 'hidden',
    marginTop: 4,
  },
  burbuja: { position: 'absolute', borderRadius: 999, backgroundColor: PALETA.violeta },
  burbujaGrande: { width: 180, height: 180, top: -60, right: -50, opacity: 0.55 },
  burbujaChica: { width: 90, height: 90, bottom: -30, right: 70, opacity: 0.35 },
  heroMarca: { color: PALETA.lilaClaro, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  heroTitulo: { color: PALETA.blanco, fontSize: 22, fontWeight: '800', lineHeight: 29 },
  heroBoton: {
    alignSelf: 'flex-start',
    backgroundColor: PALETA.blanco,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  heroBotonTexto: { color: PALETA.morado, fontSize: 16, fontWeight: '700' },
  presionado: { opacity: 0.85 },

  seccionEncabezado: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  seccionTitulo: { fontSize: 20, fontWeight: '800', color: PALETA.moradoOscuro },
  seccionContador: {
    backgroundColor: PALETA.lilaClaro,
    color: PALETA.morado,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  cargando: { marginVertical: 24 },

  aviso: { backgroundColor: PALETA.blanco, borderRadius: 20, padding: 16, gap: 4 },
  avisoTitulo: { fontSize: 16, fontWeight: '700', color: PALETA.error },
  avisoTexto: { fontSize: 14, color: PALETA.textoSuave },

  comenzarTitulo: { fontSize: 22, fontWeight: '800', color: PALETA.moradoOscuro, marginTop: 8 },
  otroCorreo: {
    gap: 4,
    padding: 16,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: PALETA.borde,
    marginTop: 8,
  },
  otroCorreoTitulo: { fontSize: 15, fontWeight: '700', color: PALETA.moradoOscuro },
  otroCorreoTexto: { fontSize: 14, color: PALETA.textoSuave, lineHeight: 20 },
  otroCorreoBoton: { color: PALETA.morado, fontSize: 15, fontWeight: '700', marginTop: 4 },

  invitacion: {
    backgroundColor: PALETA.lilaClaro,
    borderRadius: 20,
    padding: 18,
    gap: 4,
    marginTop: 10,
  },
  invitacionTitulo: { fontSize: 16, fontWeight: '700', color: PALETA.morado },
  invitacionTexto: { fontSize: 14, color: PALETA.textoSuave },

  salir: { alignSelf: 'center', paddingVertical: 12, marginTop: 8 },
  salirTexto: { color: PALETA.textoSuave, fontSize: 15, fontWeight: '600' },
});
