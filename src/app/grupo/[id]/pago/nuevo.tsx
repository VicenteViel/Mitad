import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '@/components/chip';
import { PantallaFormulario } from '@/components/pantalla-formulario';
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

  if (rumis.isPending || (params.editar && pagos.isPending)) {
    return (
      <PantallaFormulario>
        <ActivityIndicator color={PALETA.morado} />
      </PantallaFormulario>
    );
  }
  if (rumis.isError || !rumis.data || (params.editar && !original)) {
    return (
      <PantallaFormulario>
        <Text style={styles.error}>No pudimos cargar el grupo. Vuelve a intentarlo.</Text>
      </PantallaFormulario>
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

  const etiqueta = (id: string) => {
    const r = porId.get(id);
    if (!r) return 'Rumi';
    return r.id === yo?.id ? `${r.nombre} (tú)` : r.nombre;
  };

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

  return (
    <PantallaFormulario>
      <Text style={styles.titulo} accessibilityRole="header">
        {original ? 'Editar pago' : 'Registrar pago'}
      </Text>
      <Text style={styles.subtitulo}>Anota un pago que se hicieron dos rumis.</Text>
      {SIMULAR_GUARDADO && (
        <Text style={styles.modoPrueba}>Modo prueba: el pago no se guardará en Supabase</Text>
      )}

      <Text style={styles.label}>¿Quién pagó?</Text>
      <View style={styles.chips}>
        {elegibles.map((r) => (
          <Chip key={r.id} texto={etiqueta(r.id)} activo={de === r.id} onPress={() => setDe(r.id)} />
        ))}
      </View>
      {errores.de && <Text style={styles.error}>{errores.de}</Text>}

      <Text style={styles.label}>¿A quién le pagó?</Text>
      <View style={styles.chips}>
        {elegibles.map((r) => (
          <Chip
            key={r.id}
            texto={etiqueta(r.id)}
            activo={a === r.id}
            deshabilitado={r.id === de}
            onPress={() => setA(r.id)}
          />
        ))}
      </View>
      {errores.a && <Text style={styles.error}>{errores.a}</Text>}

      <Text style={styles.label}>Monto (CLP)</Text>
      <TextInput
        style={styles.input}
        value={monto}
        onChangeText={setMonto}
        placeholder="7.000"
        placeholderTextColor={PALETA.textoSuave}
        keyboardType="number-pad"
        accessibilityLabel="Monto en pesos"
      />
      {errores.monto && <Text style={styles.error}>{errores.monto}</Text>}

      {deudaActual !== undefined && (
        <Pressable
          onPress={() => setMonto(formatearPesos(deudaActual).slice(1))}
          accessibilityRole="button"
          style={styles.sugerencia}
        >
          <Text style={styles.sugerenciaTexto}>
            Deuda actual: {formatearPesos(deudaActual)} · Usar este monto
          </Text>
        </Pressable>
      )}
      {deudaActual !== undefined && montoLeido !== null && montoLeido > deudaActual && (
        <Text style={styles.nota}>
          El pago es mayor que la deuda: la diferencia quedará a favor de quien pagó.
        </Text>
      )}

      {rumiDe && rumiA && !permitido && !original && (
        <Text style={styles.error}>
          No puedes registrar este pago. Lo registra una de las dos personas, o un admin si alguna
          está pendiente.
        </Text>
      )}
      {error && (
        <Text style={styles.error}>
          {original ? error.message : 'No pudimos guardar el pago. Intenta de nuevo.'}
        </Text>
      )}

      <Pressable
        onPress={guardar}
        disabled={isPending}
        accessibilityRole="button"
        style={({ pressed }) => [styles.boton, (pressed || isPending) && styles.presionado]}
      >
        {isPending ? (
          <ActivityIndicator color={PALETA.blanco} />
        ) : (
          <Text style={styles.botonTexto}>Guardar pago</Text>
        )}
      </Pressable>
      <Text style={styles.nota}>
        Después podrás adjuntar la captura de la transferencia desde el detalle del pago.
      </Text>
    </PantallaFormulario>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 28, fontWeight: '800', color: PALETA.morado, textAlign: 'center' },
  subtitulo: { fontSize: 15, color: PALETA.textoSuave, textAlign: 'center' },
  modoPrueba: {
    backgroundColor: PALETA.lilaClaro,
    color: PALETA.morado,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    borderRadius: 8,
    padding: 8,
    overflow: 'hidden',
  },
  label: { fontSize: 16, fontWeight: '600', color: PALETA.moradoOscuro, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: PALETA.borde,
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    color: PALETA.moradoOscuro,
  },
  sugerencia: { backgroundColor: PALETA.lilaClaro, borderRadius: 12, padding: 12 },
  sugerenciaTexto: { color: PALETA.morado, fontSize: 14, fontWeight: '700' },
  nota: { color: PALETA.textoSuave, fontSize: 13, lineHeight: 19 },
  error: { color: PALETA.error, fontSize: 14 },
  boton: {
    backgroundColor: PALETA.morado,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  botonTexto: { color: PALETA.blanco, fontSize: 16, fontWeight: '700' },
  presionado: { opacity: 0.8 },
});
