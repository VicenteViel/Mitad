import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fechaLarga } from '@/features/gastos/fechas';
import { formatearPesos } from '@/features/gastos/validar-gasto';
import { PALETA } from '@/theme/tema';

import type { Vencido } from '../vencidos';

type Props = {
  vencidos: Vencido[];
  hoy: string;
  nombreRumi: (integranteId: string) => string;
  // Gasto por cubrir: abre el gasto para marcar la parte como pagada.
  onAbrirGasto: (gastoId: string) => void;
  // Deuda con un rumi: abre "Registrar pago" con el monto vencido.
  onPagar: (acreedorId: string, monto: number) => void;
};

// Avisos destacados de lo que tengo vencido en el grupo (decisión 52).
export function AvisosVencidos({ vencidos, hoy, nombreRumi, onAbrirGasto, onPagar }: Props) {
  if (vencidos.length === 0) return null;

  return (
    <View style={styles.tarjeta} accessibilityRole="alert">
      <View style={styles.encabezado}>
        <View style={styles.icono}>
          <Text style={styles.iconoTexto}>⏰</Text>
        </View>
        <View style={styles.encabezadoTextos}>
          <Text style={styles.titulo}>
            {vencidos.length === 1 ? 'Tienes un pago vencido' : `Tienes ${vencidos.length} pagos vencidos`}
          </Text>
          <Text style={styles.subtitulo}>Ya pasó la fecha límite.</Text>
        </View>
      </View>

      {vencidos.map((v) => {
        const clave = v.tipo === 'por-cubrir' ? v.gastoId : `deuda-${v.acreedorId}`;
        const que =
          v.tipo === 'por-cubrir'
            ? `Tu parte de ${v.descripcion}`
            : `Le debes a ${nombreRumi(v.acreedorId)}`;
        const detalle =
          v.tipo === 'por-cubrir'
            ? `Venció el ${fechaLarga(v.fechaLimite, hoy)}`
            : `${v.descripciones.join(', ')} · venció el ${fechaLarga(v.fechaLimite, hoy)}`;
        return (
          <View key={clave} style={styles.aviso}>
            <View style={styles.avisoTextos}>
              <Text style={styles.que} numberOfLines={2}>
                {que}
              </Text>
              <Text style={styles.detalle} numberOfLines={2}>
                {detalle}
              </Text>
            </View>
            <View style={styles.derecha}>
              <Text style={styles.monto}>{formatearPesos(v.monto)}</Text>
              <Pressable
                onPress={() =>
                  v.tipo === 'por-cubrir' ? onAbrirGasto(v.gastoId) : onPagar(v.acreedorId, v.monto)
                }
                accessibilityRole="button"
                accessibilityLabel={
                  v.tipo === 'por-cubrir'
                    ? `Ver ${v.descripcion} para marcar tu parte como pagada`
                    : `Registrar pago a ${nombreRumi(v.acreedorId)}`
                }
                style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
              >
                <Text style={styles.botonTexto}>{v.tipo === 'por-cubrir' ? 'Ya pagué' : 'Pagar'}</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const ROJO_CLARO = '#FDECEC';

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: PALETA.blanco,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: PALETA.error,
    padding: 16,
    gap: 10,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ROJO_CLARO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoTexto: { fontSize: 22 },
  encabezadoTextos: { flex: 1 },
  titulo: { fontSize: 17, fontWeight: '800', color: PALETA.error },
  subtitulo: { fontSize: 13, color: PALETA.textoSuave },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: ROJO_CLARO,
    borderRadius: 16,
    padding: 12,
  },
  avisoTextos: { flex: 1, gap: 2 },
  que: { fontSize: 15, fontWeight: '800', color: PALETA.moradoOscuro },
  detalle: { fontSize: 12, color: PALETA.textoSuave },
  derecha: { alignItems: 'flex-end', gap: 6 },
  monto: { fontSize: 16, fontWeight: '800', color: PALETA.error },
  boton: { backgroundColor: PALETA.error, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  botonTexto: { color: PALETA.blanco, fontSize: 13, fontWeight: '800' },
  presionado: { opacity: 0.8 },
});
