import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BotonPrincipal, PantallaCompleta, SeccionFormulario } from '@/components/pantalla-completa';
import { SelectorFecha } from '@/components/selector-fecha';
import { CirculoRumi, SelectorRumi } from '@/components/selector-rumi';
import { TarjetaMonto } from '@/components/tarjeta-monto';
import { hoyLocal, nuevaClaveIdempotencia } from '@/features/gastos/api';
import { dividirEquitativo, type Participacion } from '@/features/gastos/division';
import type { DatosIntegrantesGasto } from '@/features/gastos/api';
import type { GastoDetalle } from '@/features/gastos/api-detalle';
import { fechaLarga, primerVencimientoMensual } from '@/features/gastos/fechas';
import { iconoCategoria } from '@/features/gastos/historial';
import { useDetalleGasto, useEditarGasto } from '@/features/gastos/use-detalle-gasto';
import {
  useCrearGastoMensual,
  useIntegrantesGasto,
  useRegistrarGasto,
} from '@/features/gastos/use-registrar-gasto';
import {
  CATEGORIAS,
  formatearEntradaMonto,
  formatearPesos,
  leerMonto,
  LIMITE_DESCRIPCION,
  validarGasto,
  type Categoria,
  type ErroresGasto,
  type TipoDivision,
} from '@/features/gastos/validar-gasto';
import { SIMULAR_GUARDADO } from '@/lib/desarrollo';
import { PALETA } from '@/theme/tema';

// Nuevo gasto, o editar uno existente con ?editar=<gastoId> (solo admins).
export default function NuevoGastoScreen() {
  const { id: grupoId, editar } = useLocalSearchParams<{ id: string; editar?: string }>();
  const integrantes = useIntegrantesGasto(grupoId);
  const original = useDetalleGasto(editar ?? '');
  const titulo = editar ? 'Editar gasto' : 'Nuevo gasto';

  const cargando = integrantes.isLoading || (!!editar && original.isLoading);
  if (cargando) {
    return (
      <PantallaCompleta titulo={titulo} volver="‹ Grupo">
        <ActivityIndicator color={PALETA.morado} style={styles.cargando} />
      </PantallaCompleta>
    );
  }
  if (integrantes.error || !integrantes.data || (editar && !original.data)) {
    return (
      <PantallaCompleta titulo={titulo} volver="‹ Grupo">
        <Text style={styles.errorGeneral}>No pudimos cargar el grupo. Vuelve a intentarlo.</Text>
      </PantallaCompleta>
    );
  }

  return (
    <FormularioGasto
      grupoId={grupoId}
      datos={integrantes.data}
      original={editar ? original.data : undefined}
    />
  );
}

type FormularioProps = {
  grupoId: string;
  datos: DatosIntegrantesGasto;
  original?: GastoDetalle;
};

function FormularioGasto({ grupoId, datos: data, original }: FormularioProps) {
  const registrar = useRegistrarGasto();
  const editarGasto = useEditarGasto();
  const crearMensual = useCrearGastoMensual();
  const hoy = hoyLocal();

  // Decisiones 48 a 53: un gasto puede estar "por cubrir" (nadie lo pagó aún),
  // tener fecha límite, o repetirse cada mes. Lo por cubrir y lo mensual, solo admins.
  const [porCubrir, setPorCubrir] = useState(!!original && original.pagadoPorId === null);
  const [modoFecha, setModoFecha] = useState<ModoFecha>(original?.fechaLimite ? 'fecha' : 'sin');
  const [fechaLimite, setFechaLimite] = useState<string | null>(original?.fechaLimite ?? null);
  const [diaMensual, setDiaMensual] = useState(5);

  const mutacion = original ? editarGasto : modoFecha === 'mensual' ? crearMensual : registrar;
  const { isPending, error } = mutacion;

  const personalizada = original?.tipoDivision === 'personalizada';
  const [descripcion, setDescripcion] = useState(original?.descripcion ?? '');
  const [monto, setMonto] = useState(original ? formatearPesos(original.monto).slice(1) : '');
  const [categoria, setCategoria] = useState<Categoria>(original?.categoria ?? 'otros');
  const [pagadoPorElegido, setPagadoPor] = useState<string | null>(original?.pagadoPorId ?? null);
  // Se guardan los desmarcados: así todos parten marcados (regla 34). Al
  // editar, parten desmarcados quienes no estaban en el gasto.
  const [desmarcados, setDesmarcados] = useState<Set<string>>(() => {
    if (!original) return new Set();
    const participan = new Set(original.participaciones.map((p) => p.integranteId));
    return new Set(data.integrantes.filter((i) => !participan.has(i.id)).map((i) => i.id));
  });
  const [tipoDivision, setTipoDivision] = useState<TipoDivision>(
    original?.tipoDivision ?? 'equitativa',
  );
  const [montosPersonalizados, setMontosPersonalizados] = useState<Record<string, string>>(() =>
    personalizada && original
      ? Object.fromEntries(
          original.participaciones.map((p) => [p.integranteId, formatearPesos(p.monto).slice(1)]),
        )
      : {},
  );
  const [errores, setErrores] = useState<ErroresGasto>({});
  const [errorFecha, setErrorFecha] = useState<string | null>(null);
  // Una clave por formulario: si "Guardar" se toca de nuevo tras un error de
  // red, el servidor reconoce el reintento y no duplica el gasto.
  const [clave] = useState(nuevaClaveIdempotencia);

  const { integrantes, soyAdmin } = data;
  const pagadoPor = porCubrir
    ? null
    : (pagadoPorElegido ?? integrantes.find((i) => i.esYo)?.id ?? null);
  const participantes = integrantes.filter((i) => !desmarcados.has(i.id)).map((i) => i.id);

  // Vista previa: la misma regla que aplica el servidor.
  const montoLeido = leerMonto(monto);
  let vistaPrevia: Participacion[] = [];
  if (
    tipoDivision === 'equitativa' &&
    (pagadoPor || porCubrir) &&
    montoLeido !== null &&
    participantes.length > 0 &&
    montoLeido >= participantes.length
  ) {
    vistaPrevia = dividirEquitativo(montoLeido, participantes, pagadoPor);
  }

  function alternar(id: string) {
    setDesmarcados((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  function guardar() {
    const nuevosErrores = validarGasto({
      descripcion,
      monto,
      participantes,
      tipoDivision,
      montosPersonalizados,
    });
    setErrores(nuevosErrores);
    const sinFecha = modoFecha === 'fecha' && !fechaLimite;
    setErrorFecha(sinFecha ? 'Elige la fecha límite en el calendario.' : null);
    if (
      Object.keys(nuevosErrores).length > 0 ||
      sinFecha ||
      (!pagadoPor && !porCubrir) ||
      montoLeido === null
    ) {
      return;
    }

    const participaciones =
      tipoDivision === 'equitativa'
        ? dividirEquitativo(montoLeido, participantes, pagadoPor)
        : participantes.map((id) => ({
            integranteId: id,
            monto: leerMonto(montosPersonalizados[id] ?? '') ?? 0,
          }));
    const comunes = {
      grupoId,
      descripcion: descripcion.trim(),
      monto: montoLeido,
      categoria,
      pagadoPor,
      tipoDivision,
      participaciones,
    };
    const limite = modoFecha === 'fecha' ? fechaLimite : null;
    const volver = { onSuccess: () => router.back() };

    if (original) {
      editarGasto.mutate(
        { ...comunes, gastoId: original.id, version: original.version, fechaLimite: limite },
        volver,
      );
    } else if (modoFecha === 'mensual') {
      crearMensual.mutate({ ...comunes, diaVencimiento: diaMensual, claveIdempotencia: clave }, volver);
    } else {
      registrar.mutate(
        { ...comunes, fecha: hoy, fechaLimite: limite, claveIdempotencia: clave },
        volver,
      );
    }
  }

  const primerMensual = primerVencimientoMensual(hoy, diaMensual);
  const opcionesFecha: { valor: ModoFecha; texto: string }[] = [
    { valor: 'sin', texto: 'Sin fecha' },
    { valor: 'fecha', texto: 'Una fecha' },
    // Repetir se elige al crear; un gasto ya creado no se convierte en mensual.
    ...(!original && soyAdmin ? [{ valor: 'mensual' as const, texto: 'Cada mes' }] : []),
  ];

  const todosMarcados = desmarcados.size === 0;
  // Personalizada: cuánto va asignado y cuánto falta para llegar al monto.
  const asignado = participantes.reduce(
    (suma, id) => suma + (leerMonto(montosPersonalizados[id] ?? '') ?? 0),
    0,
  );
  const falta = montoLeido !== null ? montoLeido - asignado : null;

  return (
    <PantallaCompleta
      titulo={original ? 'Editar gasto' : 'Nuevo gasto'}
      subtitulo={original ? 'Corrige los datos y guarda.' : 'Anota lo que se pagó y entre quiénes se divide.'}
      volver="‹ Grupo"
      pie={
        <BotonPrincipal
          texto={[
            original ? 'Guardar cambios' : modoFecha === 'mensual' ? 'Crear gasto mensual' : 'Guardar gasto',
            montoLeido !== null && formatearPesos(montoLeido),
          ]
            .filter(Boolean)
            .join(' · ')}
          onPress={guardar}
          cargando={isPending}
        />
      }
    >
      {SIMULAR_GUARDADO && (
        <Text style={styles.modoPrueba}>Modo prueba: el gasto no se guardará en Supabase</Text>
      )}

      <TarjetaMonto etiqueta="¿Cuánto fue?" valor={monto} onCambiar={setMonto} error={errores.monto}>
        <TextInput
          style={styles.descripcion}
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="¿En qué? Ej: Supermercado"
          placeholderTextColor="rgba(255,255,255,0.6)"
          selectionColor={PALETA.lila}
          maxLength={LIMITE_DESCRIPCION}
          accessibilityLabel="Descripción del gasto"
        />
        {errores.descripcion && <Text style={styles.errorEnMorado}>{errores.descripcion}</Text>}
      </TarjetaMonto>

      <SeccionFormulario titulo="Categoría">
        <View style={styles.categorias}>
          {CATEGORIAS.map((c) => {
            const activa = categoria === c.valor;
            return (
              <Pressable
                key={c.valor}
                onPress={() => setCategoria(c.valor)}
                accessibilityRole="radio"
                accessibilityState={{ selected: activa }}
                accessibilityLabel={c.etiqueta}
                style={({ pressed }) => [
                  styles.categoria,
                  activa && styles.categoriaActiva,
                  pressed && styles.presionado,
                ]}
              >
                <Text style={styles.categoriaIcono}>{iconoCategoria(c.valor)}</Text>
                <Text
                  style={[styles.categoriaTexto, activa && styles.categoriaTextoActivo]}
                  numberOfLines={2}
                >
                  {c.etiqueta}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SeccionFormulario>

      <SeccionFormulario titulo={porCubrir ? '¿Quién lo pagó?' : '¿Quién pagó?'}>
        {soyAdmin && (
          <Segmento
            valor={porCubrir ? 'por-cubrir' : 'pagado'}
            onCambiar={(v) => setPorCubrir(v === 'por-cubrir')}
            opciones={[
              { valor: 'pagado', texto: 'Ya lo pagó alguien' },
              { valor: 'por-cubrir', texto: 'Aún no se paga' },
            ]}
          />
        )}
        {porCubrir ? (
          <View style={styles.explicacion}>
            <Text style={styles.explicacionIcono}>🧾</Text>
            <Text style={styles.explicacionTexto}>
              Nadie lo ha pagado todavía. Cada rumi paga su parte (por ejemplo, al arrendador) y la
              marca como pagada en Rumi. No cambia los saldos entre ustedes.
            </Text>
          </View>
        ) : (
          <>
            <SelectorRumi
              etiqueta="Pagó"
              elegido={pagadoPor}
              onElegir={setPagadoPor}
              rumis={integrantes.map((i) => ({
                ...i,
                // Regla 14b: solo un admin registra lo que pagó un pendiente.
                deshabilitado: i.pendiente && !soyAdmin,
              }))}
            />
            {!soyAdmin && integrantes.some((i) => i.pendiente) && (
              <Text style={styles.nota}>Solo un admin registra gastos pagados por un pendiente.</Text>
            )}
          </>
        )}
      </SeccionFormulario>

      <SeccionFormulario titulo="Fecha límite">
        <Segmento
          valor={modoFecha}
          onCambiar={(v) => {
            setModoFecha(v);
            setErrorFecha(null);
          }}
          opciones={opcionesFecha}
        />
        {modoFecha === 'sin' && (
          <Text style={styles.nota}>
            Con fecha límite, a quien no haya pagado su parte se le avisa cuando venza.
          </Text>
        )}
        {modoFecha === 'fecha' && (
          <>
            <SelectorFecha valor={fechaLimite} hoy={hoy} onCambiar={setFechaLimite} />
            {fechaLimite && (
              <Text style={styles.resumenFecha}>Vence el {fechaLarga(fechaLimite, hoy)}</Text>
            )}
            {errorFecha && <Text style={styles.error}>{errorFecha}</Text>}
          </>
        )}
        {modoFecha === 'mensual' && (
          <>
            <View style={styles.dia}>
              <Pressable
                onPress={() => setDiaMensual((d) => Math.max(1, d - 1))}
                accessibilityRole="button"
                accessibilityLabel="Un día antes"
                style={styles.diaBoton}
              >
                <Text style={styles.diaBotonTexto}>−</Text>
              </Pressable>
              <View style={styles.diaCentro} accessible accessibilityLabel={`Vence el día ${diaMensual} de cada mes`}>
                <Text style={styles.diaEtiqueta}>Vence el día</Text>
                <Text style={styles.diaNumero}>{diaMensual}</Text>
                <Text style={styles.diaEtiqueta}>de cada mes</Text>
              </View>
              <Pressable
                onPress={() => setDiaMensual((d) => Math.min(31, d + 1))}
                accessibilityRole="button"
                accessibilityLabel="Un día después"
                style={styles.diaBoton}
              >
                <Text style={styles.diaBotonTexto}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.nota}>
              🔁 Rumi lo crea solo cada mes, con el mismo monto y división. El primero vence el{' '}
              {fechaLarga(primerMensual, hoy)}.
              {diaMensual > 28 && ' En meses más cortos vence el último día.'} Puedes detenerlo en
              Ajustes del grupo.
            </Text>
          </>
        )}
      </SeccionFormulario>

      <SeccionFormulario
        titulo="¿Entre quiénes?"
        extra={
          <Pressable
            onPress={() =>
              setDesmarcados(todosMarcados ? new Set(integrantes.map((i) => i.id)) : new Set())
            }
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={styles.enlace}>{todosMarcados ? 'Ninguno' : 'Todos'}</Text>
          </Pressable>
        }
      >
        <Segmento
          valor={tipoDivision}
          onCambiar={setTipoDivision}
          opciones={[
            { valor: 'equitativa', texto: 'Partes iguales' },
            { valor: 'personalizada', texto: 'Montos distintos' },
          ]}
        />

        <View>
          {integrantes.map((i, indice) => {
            const marcado = !desmarcados.has(i.id);
            const parte = vistaPrevia.find((p) => p.integranteId === i.id);
            return (
              <View key={i.id} style={[styles.fila, indice > 0 && styles.filaSeparada]}>
                <Pressable
                  onPress={() => alternar(i.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: marcado }}
                  accessibilityLabel={`${i.nombre}${i.pendiente ? ', pendiente' : ''}`}
                  style={styles.filaNombre}
                >
                  <View style={!marcado && styles.apagado}>
                    <CirculoRumi nombre={i.nombre} color={i.color} pendiente={i.pendiente} />
                  </View>
                  <View style={styles.filaTextos}>
                    <Text style={[styles.nombre, !marcado && styles.nombreApagado]} numberOfLines={1}>
                      {i.esYo ? `${i.nombre} (tú)` : i.nombre}
                    </Text>
                    {i.pendiente && <Text style={styles.nota}>pendiente</Text>}
                  </View>
                </Pressable>
                {marcado && tipoDivision === 'personalizada' && (
                  <View style={styles.inputParte}>
                    <Text style={styles.inputParteSigno}>$</Text>
                    <TextInput
                      style={styles.inputParteTexto}
                      value={montosPersonalizados[i.id] ?? ''}
                      onChangeText={(texto) =>
                        setMontosPersonalizados((actual) => ({
                          ...actual,
                          [i.id]: formatearEntradaMonto(texto),
                        }))
                      }
                      placeholder="0"
                      placeholderTextColor={PALETA.textoSuave}
                      keyboardType="number-pad"
                      accessibilityLabel={`Monto de ${i.nombre}`}
                    />
                  </View>
                )}
                {parte && <Text style={styles.parte}>{formatearPesos(parte.monto)}</Text>}
                <Pressable
                  onPress={() => alternar(i.id)}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  hitSlop={8}
                  style={[styles.casilla, marcado && styles.casillaMarcada]}
                >
                  {marcado && <Text style={styles.check}>✓</Text>}
                </Pressable>
              </View>
            );
          })}
        </View>

        {tipoDivision === 'personalizada' && falta !== null && (
          <View style={[styles.resumen, falta === 0 && styles.resumenOk]}>
            <Text style={[styles.resumenTexto, falta === 0 && styles.resumenTextoOk]}>
              {falta === 0
                ? '✓ Los montos suman el total'
                : falta > 0
                  ? `Faltan ${formatearPesos(falta)} por asignar`
                  : `Te pasaste por ${formatearPesos(-falta)}`}
            </Text>
          </View>
        )}
        {errores.participantes && <Text style={styles.error}>{errores.participantes}</Text>}
        {errores.personalizada && <Text style={styles.error}>{errores.personalizada}</Text>}
      </SeccionFormulario>

      {error && (
        <Text style={styles.errorGeneral}>
          {original ? error.message : 'No pudimos guardar el gasto. Intenta de nuevo.'}
        </Text>
      )}
    </PantallaCompleta>
  );
}

type ModoFecha = 'sin' | 'fecha' | 'mensual';

type SegmentoProps<T extends string> = {
  valor: T;
  onCambiar: (valor: T) => void;
  opciones: { valor: T; texto: string }[];
};

// Control segmentado: una opción de varias, como pestañas.
function Segmento<T extends string>({ valor, onCambiar, opciones }: SegmentoProps<T>) {
  return (
    <View style={styles.segmento} accessibilityRole="radiogroup">
      {opciones.map((o) => {
        const activo = valor === o.valor;
        return (
          <Pressable
            key={o.valor}
            onPress={() => onCambiar(o.valor)}
            accessibilityRole="radio"
            accessibilityState={{ selected: activo }}
            style={[styles.segmentoOpcion, activo && styles.segmentoActivo]}
          >
            <Text
              style={[styles.segmentoTexto, activo && styles.segmentoTextoActivo]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {o.texto}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cargando: { marginVertical: 40 },
  explicacion: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: PALETA.lilaClaro,
    borderRadius: 14,
    padding: 12,
  },
  explicacionIcono: { fontSize: 22 },
  explicacionTexto: { flex: 1, fontSize: 14, lineHeight: 20, color: PALETA.moradoOscuro },
  resumenFecha: { fontSize: 15, fontWeight: '800', color: PALETA.morado, textAlign: 'center' },
  dia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETA.crema,
    borderRadius: 18,
    padding: 10,
  },
  diaBoton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PALETA.blanco,
    borderWidth: 1.5,
    borderColor: PALETA.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaBotonTexto: { fontSize: 24, fontWeight: '700', color: PALETA.morado },
  diaCentro: { alignItems: 'center' },
  diaEtiqueta: { fontSize: 13, fontWeight: '600', color: PALETA.textoSuave },
  diaNumero: { fontSize: 34, fontWeight: '800', color: PALETA.morado },
  modoPrueba: {
    backgroundColor: PALETA.lilaClaro,
    color: PALETA.morado,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    borderRadius: 12,
    padding: 10,
    overflow: 'hidden',
  },
  descripcion: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: PALETA.blanco,
  },
  errorEnMorado: { color: PALETA.lilaClaro, fontSize: 13, fontWeight: '700' },

  categorias: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoria: {
    width: '23%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: PALETA.crema,
  },
  categoriaActiva: { borderColor: PALETA.violeta, backgroundColor: PALETA.lilaClaro },
  categoriaIcono: { fontSize: 26 },
  categoriaTexto: { fontSize: 12, fontWeight: '600', color: PALETA.textoSuave, textAlign: 'center' },
  categoriaTextoActivo: { color: PALETA.morado, fontWeight: '800' },
  presionado: { opacity: 0.8 },

  enlace: { color: PALETA.morado, fontSize: 14, fontWeight: '700' },
  segmento: {
    flexDirection: 'row',
    backgroundColor: PALETA.crema,
    borderRadius: 14,
    padding: 4,
  },
  segmentoOpcion: { flex: 1, borderRadius: 11, paddingVertical: 10, alignItems: 'center' },
  segmentoActivo: {
    backgroundColor: PALETA.blanco,
    shadowColor: PALETA.moradoOscuro,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentoTexto: { fontSize: 14, fontWeight: '600', color: PALETA.textoSuave },
  segmentoTextoActivo: { color: PALETA.morado, fontWeight: '800' },

  fila: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60 },
  filaSeparada: { borderTopWidth: 1, borderTopColor: PALETA.lilaClaro },
  filaNombre: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  filaTextos: { flexShrink: 1 },
  apagado: { opacity: 0.35 },
  nombre: { fontSize: 16, fontWeight: '700', color: PALETA.moradoOscuro },
  nombreApagado: { color: PALETA.textoSuave, fontWeight: '500' },
  parte: { fontSize: 16, fontWeight: '800', color: PALETA.morado },
  inputParte: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 116,
    borderWidth: 1.5,
    borderColor: PALETA.borde,
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: PALETA.crema,
  },
  inputParteSigno: { fontSize: 16, fontWeight: '700', color: PALETA.textoSuave },
  inputParteTexto: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700',
    color: PALETA.moradoOscuro,
    textAlign: 'right',
  },
  casilla: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: PALETA.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  casillaMarcada: { backgroundColor: PALETA.morado, borderColor: PALETA.morado },
  check: { color: PALETA.blanco, fontSize: 13, fontWeight: '800' },

  resumen: { backgroundColor: PALETA.lilaClaro, borderRadius: 12, padding: 12 },
  resumenOk: { backgroundColor: '#E3F5EA' },
  resumenTexto: { color: PALETA.morado, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  resumenTextoOk: { color: '#1E8E5A' },

  nota: { color: PALETA.textoSuave, fontSize: 13 },
  error: { color: PALETA.error, fontSize: 14 },
  errorGeneral: {
    color: PALETA.error,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: '#FDECEC',
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
});
