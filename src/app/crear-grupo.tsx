import { router, useTheme } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Avatar } from '@/features/grupos/apariencia';
import { SelectorAvatar } from '@/features/grupos/components/selector-avatar';
import { useCrearGrupo } from '@/features/grupos/use-crear-grupo';
import {
  LIMITES,
  validarNuevoGrupo,
  type ErroresNuevoGrupo,
} from '@/features/grupos/validar-nuevo-grupo';

export default function CrearGrupoScreen() {
  const { colors } = useTheme();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [nombreIntegrante, setNombreIntegrante] = useState('');
  const [avatar, setAvatar] = useState<Avatar>('hombre');
  const [errores, setErrores] = useState<ErroresNuevoGrupo>({});
  const { mutate, isPending, error } = useCrearGrupo();

  function crear() {
    const datos = { nombre, descripcion, nombreIntegrante, avatar };
    const nuevosErrores = validarNuevoGrupo(datos);
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    mutate(datos, {
      onSuccess: (grupoId) =>
        router.replace({ pathname: '/agregar-integrantes', params: { grupoId } }),
    });
  }

  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Crear grupo</Text>

      <Text style={[styles.label, { color: colors.text }]}>Nombre del grupo</Text>
      <TextInput
        style={inputStyle}
        value={nombre}
        onChangeText={setNombre}
        placeholder="Depto Ñuñoa"
        placeholderTextColor="#888"
        maxLength={LIMITES.nombre}
        accessibilityLabel="Nombre del grupo"
      />
      {errores.nombre && <Text style={styles.error}>{errores.nombre}</Text>}

      <Text style={[styles.label, { color: colors.text }]}>Descripción (opcional)</Text>
      <TextInput
        style={inputStyle}
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Gastos del depto"
        placeholderTextColor="#888"
        maxLength={LIMITES.descripcion}
        accessibilityLabel="Descripción del grupo"
      />
      {errores.descripcion && <Text style={styles.error}>{errores.descripcion}</Text>}

      <Text style={[styles.label, { color: colors.text }]}>Tu nombre en el grupo</Text>
      <TextInput
        style={inputStyle}
        value={nombreIntegrante}
        onChangeText={setNombreIntegrante}
        placeholder="Vicente"
        placeholderTextColor="#888"
        maxLength={LIMITES.nombreIntegrante}
        autoComplete="name"
        accessibilityLabel="Tu nombre en el grupo"
      />
      {errores.nombreIntegrante && <Text style={styles.error}>{errores.nombreIntegrante}</Text>}

      <Text style={[styles.label, { color: colors.text }]}>Tu ícono</Text>
      <SelectorAvatar value={avatar} onChange={setAvatar} />

      {error && <Text style={styles.error}>No pudimos crear el grupo. Intenta de nuevo.</Text>}

      <Pressable
        style={[styles.button, { backgroundColor: colors.primary, opacity: isPending ? 0.6 : 1 }]}
        onPress={crear}
        disabled={isPending}
        accessibilityRole="button"
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Crear grupo</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 32, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 16, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 18 },
  error: { color: '#D93025', fontSize: 14 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});