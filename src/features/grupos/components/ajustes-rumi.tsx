import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PALETA } from '@/theme/tema';

import type { AccionesRumi } from '../acciones-rumi';
import { COLORES, type Avatar, type Color } from '../apariencia';
import type { IntegranteDetalle } from '../api';
import { cambiarApariencia, cambiarRol, quitarIntegrante } from '../api-ajustes';
import { useAccionGrupo } from '../use-ajustes';
import { estilosAjustes as e } from './ajustes-estilos';
import { SelectorAvatar } from './selector-avatar';
import { SelectorColor } from './selector-color';

type Props = {
  grupoId: string;
  rumi: IntegranteDetalle;
  esYo: boolean;
  acciones: AccionesRumi;
};

type Accion =
  | { tipo: 'rol'; rol: 'admin' | 'integrante' }
  | { tipo: 'quitar' }
  | { tipo: 'apariencia'; avatar: Avatar; color: Color };

// Un rumi en Ajustes. Al tocarlo se despliegan las acciones que corresponden.
export function AjustesRumi({ grupoId, rumi, esYo, acciones }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [avatar, setAvatar] = useState<Avatar>(rumi.avatar);
  const [color, setColor] = useState<Color>(rumi.color);
  const accion = useAccionGrupo(grupoId, async (a: Accion) => {
    if (a.tipo === 'rol') await cambiarRol(rumi.id, a.rol);
    else if (a.tipo === 'quitar') await quitarIntegrante(rumi.id);
    else await cambiarApariencia(rumi.id, a.avatar, a.color);
  });

  const pendiente = rumi.usuarioId === null;
  // Mi propia apariencia se cambia en "Tu perfil"; aquí, solo la de pendientes.
  const apariencia = acciones.cambiarApariencia && !esYo;
  const hayAcciones =
    acciones.hacerAdmin || acciones.quitarAdmin || acciones.quitarDelGrupo || apariencia;

  function confirmarQuitar() {
    Alert.alert(
      `¿Quitar a ${rumi.nombre} del grupo?`,
      pendiente
        ? 'Su invitación dejará de servir. Sus gastos y su saldo se conservan en el historial.'
        : 'Perderá el acceso al grupo. Sus gastos y su saldo se conservan en el historial.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Quitar', style: 'destructive', onPress: () => accion.mutate({ tipo: 'quitar' }) },
      ],
    );
  }

  return (
    <View style={styles.contenedor}>
      <Pressable
        onPress={() => hayAcciones && setAbierto((a) => !a)}
        disabled={!hayAcciones}
        accessibilityRole={hayAcciones ? 'button' : undefined}
        accessibilityState={hayAcciones ? { expanded: abierto } : undefined}
        accessibilityLabel={`${rumi.nombre}${esYo ? ', tú' : ''}${rumi.rol === 'admin' ? ', admin' : ''}${pendiente ? ', pendiente' : ''}`}
        style={styles.fila}
      >
        <View style={[styles.circulo, { backgroundColor: COLORES[rumi.color] }, pendiente && styles.atenuado]}>
          <Text style={styles.inicial}>{rumi.nombre.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.textos}>
          <Text style={styles.nombre} numberOfLines={1}>
            {rumi.nombre}
            {esYo && <Text style={styles.suave}> (tú)</Text>}
          </Text>
          <Text style={styles.suave}>
            {rumi.rol === 'admin' ? 'Admin' : pendiente ? 'Pendiente' : 'Rumi'}
          </Text>
        </View>
        {accion.isPending && <ActivityIndicator color={PALETA.morado} />}
        {hayAcciones && !accion.isPending && <Text style={styles.flecha}>{abierto ? '▲' : '▼'}</Text>}
      </Pressable>

      {abierto && (
        <View style={styles.acciones}>
          {acciones.hacerAdmin && (
            <Pressable
              onPress={() => accion.mutate({ tipo: 'rol', rol: 'admin' })}
              accessibilityRole="button"
              style={({ pressed }) => [e.botonSecundario, pressed && e.presionado]}
            >
              <Text style={e.botonSecundarioTexto}>Hacer admin</Text>
            </Pressable>
          )}
          {acciones.quitarAdmin && (
            <Pressable
              onPress={() => accion.mutate({ tipo: 'rol', rol: 'integrante' })}
              accessibilityRole="button"
              style={({ pressed }) => [e.botonSecundario, pressed && e.presionado]}
            >
              <Text style={e.botonSecundarioTexto}>Quitar rol de admin</Text>
            </Pressable>
          )}
          {apariencia && (
            <View style={styles.apariencia}>
              <SelectorAvatar compacto value={avatar} onChange={setAvatar} />
              <SelectorColor value={color} onChange={setColor} />
              <Pressable
                onPress={() => accion.mutate({ tipo: 'apariencia', avatar, color })}
                accessibilityRole="button"
                style={({ pressed }) => [e.botonSecundario, pressed && e.presionado]}
              >
                <Text style={e.botonSecundarioTexto}>Guardar apariencia</Text>
              </Pressable>
            </View>
          )}
          {acciones.quitarDelGrupo && (
            <Pressable
              onPress={confirmarQuitar}
              accessibilityRole="button"
              style={({ pressed }) => [e.botonPeligro, pressed && e.presionado]}
            >
              <Text style={e.botonPeligroTexto}>Quitar del grupo</Text>
            </Pressable>
          )}
          {accion.isError && <Text style={e.error}>{accion.error.message}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { paddingVertical: 6 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  circulo: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  atenuado: { opacity: 0.55 },
  inicial: { color: PALETA.blanco, fontSize: 17, fontWeight: '800' },
  textos: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: '700', color: PALETA.moradoOscuro },
  suave: { fontSize: 13, color: PALETA.textoSuave, fontWeight: '400' },
  flecha: { fontSize: 12, color: PALETA.textoSuave },
  acciones: { gap: 8, paddingLeft: 52, paddingTop: 6, paddingBottom: 4 },
  apariencia: { gap: 8 },
});
