import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatearPesos } from '@/features/gastos/validar-gasto';
import { PALETA } from '@/theme/tema';

import type { RumiSaldo } from '../api';
import { puedeRegistrarPago } from '../permisos';
import type { Deuda, Saldos } from '../saldos';

type Props = {
  saldos: Saldos;
  rumis: RumiSaldo[];
  yo: RumiSaldo | undefined;
  onRegistrarPago: (deuda: Deuda) => void;
};

const VERDE = '#1E8E5A';

// Saldos del grupo: mi resumen ("Te deben" / "Debes" / "Al día") y quién le
// debe a quién, con "Registrar pago" donde corresponde.
export function TarjetaSaldos({ saldos, rumis, yo, onRegistrarPago }: Props) {
  const porId = new Map(rumis.map((r) => [r.id, r]));
  const nombre = (id: string) => {
    if (id === yo?.id) return 'Tú';
    return porId.get(id)?.nombre ?? 'Ex-rumi';
  };
  const miNeto = yo ? (saldos.netos.get(yo.id) ?? 0) : 0;

  let resumen = 'Estás al día';
  let colorResumen: string = PALETA.moradoOscuro;
  if (miNeto > 0) {
    resumen = `Te deben ${formatearPesos(miNeto)}`;
    colorResumen = VERDE;
  } else if (miNeto < 0) {
    resumen = `Debes ${formatearPesos(-miNeto)}`;
    colorResumen = PALETA.error;
  }

  // Primero las deudas donde participo.
  const deudas = [...saldos.deudas].sort((x, y) => {
    const mia = (d: Deuda) => (d.deudor === yo?.id || d.acreedor === yo?.id ? 0 : 1);
    return mia(x) - mia(y);
  });

  return (
    <View style={styles.tarjeta}>
      <Text style={styles.etiqueta}>Tu saldo</Text>
      <Text style={[styles.resumen, { color: colorResumen }]} accessibilityRole="header">
        {resumen}
      </Text>

      {deudas.length === 0 ? (
        <Text style={styles.alDia}>Nadie le debe a nadie. 🎉</Text>
      ) : (
        <View style={styles.lista}>
          {deudas.map((d) => {
            const deudor = porId.get(d.deudor);
            const acreedor = porId.get(d.acreedor);
            const puede =
              !!deudor && !!acreedor && puedeRegistrarPago(yo, deudor, acreedor);
            const mia = d.deudor === yo?.id || d.acreedor === yo?.id;
            return (
              <View key={`${d.deudor}-${d.acreedor}`} style={[styles.deuda, mia && styles.deudaMia]}>
                <View style={styles.deudaTextos}>
                  <Text style={styles.deudaNombres} numberOfLines={2}>
                    {nombre(d.deudor)} → {nombre(d.acreedor)}
                  </Text>
                  <Text style={styles.deudaMonto}>{formatearPesos(d.monto)}</Text>
                </View>
                {puede && (
                  <Pressable
                    onPress={() => onRegistrarPago(d)}
                    accessibilityRole="button"
                    accessibilityLabel={`Registrar pago de ${nombre(d.deudor)} a ${nombre(d.acreedor)}`}
                    hitSlop={6}
                    style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
                  >
                    <Text style={styles.botonTexto}>Registrar pago</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: PALETA.blanco,
    borderRadius: 20,
    padding: 18,
    gap: 6,
    shadowColor: PALETA.moradoOscuro,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  etiqueta: { fontSize: 13, fontWeight: '700', color: PALETA.textoSuave, textTransform: 'uppercase' },
  resumen: { fontSize: 26, fontWeight: '800' },
  alDia: { fontSize: 15, color: PALETA.textoSuave, marginTop: 4 },
  lista: { gap: 8, marginTop: 8 },
  deuda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: PALETA.crema,
  },
  deudaMia: { backgroundColor: PALETA.lilaClaro },
  deudaTextos: { flex: 1, gap: 2 },
  deudaNombres: { fontSize: 15, fontWeight: '600', color: PALETA.moradoOscuro },
  deudaMonto: { fontSize: 17, fontWeight: '800', color: PALETA.morado },
  boton: { backgroundColor: PALETA.morado, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  botonTexto: { color: PALETA.blanco, fontSize: 13, fontWeight: '700' },
  presionado: { opacity: 0.8 },
});
