import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { eliminarCuenta } from '@/features/cuenta/api';
import { CLAVE_USUARIO_ACTUAL, useUsuarioActual } from '@/features/cuenta/use-usuario-actual';
import { estilosAjustes as e } from '@/features/grupos/components/ajustes-estilos';
import { agregarCorreo } from '@/features/invitaciones/api';
import { validarDatosIntegrante } from '@/features/invitaciones/validar-datos-integrante';
import { supabase } from '@/lib/supabase';
import { PALETA } from '@/theme/tema';

// Mi cuenta: correo (agregarlo o verificarlo), cerrar sesión y eliminar cuenta.
export default function CuentaScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { estado, isPending, refetch } = useUsuarioActual();
  const [correo, setCorreo] = useState('');
  const [errorCorreo, setErrorCorreo] = useState<string | null>(null);

  const guardarCorreo = useMutation({
    mutationFn: agregarCorreo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_USUARIO_ACTUAL }),
  });
  const eliminar = useMutation({ mutationFn: eliminarCuenta });

  function onGuardarCorreo() {
    const errores = validarDatosIntegrante({ alias: '', correo });
    const error = !correo.trim() ? 'Escribe tu correo.' : (errores.correo ?? null);
    setErrorCorreo(error);
    if (error) return;
    guardarCorreo.mutate(correo, { onSuccess: () => setCorreo('') });
  }

  function confirmarCerrarSesion() {
    if (estado.tipo !== 'con-correo') {
      Alert.alert(
        '¿Cerrar sesión sin correo?',
        'Tu cuenta no tiene un correo confirmado: si cierras sesión, no podrás volver a entrar a tus grupos. Necesitarías una invitación nueva del admin.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cerrar sesión', style: 'destructive', onPress: () => void supabase.auth.signOut() },
        ],
      );
      return;
    }
    void supabase.auth.signOut();
  }

  function confirmarEliminar() {
    Alert.alert(
      '¿Eliminar tu cuenta?',
      'Saldrás de todos tus grupos y tu nombre quedará como "Ex-rumi". Tus gastos y saldos se conservan para el resto. Esto no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar cuenta',
          style: 'destructive',
          onPress: () => eliminar.mutate(),
        },
      ],
    );
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
        accessibilityLabel="Volver a Inicio"
        hitSlop={10}
        style={styles.volver}
      >
        <Text style={styles.volverTexto}>‹ Inicio</Text>
      </Pressable>
      <Text style={styles.titulo} accessibilityRole="header">
        Mi cuenta
      </Text>

      {/* Correo */}
      <View style={e.seccion}>
        <Text style={e.titulo}>Correo</Text>
        {isPending && <ActivityIndicator color={PALETA.morado} />}
        {!isPending && estado.tipo === 'con-correo' && (
          <>
            <Text style={styles.correo}>{estado.correo}</Text>
            <Text style={e.ok}>✓ Verificado. Con este correo vuelves a tus grupos desde cualquier teléfono.</Text>
          </>
        )}
        {!isPending && estado.tipo === 'verificando' && (
          <>
            <Text style={styles.correo}>{estado.correo}</Text>
            <Text style={e.ayuda}>
              Te enviamos un enlace para confirmarlo. Ábrelo y luego vuelve aquí.
            </Text>
            <Pressable
              onPress={() => refetch()}
              accessibilityRole="button"
              style={({ pressed }) => [e.botonSecundario, pressed && e.presionado]}
            >
              <Text style={e.botonSecundarioTexto}>Ya lo confirmé</Text>
            </Pressable>
          </>
        )}
        {!isPending && estado.tipo !== 'con-correo' && (
          <>
            <Text style={e.ayuda}>
              {estado.tipo === 'verificando'
                ? '¿Te equivocaste? Escribe otro correo.'
                : 'Tu cuenta no tiene correo. Agrégalo para poder recuperar tus grupos si pierdes o cambias el teléfono.'}
            </Text>
            <TextInput
              style={e.input}
              value={correo}
              onChangeText={setCorreo}
              placeholder="nombre@correo.com"
              placeholderTextColor={PALETA.textoSuave}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              accessibilityLabel="Correo electrónico"
            />
            {errorCorreo && <Text style={e.error}>{errorCorreo}</Text>}
            {guardarCorreo.isError && <Text style={e.error}>{guardarCorreo.error.message}</Text>}
            <Pressable
              onPress={onGuardarCorreo}
              disabled={guardarCorreo.isPending}
              accessibilityRole="button"
              style={({ pressed }) => [e.boton, pressed && e.presionado]}
            >
              {guardarCorreo.isPending ? (
                <ActivityIndicator color={PALETA.blanco} />
              ) : (
                <Text style={e.botonTexto}>Guardar correo</Text>
              )}
            </Pressable>
          </>
        )}
      </View>

      {/* Sesión */}
      <View style={e.seccion}>
        <Text style={e.titulo}>Sesión</Text>
        <Pressable
          onPress={confirmarCerrarSesion}
          accessibilityRole="button"
          style={({ pressed }) => [e.botonSecundario, pressed && e.presionado]}
        >
          <Text style={e.botonSecundarioTexto}>Cerrar sesión</Text>
        </Pressable>
      </View>

      {/* Eliminar cuenta */}
      <View style={e.seccion}>
        <Text style={e.titulo}>Eliminar cuenta</Text>
        <Text style={e.ayuda}>
          Sales de todos tus grupos y tus datos personales se borran. Tus gastos y saldos quedan
          en el historial de cada grupo como “Ex-rumi”.
        </Text>
        {eliminar.isError && <Text style={e.error}>{eliminar.error.message}</Text>}
        <Pressable
          onPress={confirmarEliminar}
          disabled={eliminar.isPending}
          accessibilityRole="button"
          style={({ pressed }) => [e.botonPeligro, pressed && e.presionado]}
        >
          {eliminar.isPending ? (
            <ActivityIndicator color={PALETA.blanco} />
          ) : (
            <Text style={e.botonPeligroTexto}>Eliminar mi cuenta</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: PALETA.crema },
  contenido: { paddingHorizontal: 20, paddingBottom: 48, gap: 14 },
  volver: { alignSelf: 'flex-start', paddingVertical: 6 },
  volverTexto: { color: PALETA.morado, fontSize: 17, fontWeight: '600' },
  titulo: { fontSize: 28, fontWeight: '800', color: PALETA.moradoOscuro },
  correo: { fontSize: 17, fontWeight: '700', color: PALETA.moradoOscuro },
});
