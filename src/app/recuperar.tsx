import { router, useTheme } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { BotonOpcion } from '@/components/boton-opcion';
import { PantallaFormulario } from '@/components/pantalla-formulario';
import { PALETA } from '@/theme/tema';

type Paso = 'rol' | 'correo-integrante' | 'sin-correo';

// Volver a un grupo existente. Los grupos están vinculados a la cuenta, así que
// quien tenía correo los recupera al ingresar con ese mismo correo (el código
// que llega al correo prueba que es la misma persona). Quien no tenía cuenta
// necesita un nuevo link de invitación de un admin (decisión 9).
export default function RecuperarScreen() {
  const { colors } = useTheme();
  const [paso, setPaso] = useState<Paso>('rol');

  function ingresarConCorreo() {
    router.push('/ingresar');
  }

  return (
    <PantallaFormulario>
      {paso === 'rol' && (
        <>
          <Text style={[styles.title, { color: colors.primary }]}>¿Cuál era tu rol?</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>En el grupo al que quieres volver</Text>
          <BotonOpcion
            principal
            titulo="Era el administrador"
            detalle="Ingresa con el mismo correo de antes y recuperas tus grupos."
            onPress={ingresarConCorreo}
          />
          <BotonOpcion
            titulo="Era un integrante"
            onPress={() => setPaso('correo-integrante')}
          />
        </>
      )}

      {paso === 'correo-integrante' && (
        <>
          <Text style={[styles.title, { color: colors.primary }]}>¿Ingresabas con tu correo?</Text>
          <BotonOpcion
            principal
            titulo="Sí, tenía correo"
            detalle="Ingresa con ese correo y vuelves a tus grupos."
            onPress={ingresarConCorreo}
          />
          <BotonOpcion
            titulo="No, nunca usé correo"
            onPress={() => setPaso('sin-correo')}
          />
        </>
      )}

      {paso === 'sin-correo' && (
        <>
          <Text style={[styles.title, { color: colors.primary }]}>Pide un nuevo link</Text>
          <Text style={[styles.texto, { color: colors.text }]}>
            Pídele al administrador de tu grupo que te envíe un nuevo link de invitación. Al
            abrirlo en este teléfono recuperas tu lugar en el grupo, con tus gastos y tu saldo.
          </Text>
        </>
      )}

      <Pressable
        onPress={() => (paso === 'rol' ? router.back() : setPaso('rol'))}
        accessibilityRole="button"
        style={styles.volver}
      >
        <Text style={styles.volverTexto}>Volver</Text>
      </Pressable>
    </PantallaFormulario>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, opacity: 0.7, textAlign: 'center', marginBottom: 8 },
  texto: { fontSize: 16, lineHeight: 23, textAlign: 'center' },
  volver: { paddingVertical: 8, marginTop: 4 },
  volverTexto: { color: PALETA.morado, fontSize: 16, textAlign: 'center' },
});
