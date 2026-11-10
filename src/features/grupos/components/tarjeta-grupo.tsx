import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useVencidos } from '@/features/saldos/use-vencidos';
import { PALETA } from '@/theme/tema';

import type { GrupoResumen } from '../api';

// Tarjeta de un grupo en Inicio: inicial del grupo, nombre, descripción y
// cantidad de integrantes, y una etiqueta roja si tengo pagos vencidos ahí.
// Al tocarla se abre el grupo.
export function TarjetaGrupo({ grupo, onPress }: { grupo: GrupoResumen; onPress: () => void }) {
  const inicial = grupo.nombre.trim().charAt(0).toUpperCase() || '?';
  const integrantes =
    grupo.cantidadIntegrantes === 1 ? '1 rumi' : `${grupo.cantidadIntegrantes} rumis`;
  const vencidos = useVencidos(grupo.id).length;
  const textoVencidos = vencidos === 1 ? '1 pago vencido' : `${vencidos} pagos vencidos`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tarjeta, pressed && styles.presionada]}
      accessibilityRole="button"
      accessibilityLabel={`${grupo.nombre}, ${integrantes}${vencidos > 0 ? `, ${textoVencidos}` : ''}`}
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
        <View style={styles.pie}>
          <Text style={styles.integrantes}>{integrantes}</Text>
          {vencidos > 0 && <Text style={styles.vencidos}>⏰ {textoVencidos}</Text>}
        </View>
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
  pie: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  integrantes: { fontSize: 13, fontWeight: '600', color: PALETA.violeta },
  vencidos: {
    fontSize: 12,
    fontWeight: '800',
    color: PALETA.blanco,
    backgroundColor: PALETA.error,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  flecha: { fontSize: 28, color: PALETA.borde, fontWeight: '300' },
});
