import { router, useTheme } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useBorradorGrupo } from '@/features/grupos/borrador-grupo-context';
import { SelectorAvatar } from '@/features/grupos/components/selector-avatar';
import {
  LIMITES,
  validarNuevoGrupo,
  type ErroresNuevoGrupo,
} from '@/features/grupos/validar-nuevo-grupo';

export default function CrearGrupoScreen() {
  const { colors } = useTheme();
  const { borrador, actualizarGrupo, actualizarYo } = useBorradorGrupo();
  const [errores, setErrores] = useState<ErroresNuevoGrupo>({});

  // Todavía no se guarda nada: solo se valida y se avanza con el borrador.
  function continuar() {
    const nuevosErrores = validarNuevoGrupo({
      nombre: borrador.nombre,
      descripcion: borrador.descripcion,
      nombreIntegrante: borrador.yo.nombre,
    });
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    router.push('/cantidad-integrantes');
  }

  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Crear grupo</Text>

      <Text style={[styles.label, { color: colors.text }]}>Nombre del grupo</Text>
      <TextInput
        style={inputStyle}
        value={borrador.nombre}
        onChangeText={(nombre) => actualizarGrupo({ nombre })}
        placeholder="Depto Ñuñoa"
        placeholderTextColor="#888"
        maxLength={LIMITES.nombre}
        accessibilityLabel="Nombre del grupo"
      />
      {errores.nombre && <Text style={styles.error}>{errores.nombre}</Text>}

      <Text style={[styles.label, { color: colors.text }]}>Descripción (opcional)</Text>
      <TextInput
        style={inputStyle}
        value={borrador.descripcion}
        onChangeText={(descripcion) => actualizarGrupo({ descripcion })}
        placeholder="Gastos del depto"
        placeholderTextColor="#888"
        maxLength={LIMITES.descripcion}
        accessibilityLabel="Descripción del grupo"
      />
      {errores.descripcion && <Text style={styles.error}>{errores.descripcion}</Text>}

      <Text style={[styles.label, { color: colors.text }]}>Tu nombre en el grupo</Text>
      <TextInput
        style={inputStyle}
        value={borrador.yo.nombre}
        onChangeText={(nombre) => actualizarYo({ nombre })}
        placeholder="Vicente"
        placeholderTextColor="#888"
        maxLength={LIMITES.nombreIntegrante}
        autoComplete="name"
        accessibilityLabel="Tu nombre en el grupo"
      />
      {errores.nombreIntegrante && <Text style={styles.error}>{errores.nombreIntegrante}</Text>}

      <Text style={[styles.label, { color: colors.text }]}>Tu ícono</Text>
      <SelectorAvatar value={borrador.yo.avatar} onChange={(avatar) => actualizarYo({ avatar })} />

      <Pressable
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={continuar}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Continuar</Text>
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
