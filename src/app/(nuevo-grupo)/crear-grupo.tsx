import { router, useTheme } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { PantallaFormulario } from '@/components/pantalla-formulario';
import { useBorradorGrupo } from '@/features/grupos/borrador-grupo-context';
import { SelectorAvatar } from '@/features/grupos/components/selector-avatar';
import {
  LIMITES,
  validarNuevoGrupo,
  type ErroresNuevoGrupo,
} from '@/features/grupos/validar-nuevo-grupo';
import { PALETA } from '@/theme/tema';

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
    <PantallaFormulario>
      <Text style={[styles.title, { color: colors.primary }]}>Crear grupo</Text>

      <Text style={[styles.label, { color: colors.text }]}>Nombre del grupo</Text>
      <TextInput
        style={inputStyle}
        value={borrador.nombre}
        onChangeText={(nombre) => actualizarGrupo({ nombre })}
        placeholder="Depto Ñuñoa"
        placeholderTextColor={PALETA.textoSuave}
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
        placeholderTextColor={PALETA.textoSuave}
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
        placeholderTextColor={PALETA.textoSuave}
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
    </PantallaFormulario>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 16, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 18 },
  error: { color: PALETA.error, fontSize: 14 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
