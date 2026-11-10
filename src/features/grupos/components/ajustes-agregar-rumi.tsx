import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { PALETA } from '@/theme/tema';

import type { Avatar } from '../apariencia';
import { agregarRumi } from '../api-ajustes';
import { useAccionGrupo } from '../use-ajustes';
import { validarIntegrantes } from '../validar-integrantes';
import { LIMITES } from '../validar-nuevo-grupo';
import { estilosAjustes as e } from './ajustes-estilos';
import { SelectorAvatar } from './selector-avatar';

// Agregar un rumi pendiente a un grupo que ya existe (solo admins). Después se
// le invita desde la pantalla del grupo.
export function AjustesAgregarRumi({ grupoId }: { grupoId: string }) {
  const [nombre, setNombre] = useState('');
  const [avatar, setAvatar] = useState<Avatar>('hombre');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const agregar = useAccionGrupo(grupoId, (v: { nombre: string; avatar: Avatar }) =>
    agregarRumi(grupoId, v.nombre, v.avatar),
  );

  function onAgregar() {
    const errores = validarIntegrantes([{ nombre }]);
    const error = errores.porFila[0] ?? null;
    setErrorLocal(error);
    if (error) return;
    agregar.mutate(
      { nombre, avatar },
      {
        onSuccess: () => {
          setNombre('');
          setAvatar('hombre');
        },
      },
    );
  }

  return (
    <View style={e.seccion}>
      <Text style={e.titulo}>Agregar rumi</Text>
      <Text style={e.ayuda}>
        Quedará pendiente hasta que acepte su invitación. Invítalo desde la pantalla del grupo.
      </Text>
      <TextInput
        style={e.input}
        value={nombre}
        onChangeText={setNombre}
        maxLength={LIMITES.nombreIntegrante}
        placeholder="Nombre"
        placeholderTextColor={PALETA.textoSuave}
        accessibilityLabel="Nombre del nuevo rumi"
      />
      <SelectorAvatar value={avatar} onChange={setAvatar} />
      {errorLocal && <Text style={e.error}>{errorLocal}</Text>}
      {agregar.isError && <Text style={e.error}>{agregar.error.message}</Text>}
      {agregar.isSuccess && !nombre && <Text style={e.ok}>Rumi agregado.</Text>}
      <Pressable
        onPress={onAgregar}
        disabled={agregar.isPending}
        accessibilityRole="button"
        style={({ pressed }) => [e.boton, pressed && e.presionado]}
      >
        {agregar.isPending ? (
          <ActivityIndicator color={PALETA.blanco} />
        ) : (
          <Text style={e.botonTexto}>+ Agregar rumi</Text>
        )}
      </Pressable>
    </View>
  );
}
