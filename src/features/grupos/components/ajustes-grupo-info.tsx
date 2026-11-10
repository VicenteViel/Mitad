import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { PALETA } from '@/theme/tema';

import { editarGrupo } from '../api-ajustes';
import { useAccionGrupo } from '../use-ajustes';
import { LIMITES, validarNuevoGrupo } from '../validar-nuevo-grupo';
import { estilosAjustes as e } from './ajustes-estilos';

type Props = { grupoId: string; nombre: string; descripcion: string | null };

// Nombre y descripción del grupo (solo admins).
export function AjustesGrupoInfo({ grupoId, nombre: nombreActual, descripcion: descActual }: Props) {
  const [nombre, setNombre] = useState(nombreActual);
  const [descripcion, setDescripcion] = useState(descActual ?? '');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const guardar = useAccionGrupo(grupoId, (v: { nombre: string; descripcion: string }) =>
    editarGrupo(grupoId, v.nombre, v.descripcion),
  );

  const cambio = nombre.trim() !== nombreActual || descripcion.trim() !== (descActual ?? '');

  function onGuardar() {
    const errores = validarNuevoGrupo({ nombre, descripcion, nombreIntegrante: 'x' });
    const primero = errores.nombre ?? errores.descripcion ?? null;
    setErrorLocal(primero);
    if (primero) return;
    guardar.mutate({ nombre, descripcion });
  }

  return (
    <View style={e.seccion}>
      <Text style={e.titulo}>Grupo</Text>
      <Text style={e.label}>Nombre</Text>
      <TextInput
        style={e.input}
        value={nombre}
        onChangeText={setNombre}
        maxLength={LIMITES.nombre}
        accessibilityLabel="Nombre del grupo"
      />
      <Text style={e.label}>Descripción (opcional)</Text>
      <TextInput
        style={e.input}
        value={descripcion}
        onChangeText={setDescripcion}
        maxLength={LIMITES.descripcion}
        placeholder="Sin descripción"
        placeholderTextColor={PALETA.textoSuave}
        accessibilityLabel="Descripción del grupo"
      />
      {errorLocal && <Text style={e.error}>{errorLocal}</Text>}
      {guardar.isError && <Text style={e.error}>{guardar.error.message}</Text>}
      {guardar.isSuccess && !cambio && <Text style={e.ok}>Cambios guardados.</Text>}
      <Pressable
        onPress={onGuardar}
        disabled={!cambio || guardar.isPending}
        accessibilityRole="button"
        style={({ pressed }) => [e.boton, (!cambio || pressed) && e.presionado]}
      >
        {guardar.isPending ? (
          <ActivityIndicator color={PALETA.blanco} />
        ) : (
          <Text style={e.botonTexto}>Guardar</Text>
        )}
      </Pressable>
    </View>
  );
}
