import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { PantallaCompleta } from '@/components/pantalla-completa';
import { Segmento } from '@/components/segmento';
import { useSesion } from '@/features/auth/use-sesion';
import { hoyLocal } from '@/features/gastos/api';
import { fechaConDia } from '@/features/gastos/fechas';
import { useGastos } from '@/features/gastos/use-registrar-gasto';
import { formatearPesos } from '@/features/gastos/validar-gasto';
import { TarjetaMovimiento } from '@/features/saldos/components/tarjeta-movimiento';
import {
  agruparPorDia,
  filtrarMovimientos,
  type FiltroHistorial,
} from '@/features/saldos/historial-detallado';
import { ordenarMovimientos } from '@/features/saldos/movimientos';
import { usePagos, useRumisSaldo, useSaldos } from '@/features/saldos/use-saldos';
import { PALETA } from '@/theme/tema';

// Historial completo del grupo: cada gasto y pago, agrupados por día, con la
// hora exacta, quién lo registró, cómo se dividió y cuánto cambió mi saldo.
export default function HistorialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const grupoId = id ?? '';
  const { sesion } = useSesion();
  const gastos = useGastos(grupoId);
  const pagos = usePagos(grupoId);
  const rumis = useRumisSaldo(grupoId);
  const { saldos } = useSaldos(grupoId);
  const [filtro, setFiltro] = useState<FiltroHistorial>('todos');
  const [abierto, setAbierto] = useState<string | null>(null);
  const hoy = hoyLocal();

  const yo = rumis.data?.find((r) => r.usuarioId === sesion?.user.id)?.id;
  const nombre = (integranteId: string) =>
    rumis.data?.find((r) => r.id === integranteId)?.nombre ?? 'Ex-rumi';

  const cargando = gastos.isPending || pagos.isPending || rumis.isPending;
  const error = gastos.isError || pagos.isError || rumis.isError;
  const todos = gastos.data && pagos.data ? ordenarMovimientos(gastos.data, pagos.data) : [];
  const visibles = filtrarMovimientos(todos, filtro, yo);
  const dias = agruparPorDia(visibles);

  const totalGastos = (gastos.data ?? []).filter((g) => !g.eliminado).reduce((s, g) => s + g.monto, 0);
  const totalPagos = (pagos.data ?? []).filter((p) => !p.eliminado).reduce((s, p) => s + p.monto, 0);
  const miNeto = yo ? (saldos?.netos.get(yo) ?? 0) : 0;

  return (
    <PantallaCompleta
      titulo="Historial"
      subtitulo="Todos los gastos y pagos del grupo, con su fecha, hora y detalle. Toca uno para ver todo."
      volver="‹ Grupo"
    >
      {cargando && <ActivityIndicator color={PALETA.morado} style={styles.cargando} />}
      {error && (
        <Pressable
          onPress={() => {
            void gastos.refetch();
            void pagos.refetch();
            void rumis.refetch();
          }}
          accessibilityRole="button"
          style={styles.error}
        >
          <Text style={styles.errorTitulo}>No pudimos cargar el historial</Text>
          <Text style={styles.errorTexto}>Toca para intentar de nuevo.</Text>
        </Pressable>
      )}

      {!cargando && !error && (
        <>
          {/* Resumen */}
          <View style={styles.resumen}>
            <View style={[styles.burbuja]} />
            <View style={styles.resumenFila}>
              <Dato etiqueta="Gastos" valor={formatearPesos(totalGastos)} />
              <Dato etiqueta="Pagos entre rumis" valor={formatearPesos(totalPagos)} />
            </View>
            <View style={styles.resumenSeparador} />
            <Text style={styles.resumenEtiqueta}>Tu saldo hoy</Text>
            <Text style={styles.resumenSaldo}>
              {miNeto > 0
                ? `Te deben ${formatearPesos(miNeto)}`
                : miNeto < 0
                  ? `Debes ${formatearPesos(-miNeto)}`
                  : 'Estás al día'}
            </Text>
            <Text style={styles.resumenAyuda}>
              En cada movimiento, “+” es a tu favor y “−” es lo que pasas a deber.
            </Text>
          </View>

          <Segmento
            valor={filtro}
            onCambiar={(f) => {
              setFiltro(f);
              setAbierto(null);
            }}
            opciones={[
              { valor: 'todos', texto: 'Todos' },
              { valor: 'gastos', texto: 'Gastos' },
              { valor: 'pagos', texto: 'Pagos' },
              { valor: 'mios', texto: 'Míos' },
            ]}
          />

          <Text style={styles.conteo}>
            {visibles.length === 1 ? '1 movimiento' : `${visibles.length} movimientos`}
          </Text>

          {dias.length === 0 && (
            <View style={styles.vacio}>
              <Text style={styles.vacioTitulo}>Nada por aquí</Text>
              <Text style={styles.vacioTexto}>
                {filtro === 'todos'
                  ? 'Cuando registren gastos o pagos, aparecerán aquí.'
                  : 'No hay movimientos con este filtro.'}
              </Text>
            </View>
          )}

          {dias.map((dia) => (
            <View key={dia.fecha} style={styles.dia}>
              <Text style={styles.diaTitulo}>{fechaConDia(dia.fecha, hoy)}</Text>
              {dia.movimientos.map((m) => (
                <TarjetaMovimiento
                  key={`${m.tipo}-${m.id}`}
                  movimiento={m}
                  yo={yo}
                  hoy={hoy}
                  nombre={nombre}
                  abierto={abierto === m.id}
                  onAlternar={() => setAbierto((actual) => (actual === m.id ? null : m.id))}
                  onAbrirDetalle={() =>
                    router.push(
                      (m.tipo === 'gasto'
                        ? `/grupo/${grupoId}/gasto/${m.id}`
                        : `/grupo/${grupoId}/pago/${m.id}`) as Href,
                    )
                  }
                />
              ))}
            </View>
          ))}
        </>
      )}
    </PantallaCompleta>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.resumenEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cargando: { marginVertical: 40 },
  error: { backgroundColor: PALETA.blanco, borderRadius: 20, padding: 16, gap: 4 },
  errorTitulo: { fontSize: 16, fontWeight: '700', color: PALETA.error },
  errorTexto: { fontSize: 14, color: PALETA.textoSuave },

  resumen: {
    backgroundColor: PALETA.morado,
    borderRadius: 26,
    padding: 20,
    gap: 4,
    overflow: 'hidden',
  },
  burbuja: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 999,
    top: -90,
    right: -60,
    backgroundColor: PALETA.violeta,
    opacity: 0.5,
  },
  resumenFila: { flexDirection: 'row', gap: 12 },
  dato: { flex: 1, gap: 2 },
  datoValor: { color: PALETA.blanco, fontSize: 20, fontWeight: '800' },
  resumenSeparador: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 10 },
  resumenEtiqueta: { color: PALETA.lilaClaro, fontSize: 13, fontWeight: '700' },
  resumenSaldo: { color: PALETA.blanco, fontSize: 24, fontWeight: '800' },
  resumenAyuda: { color: PALETA.lilaClaro, fontSize: 12, marginTop: 4, lineHeight: 17 },

  conteo: { fontSize: 13, fontWeight: '700', color: PALETA.textoSuave },
  dia: { gap: 8 },
  diaTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETA.moradoOscuro,
    textTransform: 'capitalize',
    marginTop: 4,
  },
  vacio: {
    gap: 4,
    padding: 18,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: PALETA.borde,
  },
  vacioTitulo: { fontSize: 16, fontWeight: '700', color: PALETA.moradoOscuro },
  vacioTexto: { fontSize: 14, color: PALETA.textoSuave, lineHeight: 20 },
});
