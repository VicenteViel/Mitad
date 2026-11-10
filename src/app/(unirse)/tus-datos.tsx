import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PantallaFormulario } from '@/components/pantalla-formulario';
import { COLORES } from '@/features/grupos/apariencia';
import { LIMITES } from '@/features/grupos/validar-nuevo-grupo';
import { definirAvisoCorreo } from '@/features/invitaciones/aviso-correo';
import { useInvitacion } from '@/features/invitaciones/invitacion-context';
import {
  validarDatosIntegrante,
  type ErroresDatosIntegrante,
} from '@/features/invitaciones/validar-datos-integrante';
import { esperar } from '@/lib/desarrollo';
import { PALETA } from '@/theme/tema';

// Datos personales al entrar a un grupo: foto (próximamente), nombre puesto por
// el admin (no editable), alias y correo opcionales.
export default function TusDatosScreen() {
  const { integrante } = useInvitacion();
  const [alias, setAlias] = useState('');
  const [correo, setCorreo] = useState('');
  const [errores, setErrores] = useState<ErroresDatosIntegrante>({});
  const [avisoSinCorreo, setAvisoSinCorreo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function terminar(conCorreo: boolean) {
    setGuardando(true);
    // Modo prueba: todavía no se guarda en Supabase. Ver PR de invitaciones reales.
    await esperar(600);
    definirAvisoCorreo(
      conCorreo ? { tipo: 'verificar', correo: correo.trim().toLowerCase() } : { tipo: 'agregar' },
    );
    setGuardando(false);
    router.dismissTo('/');
  }

  function continuar() {
    const nuevosErrores = validarDatosIntegrante({ alias, correo });
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    if (!correo.trim()) {
      setAvisoSinCorreo(true);
      return;
    }
    void terminar(true);
  }

  const inicial = integrante.nombre.charAt(0).toUpperCase();

  return (
    <PantallaFormulario>
      <Text style={styles.titulo} accessibilityRole="header">
        Tus datos
      </Text>

      {/* Foto de perfil: por ahora solo el espacio, con su inicial y color. */}
      <View style={styles.foto}>
        <View style={[styles.fotoCirculo, { backgroundColor: COLORES[integrante.color] }]}>
          <Text style={styles.fotoInicial}>{inicial}</Text>
        </View>
        <View style={styles.fotoBoton} accessibilityState={{ disabled: true }}>
          <Text style={styles.fotoBotonTexto}>Agregar foto</Text>
          <Text style={styles.proximamente}>Próximamente</Text>
        </View>
      </View>

      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={[styles.input, styles.inputBloqueado]}
        value={integrante.nombre}
        editable={false}
        accessibilityLabel="Nombre, definido por el administrador"
      />
      <Text style={styles.ayuda}>Lo definió el administrador del grupo.</Text>

      <Text style={styles.label}>Apodo (opcional)</Text>
      <TextInput
        style={styles.input}
        value={alias}
        onChangeText={setAlias}
        placeholder="Cómo te dicen en la casa"
        placeholderTextColor={PALETA.textoSuave}
        maxLength={LIMITES.nombreIntegrante}
        accessibilityLabel="Apodo"
      />
      {errores.alias && <Text style={styles.error}>{errores.alias}</Text>}

      <Text style={styles.label}>Correo electrónico</Text>
      <TextInput
        style={styles.input}
        value={correo}
        onChangeText={(texto) => {
          setCorreo(texto);
          setAvisoSinCorreo(false);
        }}
        placeholder="nombre@correo.com"
        placeholderTextColor={PALETA.textoSuave}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        accessibilityLabel="Correo electrónico"
      />
      {errores.correo && <Text style={styles.error}>{errores.correo}</Text>}
      <View style={styles.llave}>
        <Text style={styles.llaveTexto}>
          🔑 Tu correo es la llave para volver a tu grupo si pierdes o cambias el teléfono.
        </Text>
      </View>

      {avisoSinCorreo && (
        <View style={styles.aviso}>
          <Text style={styles.avisoTitulo}>¿Seguir sin correo?</Text>
          <Text style={styles.avisoTexto}>
            Si pierdes el teléfono, no podrás recuperar tu lugar en el grupo por tu cuenta. Puedes
            agregarlo después.
          </Text>
          <Pressable onPress={() => void terminar(false)} accessibilityRole="button">
            <Text style={styles.avisoBoton}>Continuar sin correo</Text>
          </Pressable>
        </View>
      )}

      <Pressable
        onPress={continuar}
        disabled={guardando}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.boton,
          (pressed || guardando) && styles.presionado,
        ]}
      >
        {guardando ? (
          <ActivityIndicator color={PALETA.blanco} />
        ) : (
          <Text style={styles.botonTexto}>Continuar</Text>
        )}
      </Pressable>
    </PantallaFormulario>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 26, fontWeight: '800', color: PALETA.morado, textAlign: 'center' },
  foto: { alignItems: 'center', gap: 8, marginVertical: 6 },
  fotoCirculo: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: PALETA.lilaClaro,
  },
  fotoInicial: { color: PALETA.blanco, fontSize: 44, fontWeight: '800' },
  fotoBoton: { flexDirection: 'row', alignItems: 'center', gap: 8, opacity: 0.6 },
  fotoBotonTexto: { color: PALETA.morado, fontSize: 15, fontWeight: '600' },
  proximamente: {
    backgroundColor: PALETA.lilaClaro,
    color: PALETA.morado,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  label: { fontSize: 15, fontWeight: '600', color: PALETA.moradoOscuro, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: PALETA.borde,
    borderRadius: 12,
    padding: 14,
    fontSize: 17,
    color: PALETA.moradoOscuro,
    backgroundColor: PALETA.blanco,
  },
  inputBloqueado: { backgroundColor: PALETA.lilaClaro, color: PALETA.textoSuave },
  ayuda: { fontSize: 13, color: PALETA.textoSuave },
  error: { color: PALETA.error, fontSize: 14 },
  llave: { backgroundColor: PALETA.crema, borderRadius: 12, padding: 12 },
  llaveTexto: { fontSize: 13, color: PALETA.textoSuave, lineHeight: 19 },
  aviso: {
    borderWidth: 1.5,
    borderColor: PALETA.violeta,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  avisoTitulo: { fontSize: 16, fontWeight: '700', color: PALETA.moradoOscuro },
  avisoTexto: { fontSize: 14, color: PALETA.textoSuave, lineHeight: 20 },
  avisoBoton: { color: PALETA.morado, fontSize: 15, fontWeight: '700', marginTop: 4 },
  boton: {
    backgroundColor: PALETA.morado,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  botonTexto: { color: PALETA.blanco, fontSize: 16, fontWeight: '700' },
  presionado: { opacity: 0.8 },
});
