import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BotonPrincipal, PantallaCompleta, SeccionFormulario } from '@/components/pantalla-completa';
import { CirculoRumi, SelectorRumi, type OpcionRumi } from '@/components/selector-rumi';
import { TarjetaMonto } from '@/components/tarjeta-monto';
import { useSesion } from '@/features/auth/use-sesion';
import { hoyLocal, nuevaClaveIdempotencia } from '@/features/gastos/api';
import { formatearPesos, leerMonto } from '@/features/gastos/validar-gasto';
import { puedeRegistrarPago } from '@/features/saldos/permisos';
import type { Pago, RumiSaldo } from '@/features/saldos/api';
import {
  useEditarPago,
  usePagos,
  useRegistrarPago,
  useSaldos,
  useRumisSaldo,
} from '@/features/saldos/use-saldos';
import { validarPago, type ErroresPago } from '@/features/saldos/validar-pago';
import { SIMULAR_GUARDADO } from '@/lib/desarrollo';
import { PALETA } from '@/theme/tema';

// Registrar un pago entre dos rumis (liquidación). Puede venir con quién paga,
// quién recibe y el monto sugerido desde la tarjeta de saldos. Con
// ?editar=<pagoId>, un admin corrige un pago existente.
export default function NuevoPagoScreen() {
  const params = useLocalSearchParams<{
    id: string;
    de?: string;
    a?: string;
    monto?: string;
    editar?: string;
  }>();
  const rumis = useRumisSaldo(params.id);
  const pagos = usePagos(params.id);
  const original = params.editar ? pagos.data?.find((p) => p.id === params.editar) : undefined;

  const titulo = params.editar ? 'Editar pago' : 'Registrar pago';
  if (rumis.isPending || (params.editar && pagos.isPending)) {
    return (
      <PantallaCompleta titulo={titulo} volver="‹ Grupo">
        <ActivityIndicator color={PALETA.morado} style={styles.cargando} />
      </PantallaCompleta>
    );
  }
  if (rumis.isError || !rumis.data || (params.editar && !original)) {
    return (
      <PantallaCompleta titulo={titulo} volver="‹ Grupo">
        <Text style={styles.errorGeneral}>No pudimos cargar el grupo. Vuelve a intentarlo.</Text>
      </PantallaCompleta>
    );
  }

  return (
    <FormularioPago
      grupoId={params.id}
      rumis={rumis.data}
      original={original}
      inicial={{ de: params.de, a: params.a, monto: params.monto }}
    />
  );
}

type FormularioProps = {
  grupoId: string;
  rumis: RumiSaldo[];
  original?: Pago;
  inicial: { de?: string; a?: string; monto?: string };
};

function FormularioPago({ grupoId, rumis: lista, original, inicial }: FormularioProps) {
  const { sesion } = useSesion();
  const { saldos } = useSaldos(grupoId);
  const registrar = useRegistrarPago();
  const editar = useEditarPago();
  const { isPending, error } = original ? editar : registrar;

  const [de, setDe] = useState<string | null>(original?.de ?? inicial.de ?? null);
  const [a, setA] = useState<string | null>(original?.a ?? inicial.a ?? null);
  const montoInicial = original?.monto ?? (inicial.monto ? Number(inicial.monto) : null);
  const [monto, setMonto] = useState(montoInicial ? formatearPesos(montoInicial).slice(1) : '');
  const [errores, setErrores] = useState<ErroresPago>({});
  // Una clave por formulario: un reintento no duplica el pago.
  const [clave] = useState(nuevaClaveIdempotencia);

  const yo = lista.find((r) => r.usuarioId === sesion?.user.id);
  // Activos y pendientes; los que salieron solo si vienen preseleccionados.
  const elegibles = lista.filter((r) => !r.salio || r.id === de || r.id === a);
  const porId = new Map(lista.map((r) => [r.id, r]));
  const rumiDe = de ? porId.get(de) : undefined;
  const rumiA = a ? porId.get(a) : undefined;
  // Al editar decide el rol de admin (lo valida el servidor); al registrar, las reglas 14b y 18.
  const permitido = original
    ? yo?.rol === 'admin'
    : !!rumiDe && !!rumiA && puedeRegistrarPago(yo, rumiDe, rumiA);

  // Lo que debe hoy "de" a "a", para sugerir el monto exacto (regla 31).
  const deudaActual =
    de && a ? saldos?.deudas.find((d) => d.deudor === de && d.acreedor === a)?.monto : undefined;
  const montoLeido = leerMonto(monto);

  const opciones = (excluir: string | null): OpcionRumi[] =>
    elegibles.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      color: r.color,
      esYo: r.id === yo?.id,
      pendiente: r.usuarioId === null && !r.salio,
      deshabilitado: r.id === excluir,
    }));
  const nombreCorto = (r: RumiSaldo | undefined) => (!r ? '¿?' : r.id === yo?.id ? 'Tú' : r.nombre);

  // Al elegir quién pagó, si era también quien recibe, se libera "a".
  function elegirDe(id: string) {
    setDe(id);
    if (id === a) setA(null);
  }

  function guardar() {
    const nuevosErrores = validarPago({ de, a, monto });
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0 || !de || !a || montoLeido === null) return;
    if (!permitido) return;

    if (original) {
      editar.mutate(
        { pagoId: original.id, grupoId, version: original.version, de, a, monto: montoLeido },
        { onSuccess: () => router.back() },
      );
      return;
    }
    registrar.mutate(
      { grupoId, de, a, monto: montoLeido, fecha: hoyLocal(), claveIdempotencia: clave },
      { onSuccess: () => router.back() },
    );
  }

  const textoBoton = original ? 'Guardar cambios' : 'Guardar pago';

  return (
    <PantallaCompleta
      titulo={original ? 'Editar pago' : 'Registrar pago'}
      subtitulo="Anota un pago que se hicieron dos rumis, por ejemplo una transferencia."
      volver="‹ Grupo"
      pie={
        <BotonPrincipal
          texto={montoLeido !== null ? `${textoBoton} · ${formatearPesos(montoLeido)}` : textoBoton}
          onPress={guardar}
          cargando={isPending}
        />
      }
    >
      {SIMULAR_GUARDADO && (
        <Text style={styles.modoPrueba}>Modo prueba: el pago no se guardará en Supabase</Text>
      )}

      <TarjetaMonto etiqueta="¿Cuánto se pagó?" valor={monto} onCambiar={setMonto} error={errores.monto}>
        {/* Resumen visual: quién → a quién */}
        <View
          style={styles.flujo}
          accessible
          accessibilityLabel={`${nombreCorto(rumiDe)} le paga a ${nombreCorto(rumiA)}`}
        >
          <View style={styles.flujoPersona}>
            {rumiDe ? (
              <CirculoRumi nombre={rumiDe.nombre} color={rumiDe.color} tamano={44} />
            ) : (
              <View style={styles.flujoVacio} />
            )}
            <Text style={styles.flujoNombre} numberOfLines={1}>
              {rumiDe ? nombreCorto(rumiDe) : 'Quién paga'}
            </Text>
          </View>
          <Text style={styles.flujoFlecha}>→</Text>
          <View style={styles.flujoPersona}>
            {rumiA ? (
              <CirculoRumi nombre={rumiA.nombre} color={rumiA.color} tamano={44} />
            ) : (
              <View style={styles.flujoVacio} />
            )}
            <Text style={styles.flujoNombre} numberOfLines={1}>
              {rumiA ? nombreCorto(rumiA) : 'Quién recibe'}
            </Text>
          </View>
        </View>
      </TarjetaMonto>

      {deudaActual !== undefined && (
        <Pressable
          onPress={() => setMonto(formatearPesos(deudaActual).slice(1))}
          accessibilityRole="button"
          accessibilityLabel={`Usar la deuda actual, ${formatearPesos(deudaActual)}`}
          style={({ pressed }) => [styles.sugerencia, pressed && styles.presionado]}
        >
          <View style={styles.sugerenciaTextos}>
            <Text style={styles.sugerenciaEtiqueta}>Deuda actual</Text>
            <Text style={styles.sugerenciaMonto}>{formatearPesos(deudaActual)}</Text>
          </View>
          <Text style={styles.sugerenciaAccion}>Usar este monto</Text>
        </Pressable>
      )}
      {deudaActual !== undefined && montoLeido !== null && montoLeido > deudaActual && (
        <Text style={styles.aviso}>
          El pago es mayor que la deuda: la diferencia quedará a favor de quien pagó.
        </Text>
      )}

      <SeccionFormulario titulo="¿Quién pagó?">
        <SelectorRumi etiqueta="Pagó" elegido={de} onElegir={elegirDe} rumis={opciones(null)} />
        {errores.de && <Text style={styles.error}>{errores.de}</Text>}
      </SeccionFormulario>

      <SeccionFormulario titulo="¿A quién le pagó?">
        <SelectorRumi etiqueta="Recibió" elegido={a} onElegir={setA} rumis={opciones(de)} />
        {errores.a && <Text style={styles.error}>{errores.a}</Text>}
      </SeccionFormulario>

      {rumiDe && rumiA && !permitido && !original && (
        <Text style={styles.errorGeneral}>
          No puedes registrar este pago. Lo registra una de las dos personas, o un admin si alguna
          está pendiente.
        </Text>
      )}
      {error && (
        <Text style={styles.errorGeneral}>
          {original ? error.message : 'No pudimos guardar el pago. Intenta de nuevo.'}
        </Text>
      )}

      <Text style={styles.nota}>
        📎 Después podrás adjuntar la captura de la transferencia desde el detalle del pago.
      </Text>
    </PantallaCompleta>
  );
}

const styles = StyleSheet.create({
  cargando: { marginVertical: 40 },
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

  flujo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  flujoPersona: { flex: 1, alignItems: 'center', gap: 6 },
  flujoVacio: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  flujoNombre: { color: PALETA.blanco, fontSize: 14, fontWeight: '700', maxWidth: 110 },
  flujoFlecha: { color: PALETA.blanco, fontSize: 26, fontWeight: '800', paddingHorizontal: 8 },

  sugerencia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: PALETA.blanco,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: PALETA.violeta,
    padding: 14,
  },
  sugerenciaTextos: { gap: 2 },
  sugerenciaEtiqueta: { fontSize: 13, color: PALETA.textoSuave, fontWeight: '600' },
  sugerenciaMonto: { fontSize: 20, color: PALETA.moradoOscuro, fontWeight: '800' },
  sugerenciaAccion: {
    color: PALETA.blanco,
    backgroundColor: PALETA.violeta,
    fontSize: 13,
    fontWeight: '800',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  aviso: {
    color: PALETA.morado,
    backgroundColor: PALETA.lilaClaro,
    fontSize: 13,
    lineHeight: 19,
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
  presionado: { opacity: 0.8 },

  nota: { color: PALETA.textoSuave, fontSize: 13, lineHeight: 19, textAlign: 'center' },
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
