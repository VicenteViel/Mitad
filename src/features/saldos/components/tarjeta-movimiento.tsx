import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fechaCorta, fechaLarga, fechaYHora } from '@/features/gastos/fechas';
import { etiquetaCategoria, iconoCategoria } from '@/features/gastos/historial';
import { formatearPesos } from '@/features/gastos/validar-gasto';
import { PALETA } from '@/theme/tema';

import { codigoMovimiento, efectoEnMiSaldo } from '../historial-detallado';
import type { Movimiento } from '../movimientos';

type Props = {
  movimiento: Movimiento;
  yo: string | undefined;
  hoy: string;
  nombre: (integranteId: string) => string;
  abierto: boolean;
  onAlternar: () => void;
  onAbrirDetalle: () => void;
};

const VERDE = '#1E8E5A';

// Un movimiento del historial completo. Cerrado: qué fue, cuándo, quién y
// cuánto cambió mi saldo. Abierto: todo el detalle (división, quién registró,
// ediciones, código) para no confundir un movimiento con otro.
export function TarjetaMovimiento({ movimiento: m, yo, hoy, nombre, abierto, onAlternar, onAbrirDetalle }: Props) {
  const efecto = efectoEnMiSaldo(m, yo);
  const eliminado = m.tipo === 'gasto' ? m.gasto.eliminado : m.pago.eliminado;
  const quien = (id: string) => (id === yo ? 'Tú' : nombre(id));

  const titulo =
    m.tipo === 'gasto' ? m.gasto.descripcion : `${quien(m.pago.de)} → ${quien(m.pago.a)}`;
  const icono = m.tipo === 'gasto' ? iconoCategoria(m.gasto.categoria) : '💸';
  const monto = m.tipo === 'gasto' ? m.gasto.monto : m.pago.monto;
  const registradoPor = m.tipo === 'gasto' ? m.gasto.creadoPorId : m.pago.declaradaPor;
  const editadoEn = m.tipo === 'gasto' ? m.gasto.editadoEn : m.pago.editadoEn;
  const editadoPor = m.tipo === 'gasto' ? m.gasto.editadoPorId : m.pago.editadoPor;
  const eliminadoPor = m.tipo === 'gasto' ? m.gasto.eliminadoPorId : m.pago.eliminadoPor;
  const porCubrir = m.tipo === 'gasto' && m.gasto.pagadoPorId === null;

  const subtitulo =
    m.tipo === 'gasto'
      ? porCubrir
        ? `Por cubrir · ${fechaYHora(m.creadoEn, hoy)}`
        : `Pagó ${quien(m.gasto.pagadoPorId ?? '')} · ${fechaYHora(m.creadoEn, hoy)}`
      : `Pago entre rumis · ${fechaYHora(m.creadoEn, hoy)}`;

  const etiquetas: { texto: string; tono: 'normal' | 'alerta' | 'ok' }[] = [];
  if (eliminado) etiquetas.push({ texto: 'Eliminado', tono: 'alerta' });
  if (editadoEn && !eliminado) etiquetas.push({ texto: 'Editado', tono: 'normal' });
  if (m.tipo === 'gasto' && !eliminado) {
    if (m.gasto.mensual) etiquetas.push({ texto: '🔁 Mensual', tono: 'normal' });
    if (porCubrir) {
      const pagadas = m.gasto.participaciones.filter((p) => p.pagada).length;
      etiquetas.push({
        texto: `${pagadas}/${m.gasto.participaciones.length} partes pagadas`,
        tono: pagadas === m.gasto.participaciones.length ? 'ok' : 'normal',
      });
    }
    if (m.gasto.fechaLimite) {
      const vencido = m.gasto.fechaLimite < hoy;
      etiquetas.push({
        texto: `${vencido ? 'Venció' : 'Vence'} ${fechaCorta(m.gasto.fechaLimite, hoy)}`,
        tono: vencido ? 'alerta' : 'normal',
      });
    }
  }

  const textoEfecto =
    efecto === null
      ? null
      : efecto > 0
        ? `+${formatearPesos(efecto)}`
        : efecto < 0
          ? `−${formatearPesos(-efecto)}`
          : 'Sin cambio';

  return (
    <View style={[styles.tarjeta, eliminado && styles.eliminada]}>
      <Pressable
        onPress={onAlternar}
        accessibilityRole="button"
        accessibilityState={{ expanded: abierto }}
        accessibilityLabel={[
          titulo,
          formatearPesos(monto),
          subtitulo,
          textoEfecto && `tu saldo ${textoEfecto}`,
          ...etiquetas.map((e) => e.texto),
        ]
          .filter(Boolean)
          .join(', ')}
        accessibilityHint={abierto ? 'Oculta el detalle' : 'Muestra el detalle'}
        style={({ pressed }) => [styles.cabecera, pressed && styles.presionada]}
      >
        <View style={[styles.icono, m.tipo === 'pago' && styles.iconoPago]}>
          <Text style={styles.iconoTexto}>{icono}</Text>
        </View>
        <View style={styles.textos}>
          <Text style={[styles.titulo, eliminado && styles.tachado]} numberOfLines={abierto ? 3 : 1}>
            {titulo}
          </Text>
          <Text style={styles.subtitulo} numberOfLines={1}>
            {subtitulo}
          </Text>
        </View>
        <View style={styles.montos}>
          <Text style={[styles.monto, eliminado && styles.tachado]}>{formatearPesos(monto)}</Text>
          {textoEfecto && (
            <Text
              style={[
                styles.efecto,
                efecto !== null && efecto > 0 && styles.efectoPositivo,
                efecto !== null && efecto < 0 && styles.efectoNegativo,
              ]}
            >
              {textoEfecto}
            </Text>
          )}
        </View>
      </Pressable>

      {etiquetas.length > 0 && (
        <View style={styles.etiquetas}>
          {etiquetas.map((e) => (
            <Text
              key={e.texto}
              style={[styles.etiqueta, e.tono === 'alerta' && styles.etiquetaAlerta, e.tono === 'ok' && styles.etiquetaOk]}
            >
              {e.texto}
            </Text>
          ))}
        </View>
      )}

      {abierto && (
        <View style={styles.detalle}>
          {m.tipo === 'gasto' ? (
            <>
              <Dato etiqueta="Categoría" valor={etiquetaCategoria(m.gasto.categoria)} />
              <Dato etiqueta="Fecha del gasto" valor={fechaLarga(m.gasto.fecha, hoy)} />
              <Dato
                etiqueta="Pagó"
                valor={porCubrir ? 'Nadie aún (cada uno paga su parte)' : quien(m.gasto.pagadoPorId ?? '')}
              />
              {m.gasto.fechaLimite && (
                <Dato etiqueta="Fecha límite" valor={fechaLarga(m.gasto.fechaLimite, hoy)} />
              )}
              <Text style={styles.subtituloDetalle}>Cómo se dividió</Text>
              {m.gasto.participaciones.map((p) => (
                <View key={p.integranteId} style={styles.parte}>
                  <Text style={styles.parteNombre} numberOfLines={1}>
                    {quien(p.integranteId)}
                    {porCubrir && (
                      <Text style={p.pagada ? styles.partePagada : styles.partePendiente}>
                        {p.pagada ? '  ✓ pagada' : '  pendiente'}
                      </Text>
                    )}
                  </Text>
                  <Text style={styles.parteMonto}>{formatearPesos(p.monto)}</Text>
                </View>
              ))}
            </>
          ) : (
            <>
              <Dato etiqueta="Pagó" valor={quien(m.pago.de)} />
              <Dato etiqueta="Recibió" valor={quien(m.pago.a)} />
              <Dato etiqueta="Fecha del pago" valor={fechaLarga(m.pago.fecha, hoy)} />
            </>
          )}

          <View style={styles.separador} />
          <Dato etiqueta="Registrado" valor={`${fechaYHora(m.creadoEn, hoy)} por ${quien(registradoPor)}`} />
          {editadoEn && (
            <Dato
              etiqueta="Última edición"
              valor={`${fechaYHora(editadoEn, hoy)}${editadoPor ? ` por ${quien(editadoPor)}` : ''}`}
            />
          )}
          {eliminado && <Dato etiqueta="Eliminado por" valor={eliminadoPor ? quien(eliminadoPor) : 'un admin'} />}
          {efecto !== null && (
            <Dato
              etiqueta="Efecto en tu saldo"
              valor={
                efecto > 0
                  ? `${formatearPesos(efecto)} a tu favor`
                  : efecto < 0
                    ? `debes ${formatearPesos(-efecto)} más`
                    : 'ninguno'
              }
            />
          )}
          <Dato etiqueta="Código" valor={codigoMovimiento(m.id)} />

          <Pressable
            onPress={onAbrirDetalle}
            accessibilityRole="button"
            style={({ pressed }) => [styles.boton, pressed && styles.presionada]}
          >
            <Text style={styles.botonTexto}>
              {m.tipo === 'gasto' ? 'Abrir gasto y comprobantes' : 'Abrir pago y comprobantes'} ›
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: PALETA.blanco,
    borderRadius: 20,
    padding: 12,
    gap: 8,
    shadowColor: PALETA.moradoOscuro,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  eliminada: { opacity: 0.65 },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14 },
  presionada: { opacity: 0.75 },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: PALETA.lilaClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoPago: { backgroundColor: '#E3F4EA' },
  iconoTexto: { fontSize: 22 },
  textos: { flex: 1, gap: 2 },
  titulo: { fontSize: 16, fontWeight: '700', color: PALETA.moradoOscuro },
  subtitulo: { fontSize: 12, color: PALETA.textoSuave },
  tachado: { textDecorationLine: 'line-through' },
  montos: { alignItems: 'flex-end', gap: 2 },
  monto: { fontSize: 16, fontWeight: '800', color: PALETA.moradoOscuro },
  efecto: { fontSize: 12, fontWeight: '800', color: PALETA.textoSuave },
  efectoPositivo: { color: VERDE },
  efectoNegativo: { color: PALETA.error },

  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingLeft: 56 },
  etiqueta: {
    fontSize: 11,
    fontWeight: '800',
    color: PALETA.morado,
    backgroundColor: PALETA.lilaClaro,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  etiquetaAlerta: { color: PALETA.blanco, backgroundColor: PALETA.error },
  etiquetaOk: { color: VERDE, backgroundColor: '#E3F5EA' },

  detalle: { backgroundColor: PALETA.crema, borderRadius: 14, padding: 12, gap: 8 },
  dato: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  datoEtiqueta: { fontSize: 13, color: PALETA.textoSuave },
  datoValor: { flexShrink: 1, fontSize: 13, fontWeight: '700', color: PALETA.moradoOscuro, textAlign: 'right' },
  subtituloDetalle: { fontSize: 13, fontWeight: '800', color: PALETA.moradoOscuro, marginTop: 4 },
  parte: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingLeft: 8 },
  parteNombre: { flexShrink: 1, fontSize: 13, color: PALETA.moradoOscuro },
  partePagada: { color: VERDE, fontWeight: '700' },
  partePendiente: { color: PALETA.textoSuave },
  parteMonto: { fontSize: 13, fontWeight: '700', color: PALETA.moradoOscuro },
  separador: { height: 1, backgroundColor: PALETA.borde, marginVertical: 2 },
  boton: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PALETA.violeta,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: PALETA.blanco,
  },
  botonTexto: { color: PALETA.morado, fontSize: 14, fontWeight: '800' },
});
