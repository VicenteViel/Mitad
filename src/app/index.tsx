import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

import { consumirIntencion } from '@/features/auth/intencion';
import { useSesion } from '@/features/auth/use-sesion';
import { TarjetaGrupo } from '@/features/grupos/components/tarjeta-grupo';
import { useMisGrupos } from '@/features/grupos/use-mis-grupos';
import { leerAvisoCorreo, type AvisoCorreo } from '@/features/invitaciones/aviso-correo';
import { SIMULAR_GUARDADO } from '@/lib/desarrollo';
import { supabase } from '@/lib/supabase';
import { PALETA } from '@/theme/tema';

export default function InicioScreen() {
  const { sesion } = useSesion();
  const insets = useSafeAreaInsets();
  const { data: grupos, isPending, isError, refetch, isRefetching } = useMisGrupos();

  // Quien eligió "Soy nuevo" en la bienvenida va directo a crear su grupo.
  useEffect(() => {
    if (consumirIntencion() === 'crear-grupo') {
      router.push('/crear-grupo');
    }
  }, []);

  // Recordatorio de correo pendiente; se relee cada vez que se vuelve a Inicio.
  const [avisoCorreo, setAvisoCorreo] = useState<AvisoCorreo>(null);
  useFocusEffect(
    useCallback(() => {
      setAvisoCorreo(leerAvisoCorreo());
    }, []),
  );

  const correo = sesion?.user.email ?? '';
  const inicial = correo.charAt(0).toUpperCase() || 'R';

  return (
    <ScrollView
      style={styles.fondo}
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + 16 }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={PALETA.morado}
        />
      }
    >
      {/* Encabezado */}
      <View style={styles.encabezado}>
        <View style={styles.saludo}>
          <Text style={styles.hola}>¡Hola!</Text>
          <Text style={styles.correo} numberOfLines={1}>
            {correo}
          </Text>
        </View>
        <View style={styles.avatar} accessibilityElementsHidden>
          <Text style={styles.avatarTexto}>{inicial}</Text>
        </View>
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
        <View style={styles.avisoCorreo}>
          <Text style={styles.avisoCorreoTitulo}>
            {avisoCorreo.tipo === 'verificar' ? 'Verifica tu correo' : 'Agrega tu correo'}
          </Text>
          <Text style={styles.avisoCorreoTexto}>
            {avisoCorreo.tipo === 'verificar'
              ? `Te enviamos un enlace a ${avisoCorreo.correo}. Confírmalo para poder recuperar tu lugar si pierdes el teléfono.`
              : 'Sin correo no podrás recuperar tu lugar en el grupo si pierdes el teléfono.'}
          </Text>
        </View>
      )}

      {/* Tarjeta principal */}
      <View style={styles.hero}>
        <View style={[styles.burbuja, styles.burbujaGrande]} />
        <View style={[styles.burbuja, styles.burbujaChica]} />
        <Text style={styles.heroMarca}>Rumi</Text>
        <Text style={styles.heroTitulo}>Comparte gastos.{'\n'}Comparte responsabilidades.</Text>
        <Pressable
          onPress={() => router.push('/crear-grupo')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.heroBoton, pressed && styles.presionado]}
        >
          <Text style={styles.heroBotonTexto}>+ Crear grupo</Text>
        </Pressable>
      </View>

      {/* Mis grupos */}
      <View style={styles.seccionEncabezado}>
        <Text style={styles.seccionTitulo}>Tus grupos</Text>
        {grupos && grupos.length > 0 && (
          <Text style={styles.seccionContador}>{grupos.length}</Text>
        )}
      </View>

      {isPending && <ActivityIndicator color={PALETA.morado} style={styles.cargando} />}

      {isError && (
        <Pressable onPress={() => refetch()} accessibilityRole="button" style={styles.aviso}>
          <Text style={styles.avisoTitulo}>No pudimos cargar tus grupos</Text>
          <Text style={styles.avisoTexto}>Toca para intentar de nuevo.</Text>
        </Pressable>
      )}

      {grupos?.length === 0 && (
        <View style={styles.vacio}>
          <Text style={styles.vacioIcono}>🏠</Text>
          <Text style={styles.vacioTitulo}>Todavía no tienes grupos</Text>
          <Text style={styles.vacioTexto}>
            Crea uno para tu casa o abre el link de invitación que te enviaron.
          </Text>
        </View>
      )}

      {grupos?.map((grupo) => <TarjetaGrupo key={grupo.id} grupo={grupo} />)}

      {/* Invitación */}
      <View style={styles.invitacion}>
        <Text style={styles.invitacionTitulo}>¿Te invitaron a un grupo?</Text>
        <Text style={styles.invitacionTexto}>
          Abre en este teléfono el link que te envió el administrador.
        </Text>
      </View>

      <Pressable
        onPress={() => supabase.auth.signOut()}
        accessibilityRole="button"
        style={styles.salir}
      >
        <Text style={styles.salirTexto}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: PALETA.crema },
  contenido: { paddingHorizontal: 20, paddingBottom: 48, gap: 14 },

  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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

  vacio: {
    alignItems: 'center',
    gap: 6,
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: PALETA.borde,
  },
  vacioIcono: { fontSize: 36 },
  vacioTitulo: { fontSize: 17, fontWeight: '700', color: PALETA.moradoOscuro },
  vacioTexto: { fontSize: 14, color: PALETA.textoSuave, textAlign: 'center' },

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
