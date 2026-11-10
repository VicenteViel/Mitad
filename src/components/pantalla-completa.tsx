import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PALETA } from '@/theme/tema';

type Props = {
  titulo: string;
  subtitulo?: string;
  // Texto del enlace para volver, ej. "‹ Grupo".
  volver?: string;
  children: ReactNode;
  // Queda fijo abajo (sobre el teclado): normalmente el botón principal.
  pie?: ReactNode;
};

// Pantalla completa con el estilo de la pantalla del grupo: fondo crema,
// enlace para volver, título grande y contenido en secciones blancas.
export function PantallaCompleta({ titulo, subtitulo, volver = '‹ Volver', children, pie }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={styles.fondo}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.contenido, { paddingTop: insets.top + 8 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={10}
          style={styles.volver}
        >
          <Text style={styles.volverTexto}>{volver}</Text>
        </Pressable>
        <View style={styles.encabezado}>
          <Text style={styles.titulo} accessibilityRole="header">
            {titulo}
          </Text>
          {subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
        </View>
        {children}
      </ScrollView>
      {pie && <View style={[styles.pie, { paddingBottom: Math.max(insets.bottom, 12) }]}>{pie}</View>}
    </KeyboardAvoidingView>
  );
}

type SeccionProps = {
  titulo: string;
  // Texto o control a la derecha del título (ej. un resumen).
  extra?: ReactNode;
  children: ReactNode;
};

// Bloque blanco con título, para agrupar cada pregunta del formulario.
export function SeccionFormulario({ titulo, extra, children }: SeccionProps) {
  return (
    <View style={styles.seccion}>
      <View style={styles.seccionEncabezado}>
        <Text style={styles.seccionTitulo}>{titulo}</Text>
        {extra}
      </View>
      {children}
    </View>
  );
}

type BotonProps = {
  texto: string;
  onPress: () => void;
  cargando?: boolean;
};

// Botón principal grande del pie de un formulario.
export function BotonPrincipal({ texto, onPress, cargando = false }: BotonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={cargando}
      accessibilityRole="button"
      accessibilityState={{ busy: cargando }}
      style={({ pressed }) => [styles.boton, (pressed || cargando) && styles.presionado]}
    >
      <Text style={styles.botonTexto}>{cargando ? 'Guardando…' : texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: PALETA.crema },
  contenido: { paddingHorizontal: 20, paddingBottom: 32, gap: 14 },
  volver: { alignSelf: 'flex-start', paddingVertical: 6 },
  volverTexto: { color: PALETA.morado, fontSize: 17, fontWeight: '600' },
  encabezado: { gap: 4 },
  titulo: { fontSize: 30, fontWeight: '800', color: PALETA.moradoOscuro },
  subtitulo: { fontSize: 15, color: PALETA.textoSuave, lineHeight: 21 },

  seccion: {
    backgroundColor: PALETA.blanco,
    borderRadius: 22,
    padding: 16,
    gap: 12,
    shadowColor: PALETA.moradoOscuro,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  seccionEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  seccionTitulo: { fontSize: 17, fontWeight: '800', color: PALETA.moradoOscuro },

  pie: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: PALETA.crema,
    borderTopWidth: 1,
    borderTopColor: PALETA.lilaClaro,
  },
  boton: {
    backgroundColor: PALETA.morado,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: PALETA.morado,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  botonTexto: { color: PALETA.blanco, fontSize: 17, fontWeight: '800' },
  presionado: { opacity: 0.8 },
});
