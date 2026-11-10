import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSesion } from '@/features/auth/use-sesion';
import { formatearPesos } from '@/features/gastos/validar-gasto';
import { accionesSobreRumi } from '@/features/grupos/acciones-rumi';
import { salirDelGrupo, tomarAdmin } from '@/features/grupos/api-ajustes';
import { AjustesAgregarRumi } from '@/features/grupos/components/ajustes-agregar-rumi';
import { estilosAjustes as e } from '@/features/grupos/components/ajustes-estilos';
import { AjustesGrupoInfo } from '@/features/grupos/components/ajustes-grupo-info';
import { AjustesMiPerfil } from '@/features/grupos/components/ajustes-mi-perfil';
import { AjustesRumi } from '@/features/grupos/components/ajustes-rumi';
import { useAccionGrupo } from '@/features/grupos/use-ajustes';
import { useGrupo } from '@/features/grupos/use-grupo';
import { CLAVE_MIS_GRUPOS } from '@/features/grupos/use-mis-grupos';
import { useSaldos } from '@/features/saldos/use-saldos';
import { PALETA } from '@/theme/tema';

// Ajustes del grupo: datos del grupo (admins), tu perfil aquí, rumis y sus
// roles, agregar rumis, tomar el rol de admin si no hay y salir del grupo.
export default function AjustesGrupoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const grupoId = id ?? '';
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { sesion } = useSesion();
  const { data: grupo, isPending, isError } = useGrupo(grupoId);
  const { saldos } = useSaldos(grupoId);

  const tomar = useAccionGrupo(grupoId, () => tomarAdmin(grupoId));
  const salir = useAccionGrupo(grupoId, () => salirDelGrupo(grupoId));

  const yo = grupo?.integrantes.find((i) => i.usuarioId === sesion?.user.id);
  const soyAdmin = yo?.rol === 'admin';
  const admins = grupo?.integrantes.filter((i) => i.rol === 'admin' && i.usuarioId !== null) ?? [];
  const tengoCorreo = !!sesion?.user.email && !sesion.user.is_anonymous;
  const miNeto = yo ? (saldos?.netos.get(yo.id) ?? 0) : 0;
  const soyUltimoActivo =
    (grupo?.integrantes.filter((i) => i.usuarioId !== null).length ?? 0) <= 1;

  function confirmarSalir() {
    let saldo = 'Estás al día en este grupo.';
    if (miNeto < 0) saldo = `Todavía debes ${formatearPesos(-miNeto)}.`;
    if (miNeto > 0) saldo = `Todavía te deben ${formatearPesos(miNeto)}.`;
    const consecuencia = soyUltimoActivo
      ? 'Eres el último rumi con cuenta: el grupo y todos sus datos se borrarán.'
      : 'Perderás el acceso. Tus gastos y tu saldo seguirán visibles para el resto.';
    Alert.alert('¿Salir del grupo?', `${saldo}\n\n${consecuencia}`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () =>
          salir.mutate(undefined, {
            onSuccess: () => {
              void queryClient.invalidateQueries({ queryKey: CLAVE_MIS_GRUPOS });
              router.dismissTo('/');
            },
          }),
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.fondo}
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + 8 }]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
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
      <Text style={styles.titulo} accessibilityRole="header">
        Ajustes
      </Text>

      {isPending && <ActivityIndicator color={PALETA.morado} />}
      {isError && <Text style={e.error}>No pudimos cargar el grupo.</Text>}

      {grupo && yo && (
        <>
          {soyAdmin && (
            <AjustesGrupoInfo grupoId={grupoId} nombre={grupo.nombre} descripcion={grupo.descripcion} />
          )}

          <AjustesMiPerfil key={`${yo.id}-${yo.avatar}-${yo.color}-${yo.alias}`} grupoId={grupoId} yo={yo} />

          <View style={e.seccion}>
            <Text style={e.titulo}>Rumis</Text>
            {soyAdmin && (
              <Text style={e.ayuda}>Toca a un rumi para cambiar su rol o quitarlo del grupo.</Text>
            )}
            {grupo.integrantes.map((rumi) => (
              <AjustesRumi
                key={`${rumi.id}-${rumi.rol}-${rumi.avatar}-${rumi.color}`}
                grupoId={grupoId}
                rumi={rumi}
                esYo={rumi.id === yo.id}
                acciones={accionesSobreRumi(rumi, yo, admins.length)}
              />
            ))}
          </View>

          {soyAdmin && <AjustesAgregarRumi grupoId={grupoId} />}

          {admins.length === 0 && (
            <View style={e.seccion}>
              <Text style={e.titulo}>Este grupo no tiene admin</Text>
              <Text style={e.ayuda}>
                {tengoCorreo
                  ? 'Puedes tomar el rol de admin para invitar rumis y corregir gastos.'
                  : 'Agrega tu correo desde Inicio para poder tomar el rol de admin.'}
              </Text>
              {tengoCorreo && (
                <Pressable
                  onPress={() => tomar.mutate(undefined)}
                  disabled={tomar.isPending}
                  accessibilityRole="button"
                  style={({ pressed }) => [e.boton, pressed && e.presionado]}
                >
                  {tomar.isPending ? (
                    <ActivityIndicator color={PALETA.blanco} />
                  ) : (
                    <Text style={e.botonTexto}>Tomar el rol de admin</Text>
                  )}
                </Pressable>
              )}
              {tomar.isError && <Text style={e.error}>{tomar.error.message}</Text>}
            </View>
          )}

          <View style={e.seccion}>
            <Text style={e.titulo}>Salir del grupo</Text>
            <Text style={e.ayuda}>
              Puedes salir aunque tengas saldo pendiente: tu historial se conserva para el resto.
            </Text>
            {salir.isError && <Text style={e.error}>{salir.error.message}</Text>}
            <Pressable
              onPress={confirmarSalir}
              disabled={salir.isPending}
              accessibilityRole="button"
              style={({ pressed }) => [e.botonPeligro, pressed && e.presionado]}
            >
              {salir.isPending ? (
                <ActivityIndicator color={PALETA.blanco} />
              ) : (
                <Text style={e.botonPeligroTexto}>Salir del grupo</Text>
              )}
            </Pressable>
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
  titulo: { fontSize: 28, fontWeight: '800', color: PALETA.moradoOscuro },
});
