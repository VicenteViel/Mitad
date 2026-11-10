import { router, useTheme } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { PantallaFormulario } from '@/components/pantalla-formulario';
import { useBorradorGrupo } from '@/features/grupos/borrador-grupo-context';
import { FilaIntegrante } from '@/features/grupos/components/fila-integrante';
import { useIniciarGrupo } from '@/features/grupos/use-iniciar-grupo';
import {
  hayErrores,
  MAX_INTEGRANTES_POR_VEZ,
  validarIntegrantes,
  type ErroresIntegrantes,
} from '@/features/grupos/validar-integrantes';
import {
  LIMITES,
  validarNuevoGrupo,
  type ErroresNuevoGrupo,
} from '@/features/grupos/validar-nuevo-grupo';
import { PALETA } from '@/theme/tema';

export default function ResumenGrupoScreen() {
  const { colors } = useTheme();
  const {
    borrador,
    actualizarGrupo,
    actualizarYo,
    actualizarIntegrante,
    agregarIntegrante,
    quitarIntegrante,
  } = useBorradorGrupo();
  const [erroresGrupo, setErroresGrupo] = useState<ErroresNuevoGrupo>({});
  const [erroresIntegrantes, setErroresIntegrantes] = useState<ErroresIntegrantes>({
    porFila: {},
  });
  const { mutate, isPending, error } = useIniciarGrupo();

  // Aquí recién se guarda: una sola llamada crea el grupo completo.
  function iniciar() {
    const nuevosErroresGrupo = validarNuevoGrupo({
      nombre: borrador.nombre,
      descripcion: borrador.descripcion,
      nombreIntegrante: borrador.yo.nombre,
    });
    const nuevosErroresIntegrantes = validarIntegrantes(borrador.integrantes);
    setErroresGrupo(nuevosErroresGrupo);
    setErroresIntegrantes(nuevosErroresIntegrantes);
    if (Object.keys(nuevosErroresGrupo).length > 0 || hayErrores(nuevosErroresIntegrantes)) return;

    mutate(borrador, { onSuccess: () => router.dismissTo('/') });
  }

  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border }];
  const total = borrador.integrantes.length + 1;

  return (
    <PantallaFormulario>
      <Text style={[styles.title, { color: colors.primary }]}>Resumen</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Revisa y corrige lo que necesites antes de iniciar el grupo.
      </Text>

      <Text style={[styles.seccion, { color: colors.text }]}>Grupo</Text>
      <TextInput
        style={inputStyle}
        value={borrador.nombre}
        onChangeText={(nombre) => actualizarGrupo({ nombre })}
        placeholder="Nombre del grupo"
        placeholderTextColor={PALETA.textoSuave}
        maxLength={LIMITES.nombre}
        accessibilityLabel="Nombre del grupo"
      />
      {erroresGrupo.nombre && <Text style={styles.error}>{erroresGrupo.nombre}</Text>}
      <TextInput
        style={inputStyle}
        value={borrador.descripcion}
        onChangeText={(descripcion) => actualizarGrupo({ descripcion })}
        placeholder="Descripción (opcional)"
        placeholderTextColor={PALETA.textoSuave}
        maxLength={LIMITES.descripcion}
        accessibilityLabel="Descripción del grupo"
      />
      {erroresGrupo.descripcion && <Text style={styles.error}>{erroresGrupo.descripcion}</Text>}

      <Text style={[styles.seccion, { color: colors.text }]}>Integrantes ({total})</Text>
      <FilaIntegrante
        integrante={borrador.yo}
        etiqueta="Tú · admin"
        error={erroresGrupo.nombreIntegrante}
        onChange={actualizarYo}
      />
      {borrador.integrantes.map((integrante, i) => (
        <FilaIntegrante
          key={i}
          integrante={integrante}
          etiqueta="Pendiente"
          error={erroresIntegrantes.porFila[i]}
          onChange={(cambios) => actualizarIntegrante(i, cambios)}
          onQuitar={() => quitarIntegrante(i)}
        />
      ))}

      {borrador.integrantes.length < MAX_INTEGRANTES_POR_VEZ && (
        <Pressable onPress={agregarIntegrante} accessibilityRole="button" style={styles.agregar}>
          <Text style={[styles.link, { color: colors.primary }]}>+ Agregar integrante</Text>
        </Pressable>
      )}

      {erroresIntegrantes.general && (
        <Text style={styles.error}>{erroresIntegrantes.general}</Text>
      )}
      {error && <Text style={styles.error}>No pudimos iniciar el grupo. Intenta de nuevo.</Text>}

      <Pressable
        style={[styles.button, { backgroundColor: colors.primary, opacity: isPending ? 0.6 : 1 }]}
        onPress={iniciar}
        disabled={isPending}
        accessibilityRole="button"
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Iniciar grupo</Text>
        )}
      </Pressable>
    </PantallaFormulario>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, opacity: 0.6, textAlign: 'center' },
  seccion: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 18 },
  error: { color: PALETA.error, fontSize: 14 },
  agregar: { paddingVertical: 8 },
  link: { textAlign: 'center', fontSize: 16 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
