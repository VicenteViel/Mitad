import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { PantallaFormulario } from '@/components/pantalla-formulario';
import {
  esCodigoValido,
  formatearCodigo,
  LARGO_CODIGO,
  normalizarCodigo,
} from '@/features/invitaciones/codigo';
import { PALETA } from '@/theme/tema';

// Para quien recibió el código (o un link que no pudo abrir): lo escribe aquí.
// Funciona con o sin sesión.
export default function IngresarCodigoScreen() {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);

  function unirme() {
    if (!esCodigoValido(codigo)) {
      setError(`El código tiene ${LARGO_CODIGO} caracteres, por ejemplo ABCDE-23456.`);
      return;
    }
    router.push({ pathname: '/invitacion/[codigo]', params: { codigo: normalizarCodigo(codigo) } });
  }

  return (
    <PantallaFormulario logo>
      <Text style={styles.titulo} accessibilityRole="header">
        Me invitaron
      </Text>
      <Text style={styles.texto}>
        Escribe el código que te envió el administrador de tu grupo.
      </Text>

      <TextInput
        style={styles.input}
        value={formatearCodigo(codigo)}
        onChangeText={(texto) => {
          setCodigo(normalizarCodigo(texto).slice(0, LARGO_CODIGO));
          setError(null);
        }}
        placeholder="ABCDE-23456"
        placeholderTextColor={PALETA.textoSuave}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={LARGO_CODIGO + 1}
        accessibilityLabel="Código de invitación"
      />
      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        onPress={unirme}
        accessibilityRole="button"
        style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
      >
        <Text style={styles.botonTexto}>Unirme al grupo</Text>
      </Pressable>

      <Text style={styles.ayuda}>
        Si te llegó un link, ábrelo desde este teléfono y la app te traerá aquí sola.
      </Text>

      {router.canGoBack() && (
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.enlace}>Volver</Text>
        </Pressable>
      )}
    </PantallaFormulario>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 28, fontWeight: '800', color: PALETA.morado, textAlign: 'center' },
  texto: { fontSize: 15, color: PALETA.textoSuave, textAlign: 'center', lineHeight: 21 },
  input: {
    borderWidth: 1,
    borderColor: PALETA.borde,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
    color: PALETA.morado,
    backgroundColor: PALETA.blanco,
    marginTop: 6,
  },
  error: { color: PALETA.error, fontSize: 14, textAlign: 'center' },
  boton: {
    backgroundColor: PALETA.morado,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  botonTexto: { color: PALETA.blanco, fontSize: 16, fontWeight: '700' },
  presionado: { opacity: 0.85 },
  ayuda: { fontSize: 13, color: PALETA.textoSuave, textAlign: 'center', lineHeight: 19 },
  enlace: { color: PALETA.morado, fontSize: 15, fontWeight: '600', textAlign: 'center', paddingVertical: 6 },
});
