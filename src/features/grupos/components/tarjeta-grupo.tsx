import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PALETA } from '@/theme/tema';

import type { GrupoResumen } from '../api';

// Tarjeta de un grupo en Inicio: inicial del grupo, nombre, descripción y
// cantidad de integrantes. Al tocarla se abre el grupo.
export function TarjetaGrupo({ grupo, onPress }: { grupo: GrupoResumen; onPress: () => void }) {
  const inicial = grupo.nombre.trim().charAt(0).toUpperCase() || '?';
  const integrantes =
    grupo.cantidadIntegrantes === 1 ? '1 integrante' : `${grupo.cantidadIntegrantes} integrantes`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tarjeta, pressed && styles.presionada]}
      accessibilityRole="button"
      accessibilityLabel={`${grupo.nombre}, ${integrantes}`}
      accessibilityHint="Abre el grupo"
    >
      <View style={styles.inicial}>
        <Text style={styles.inicialTexto}>{inicial}</Text>
      </View>
      <View style={styles.textos}>
        <Text style={styles.nombre} numberOfLines={1}>
          {grupo.nombre}
        </Text>
        {grupo.descripcion && (
          <Text style={styles.descripcion} numberOfLines={1}>
            {grupo.descripcion}
          </Text>
        )}
        <Text style={styles.integrantes}>{integrantes}</Text>
      </View>
      <Text style={styles.flecha}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  presionada: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: PALETA.blanco,
    borderRadius: 20,
    padding: 16,
    shadowColor: PALETA.moradoOscuro,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  inicial: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: PALETA.lilaClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicialTexto: { fontSize: 22, fontWeight: '800', color: PALETA.morado },
  textos: { flex: 1, gap: 2 },
  nombre: { fontSize: 17, fontWeight: '700', color: PALETA.moradoOscuro },
  descripcion: { fontSize: 14, color: PALETA.textoSuave },
  integrantes: { fontSize: 13, fontWeight: '600', color: PALETA.violeta, marginTop: 2 },
  flecha: { fontSize: 28, color: PALETA.borde, fontWeight: '300' },
});
