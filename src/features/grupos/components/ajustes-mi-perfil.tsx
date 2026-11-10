import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { actualizarAlias } from '@/features/invitaciones/api';
import { PALETA } from '@/theme/tema';

import type { Avatar, Color } from '../apariencia';
import type { IntegranteDetalle } from '../api';
import { cambiarApariencia } from '../api-ajustes';
import { useAccionGrupo } from '../use-ajustes';
import { LIMITES } from '../validar-nuevo-grupo';
import { estilosAjustes as e } from './ajustes-estilos';
import { SelectorAvatar } from './selector-avatar';
import { SelectorColor } from './selector-color';

type Props = { grupoId: string; yo: IntegranteDetalle };

// Cómo me ven en este grupo: ícono, color y apodo. El nombre lo pone el admin.
export function AjustesMiPerfil({ grupoId, yo }: Props) {
  const [avatar, setAvatar] = useState<Avatar>(yo.avatar);
  const [color, setColor] = useState<Color>(yo.color);
  const [alias, setAlias] = useState(yo.alias ?? '');
  const guardar = useAccionGrupo(grupoId, async () => {
    if (avatar !== yo.avatar || color !== yo.color) await cambiarApariencia(yo.id, avatar, color);
    if (alias.trim() !== (yo.alias ?? '')) await actualizarAlias(grupoId, alias);
  });

  const cambio =
    avatar !== yo.avatar || color !== yo.color || alias.trim() !== (yo.alias ?? '');

  return (
    <View style={e.seccion}>
      <Text style={e.titulo}>Tu perfil en este grupo</Text>
      <Text style={e.ayuda}>
        Tu nombre aquí es “{yo.nombre}”. Elige tu ícono, tu color y un apodo si quieres.
      </Text>
      <SelectorAvatar value={avatar} onChange={setAvatar} />
      <Text style={e.label}>Color</Text>
      <SelectorColor value={color} onChange={setColor} />
      <Text style={e.label}>Apodo (opcional)</Text>
      <TextInput
        style={e.input}
        value={alias}
        onChangeText={setAlias}
        maxLength={LIMITES.nombreIntegrante}
        placeholder="Cómo te dicen en la casa"
        placeholderTextColor={PALETA.textoSuave}
        accessibilityLabel="Apodo"
      />
      {guardar.isError && <Text style={e.error}>{guardar.error.message}</Text>}
      {guardar.isSuccess && !cambio && <Text style={e.ok}>Cambios guardados.</Text>}
      <Pressable
        onPress={() => guardar.mutate(undefined)}
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
