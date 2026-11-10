import { router, useLocalSearchParams, useTheme } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '@/components/chip';
import { PantallaFormulario } from '@/components/pantalla-formulario';
import { hoyLocal, nuevaClaveIdempotencia } from '@/features/gastos/api';
import { dividirEquitativo, type Participacion } from '@/features/gastos/division';
import type { DatosIntegrantesGasto } from '@/features/gastos/api';
import type { GastoDetalle } from '@/features/gastos/api-detalle';
import { useDetalleGasto, useEditarGasto } from '@/features/gastos/use-detalle-gasto';
import { useIntegrantesGasto, useRegistrarGasto } from '@/features/gastos/use-registrar-gasto';
import {
  CATEGORIAS,
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
  const { colors } = useTheme();
  const { id: grupoId, editar } = useLocalSearchParams<{ id: string; editar?: string }>();
  const integrantes = useIntegrantesGasto(grupoId);
  const original = useDetalleGasto(editar ?? '');

  const cargando = integrantes.isLoading || (!!editar && original.isLoading);
  if (cargando) {
    return (
      <PantallaFormulario>
        <ActivityIndicator color={colors.primary} />
      </PantallaFormulario>
    );
  }
  if (integrantes.error || !integrantes.data || (editar && !original.data)) {
    return (
      <PantallaFormulario>
        <Text style={styles.error}>No pudimos cargar el grupo. Vuelve a intentarlo.</Text>
      </PantallaFormulario>
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
  const { colors } = useTheme();
  const registrar = useRegistrarGasto();
  const editarGasto = useEditarGasto();
  const { isPending, error } = original ? editarGasto : registrar;

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
  // Una clave por formulario: si "Guardar" se toca de nuevo tras un error de
  // red, el servidor reconoce el reintento y no duplica el gasto.
  const [clave] = useState(nuevaClaveIdempotencia);

  const { integrantes, soyAdmin } = data;
  const pagadoPor = pagadoPorElegido ?? integrantes.find((i) => i.esYo)?.id ?? null;
  const participantes = integrantes.filter((i) => !desmarcados.has(i.id)).map((i) => i.id);

  // Vista previa: la misma regla que aplica el servidor.
  const montoLeido = leerMonto(monto);
  let vistaPrevia: Participacion[] = [];
  if (
    tipoDivision === 'equitativa' &&
    pagadoPor &&
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
    if (Object.keys(nuevosErrores).length > 0 || !pagadoPor || montoLeido === null) return;

    const participaciones =
      tipoDivision === 'equitativa'
        ? dividirEquitativo(montoLeido, participantes, pagadoPor)
        : participantes.map((id) => ({
            integranteId: id,
            monto: leerMonto(montosPersonalizados[id] ?? '') ?? 0,
          }));

    if (original) {
      editarGasto.mutate(
        {
          gastoId: original.id,
          grupoId,
          version: original.version,
          descripcion: descripcion.trim(),
          monto: montoLeido,
          categoria,
          pagadoPor,
          tipoDivision,
          participaciones,
        },
        { onSuccess: () => router.back() },
      );
      return;
    }

    registrar.mutate(
      {
        grupoId,
        descripcion: descripcion.trim(),
        monto: montoLeido,
        categoria,
        fecha: hoyLocal(),
        pagadoPor,
        tipoDivision,
        participaciones,
        claveIdempotencia: clave,
      },
      { onSuccess: () => router.back() },
    );
  }

  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border }];

  return (
    <PantallaFormulario>
      <Text style={[styles.title, { color: colors.primary }]}>
        {original ? 'Editar gasto' : 'Nuevo gasto'}
      </Text>
      {SIMULAR_GUARDADO && (
        <Text style={styles.modoPrueba}>Modo prueba: el gasto no se guardará en Supabase</Text>
      )}

      <Text style={[styles.label, { color: colors.text }]}>Descripción</Text>
      <TextInput
        style={inputStyle}
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Supermercado"
        placeholderTextColor={PALETA.textoSuave}
        maxLength={LIMITE_DESCRIPCION}
        accessibilityLabel="Descripción del gasto"
      />
      {errores.descripcion && <Text style={styles.error}>{errores.descripcion}</Text>}

      <Text style={[styles.label, { color: colors.text }]}>Monto (CLP)</Text>
      <TextInput
        style={inputStyle}
        value={monto}
        onChangeText={setMonto}
        placeholder="10.000"
        placeholderTextColor={PALETA.textoSuave}
        keyboardType="number-pad"
        accessibilityLabel="Monto en pesos"
      />
      {errores.monto && <Text style={styles.error}>{errores.monto}</Text>}

      <Text style={[styles.label, { color: colors.text }]}>Categoría</Text>
      <View style={styles.chips}>
        {CATEGORIAS.map((c) => (
          <Chip
            key={c.valor}
            texto={c.etiqueta}
            activo={categoria === c.valor}
            onPress={() => setCategoria(c.valor)}
          />
        ))}
      </View>

      <Text style={[styles.label, { color: colors.text }]}>¿Quién pagó?</Text>
      <View style={styles.chips}>
        {integrantes.map((i) => (
          <Chip
            key={i.id}
            texto={i.esYo ? `${i.nombre} (tú)` : i.nombre}
            activo={pagadoPor === i.id}
            // Regla 14b: solo un admin registra lo que pagó un pendiente.
            deshabilitado={i.pendiente && !soyAdmin}
            onPress={() => setPagadoPor(i.id)}
          />
        ))}
      </View>
      {!soyAdmin && integrantes.some((i) => i.pendiente) && (
        <Text style={styles.nota}>Solo un admin registra gastos pagados por un pendiente.</Text>
      )}

      <Text style={[styles.label, { color: colors.text }]}>División</Text>
      <View style={styles.chips}>
        <Chip
          texto="Equitativa"
          activo={tipoDivision === 'equitativa'}
          onPress={() => setTipoDivision('equitativa')}
        />
        <Chip
          texto="Personalizada"
          activo={tipoDivision === 'personalizada'}
          onPress={() => setTipoDivision('personalizada')}
        />
      </View>

      <Text style={[styles.label, { color: colors.text }]}>¿Entre quiénes?</Text>
      {integrantes.map((i) => {
        const marcado = !desmarcados.has(i.id);
        const parte = vistaPrevia.find((p) => p.integranteId === i.id);
        return (
          <View key={i.id} style={styles.fila}>
            <Pressable
              onPress={() => alternar(i.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: marcado }}
              style={styles.filaNombre}
            >
              <View style={[styles.casilla, marcado && styles.casillaMarcada]}>
                {marcado && <Text style={styles.check}>✓</Text>}
              </View>
              <Text style={[styles.nombre, { color: colors.text }]}>
                {i.nombre}
                {i.pendiente && <Text style={styles.nota}> · pendiente</Text>}
              </Text>
            </Pressable>
            {marcado && tipoDivision === 'personalizada' && (
              <TextInput
                style={[inputStyle, styles.inputParte]}
                value={montosPersonalizados[i.id] ?? ''}
                onChangeText={(texto) =>
                  setMontosPersonalizados((actual) => ({ ...actual, [i.id]: texto }))
                }
                placeholder="0"
                placeholderTextColor={PALETA.textoSuave}
                keyboardType="number-pad"
                accessibilityLabel={`Monto de ${i.nombre}`}
              />
            )}
            {parte && (
              <Text style={[styles.parte, { color: colors.text }]}>
                {formatearPesos(parte.monto)}
              </Text>
            )}
          </View>
        );
      })}
      {errores.participantes && <Text style={styles.error}>{errores.participantes}</Text>}
      {errores.personalizada && <Text style={styles.error}>{errores.personalizada}</Text>}

      {error && (
        <Text style={styles.error}>
          {original ? error.message : 'No pudimos guardar el gasto. Intenta de nuevo.'}
        </Text>
      )}

      <Pressable
        style={[styles.button, { backgroundColor: colors.primary, opacity: isPending ? 0.6 : 1 }]}
        onPress={guardar}
        disabled={isPending}
        accessibilityRole="button"
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Guardar</Text>
        )}
      </Pressable>
    </PantallaFormulario>
  );
}

const styles = StyleSheet.create({
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
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  label: { fontSize: 16, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 18 },
  error: { color: PALETA.error, fontSize: 14 },
  nota: { color: PALETA.textoSuave, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  filaNombre: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  casilla: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: PALETA.morado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  casillaMarcada: { backgroundColor: PALETA.morado },
  check: { color: PALETA.blanco, fontSize: 14, fontWeight: '700' },
  nombre: { fontSize: 16, flexShrink: 1 },
  inputParte: { width: 120, padding: 10, fontSize: 16, textAlign: 'right' },
  parte: { fontSize: 16, fontWeight: '600' },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
