import { StyleSheet, Text, View } from 'react-native';

import { PALETA } from '@/theme/tema';

import type { GrupoResumen } from '../api';

// Tarjeta de un grupo en Inicio: inicial del grupo, nombre, descripción y
// cantidad de integrantes.
export function TarjetaGrupo({ grupo }: { grupo: GrupoResumen }) {
  const inicial = grupo.nombre.trim().charAt(0).toUpperCase() || '?';
  const integrantes =
    grupo.cantidadIntegrantes === 1 ? '1 integrante' : `${grupo.cantidadIntegrantes} integrantes`;

  return (
    <View
      style={styles.tarjeta}
      accessible
      accessibilityLabel={`${grupo.nombre}, ${integrantes}`}
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
    </View>
  );
}

const styles = StyleSheet.create({
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
