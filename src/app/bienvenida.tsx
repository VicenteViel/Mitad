import { router, useTheme } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { BotonOpcion } from '@/components/boton-opcion';
import { PantallaFormulario } from '@/components/pantalla-formulario';
import { definirIntencion } from '@/features/auth/intencion';

// Primera pantalla sin sesión: separa a quien empieza de cero de quien vuelve
// a un grupo que ya tenía (por ejemplo, porque perdió el teléfono).
export default function BienvenidaScreen() {
  const { colors } = useTheme();

  function soyNuevo() {
    definirIntencion('crear-grupo');
    router.push('/ingresar');
  }

  function yaTengoGrupo() {
    definirIntencion(null);
    router.push('/recuperar');
  }

  return (
    <PantallaFormulario>
      <Text style={[styles.title, { color: colors.primary }]}>Rumi</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Comparte gastos. Comparte responsabilidades.
      </Text>

      <BotonOpcion
        principal
        titulo="Soy nuevo"
        detalle="No tengo cuenta ni grupo. Quiero crear uno."
        onPress={soyNuevo}
      />
      <BotonOpcion
        titulo="Ya tengo un grupo"
        detalle="Quiero volver a entrar, por ejemplo desde otro teléfono."
        onPress={yaTengoGrupo}
      />
    </PantallaFormulario>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 40, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, opacity: 0.7, textAlign: 'center', marginBottom: 16 },
});
