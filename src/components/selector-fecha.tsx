import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { aTexto, celdasDelMes, leerFecha, moverMes, nombreMes } from '@/features/gastos/fechas';
import { PALETA } from '@/theme/tema';

type Props = {
  valor: string | null; // YYYY-MM-DD
  hoy: string;
  onCambiar: (fecha: string) => void;
};

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// Calendario mensual simple, con el mismo estilo en iOS y Android.
export function SelectorFecha({ valor, hoy, onCambiar }: Props) {
  const inicio = leerFecha(valor ?? hoy);
  const [vista, setVista] = useState({ anio: inicio.anio, mes: inicio.mes });
  const celdas = celdasDelMes(vista.anio, vista.mes);

  return (
    <View style={styles.calendario}>
      <View style={styles.encabezado}>
        <Pressable
          onPress={() => setVista(moverMes(vista.anio, vista.mes, -1))}
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          hitSlop={10}
          style={styles.flecha}
        >
          <Text style={styles.flechaTexto}>‹</Text>
        </Pressable>
        <Text style={styles.mes}>
          {nombreMes(vista.mes)} {vista.anio}
        </Text>
        <Pressable
          onPress={() => setVista(moverMes(vista.anio, vista.mes, 1))}
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          hitSlop={10}
          style={styles.flecha}
        >
          <Text style={styles.flechaTexto}>›</Text>
        </Pressable>
      </View>

      <View style={styles.grilla}>
        {DIAS_SEMANA.map((d, i) => (
          <Text key={`d${i}`} style={styles.diaSemana}>
            {d}
          </Text>
        ))}
        {celdas.map((dia, i) => {
          if (dia === null) return <View key={`v${i}`} style={styles.celda} />;
          const fecha = aTexto(vista.anio, vista.mes, dia);
          const elegido = fecha === valor;
          const esHoy = fecha === hoy;
          return (
            <Pressable
              key={fecha}
              onPress={() => onCambiar(fecha)}
              accessibilityRole="button"
              accessibilityState={{ selected: elegido }}
              accessibilityLabel={`${dia} de ${nombreMes(vista.mes)}${esHoy ? ', hoy' : ''}`}
              style={styles.celda}
            >
              <View style={[styles.dia, esHoy && styles.hoy, elegido && styles.elegido]}>
                <Text style={[styles.diaTexto, elegido && styles.elegidoTexto]}>{dia}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendario: { backgroundColor: PALETA.crema, borderRadius: 18, padding: 12, gap: 8 },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flecha: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PALETA.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flechaTexto: { fontSize: 22, fontWeight: '700', color: PALETA.morado, marginTop: -2 },
  mes: { fontSize: 16, fontWeight: '800', color: PALETA.moradoOscuro, textTransform: 'capitalize' },
  grilla: { flexDirection: 'row', flexWrap: 'wrap' },
  diaSemana: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: PALETA.textoSuave,
    paddingVertical: 4,
  },
  celda: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  dia: { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  hoy: { borderWidth: 1.5, borderColor: PALETA.violeta },
  elegido: { backgroundColor: PALETA.morado, borderColor: PALETA.morado },
  diaTexto: { fontSize: 15, fontWeight: '600', color: PALETA.moradoOscuro },
  elegidoTexto: { color: PALETA.blanco, fontWeight: '800' },
});
