import { useTheme } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PantallaFormulario } from '@/components/pantalla-formulario';
import { supabase } from '@/lib/supabase';
import { PALETA } from '@/theme/tema';

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function IngresarScreen() {
  const { colors } = useTheme();
  const [paso, setPaso] = useState<'correo' | 'codigo'>('correo');
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviarCodigo() {
    const limpio = correo.trim().toLowerCase();
    if (!CORREO_VALIDO.test(limpio)) {
      setError('Escribe un correo válido.');
      return;
    }
    setEnviando(true);
    setError(null);
    const { error: errorEnvio } = await supabase.auth.signInWithOtp({ email: limpio });
    setEnviando(false);
    if (errorEnvio) {
        if (__DEV__) console.warn('Error al enviar código:', errorEnvio.message);
      setError('No pudimos enviar el código. Espera un minuto e intenta de nuevo.');
      return;
    }
    setCorreo(limpio);
    setPaso('codigo');
  }

  async function verificarCodigo() {
    if (!/^\d{6}$/.test(codigo)) {
      setError('El código tiene 6 dígitos.');
      return;
    }
    setEnviando(true);
    setError(null);
    const { error: errorCodigo } = await supabase.auth.verifyOtp({
      email: correo,
      token: codigo,
      type: 'email',
    });
    setEnviando(false);
    if (errorCodigo) setError('Código incorrecto o vencido.');
    // Si es correcto, onAuthStateChange actualiza la sesión y el layout cambia de pantalla.
  }

  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border }];

  return (
    <PantallaFormulario>
      <Text style={[styles.title, { color: colors.primary }]}>Rumi</Text>
      <Text style={styles.subtitulo}>
        {paso === 'correo' ? 'Ingresa con tu correo' : 'Revisa tu correo'}
      </Text>

      {paso === 'correo' ? (
        <>
          <Text style={[styles.label, { color: colors.text }]}>Correo</Text>
          <TextInput
            style={inputStyle}
            value={correo}
            onChangeText={setCorreo}
            placeholder="nombre@correo.com"
            placeholderTextColor={PALETA.textoSuave}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            accessibilityLabel="Correo electrónico"
          />
        </>
      ) : (
        <>
          <Text style={[styles.label, { color: colors.text }]}>
            Escribe el código que enviamos a {correo}
          </Text>
          <TextInput
            style={inputStyle}
            value={codigo}
            onChangeText={setCodigo}
            placeholder="123456"
            placeholderTextColor={PALETA.textoSuave}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            accessibilityLabel="Código de 6 dígitos"
          />
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, { backgroundColor: colors.primary, opacity: enviando ? 0.6 : 1 }]}
        onPress={paso === 'correo' ? enviarCodigo : verificarCodigo}
        disabled={enviando}
        accessibilityRole="button"
      >
        {enviando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{paso === 'correo' ? 'Enviar código' : 'Ingresar'}</Text>
        )}
      </Pressable>

      {paso === 'codigo' && (
        <Pressable
          onPress={() => {
            setPaso('correo');
            setCodigo('');
            setError(null);
          }}
          accessibilityRole="button"
        >
          <Text style={[styles.link, { color: colors.primary }]}>Cambiar correo</Text>
        </Pressable>
      )}

      {/* Quien era integrante sin correo no puede volver por aquí: necesita un link nuevo. */}
      {paso === 'correo' && (
        <View style={styles.nota}>
          <Text style={styles.notaTitulo}>¿Eras parte de un grupo y nunca registraste tu correo?</Text>
          <Text style={styles.notaTexto}>
            Pídele al administrador un nuevo link de invitación para recuperar tu lugar.
          </Text>
        </View>
      )}
    </PantallaFormulario>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 40, fontWeight: '700', textAlign: 'center' },
  subtitulo: { fontSize: 16, color: PALETA.textoSuave, textAlign: 'center', marginBottom: 12 },
  nota: { backgroundColor: PALETA.lilaClaro, borderRadius: 14, padding: 14, gap: 4, marginTop: 8 },
  notaTitulo: { fontSize: 14, fontWeight: '700', color: PALETA.moradoOscuro },
  notaTexto: { fontSize: 14, color: PALETA.textoSuave, lineHeight: 20 },
  label: { fontSize: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 18 },
  error: { color: PALETA.error, fontSize: 14 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', fontSize: 15, marginTop: 8 },
});