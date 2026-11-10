import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { PantallaFormulario } from '@/components/pantalla-formulario';
import { COLORES } from '@/features/grupos/apariencia';
import { useGrupo } from '@/features/grupos/use-grupo';
import { crearInvitacion, linkInvitacion } from '@/features/invitaciones/api';
import { formatearCodigo } from '@/features/invitaciones/codigo';
import { PALETA } from '@/theme/tema';

// El admin crea la invitación de un rumi pendiente: QR para escanear con el
// otro teléfono, código para escribir y botón para compartir el link.
export default function InvitarScreen() {
  const { id, integranteId } = useLocalSearchParams<{ id: string; integranteId: string }>();
  const { data: grupo } = useGrupo(id ?? '');
  const pendiente = grupo?.integrantes.find((i) => i.id === integranteId);
  const { mutate, data: codigo, isPending, error, reset } = useMutation({
    mutationFn: crearInvitacion,
  });

  const link = codigo ? linkInvitacion(codigo) : null;

  function compartir() {
    if (!codigo || !link || !grupo || !pendiente) return;
    void Share.share({
      message:
        `¡Hola ${pendiente.nombre}! Te invito a ser rumi de "${grupo.nombre}" en Rumi.\n\n` +
        `Abre este link en tu teléfono: ${link}\n\n` +
        `O ingresa este código en la app: ${formatearCodigo(codigo)}`,
    });
  }

  return (
    <PantallaFormulario>
      <Text style={styles.titulo} accessibilityRole="header">
        Invitar a {pendiente?.nombre ?? 'un rumi'}
      </Text>

      {pendiente && (
        <View style={[styles.circulo, { backgroundColor: COLORES[pendiente.color] }]}>
          <Text style={styles.inicial}>{pendiente.nombre.charAt(0).toUpperCase()}</Text>
        </View>
      )}

      {!codigo && (
        <>
          <Text style={styles.texto}>
            Crea una invitación para que {pendiente?.nombre ?? 'este rumi'} se una desde su
            teléfono. Vale para una sola persona y vence en 7 días.
          </Text>
          {error && <Text style={styles.error}>No pudimos crear la invitación. Intenta de nuevo.</Text>}
          <Pressable
            onPress={() => integranteId && mutate(integranteId)}
            disabled={isPending || !integranteId}
            accessibilityRole="button"
            style={({ pressed }) => [styles.boton, (pressed || isPending) && styles.presionado]}
          >
            {isPending ? (
              <ActivityIndicator color={PALETA.blanco} />
            ) : (
              <Text style={styles.botonTexto}>Crear invitación</Text>
            )}
          </Pressable>
        </>
      )}

      {codigo && link && (
        <>
          <Text style={styles.texto}>Que lo escanee con la cámara de su teléfono:</Text>
          <View style={styles.qr} accessible accessibilityLabel="Código QR de la invitación">
            <QRCode value={link} size={200} color={PALETA.moradoOscuro} backgroundColor={PALETA.blanco} />
          </View>

          <Text style={styles.texto}>O que ingrese este código en “Me invitaron”:</Text>
          <Text style={styles.codigo} selectable accessibilityLabel={`Código ${formatearCodigo(codigo)}`}>
            {formatearCodigo(codigo)}
          </Text>

          <Pressable
            onPress={compartir}
            accessibilityRole="button"
            style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
          >
            <Text style={styles.botonTexto}>Compartir invitación</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              reset();
              if (integranteId) mutate(integranteId);
            }}
            accessibilityRole="button"
          >
            <Text style={styles.enlace}>Crear una nueva (anula esta)</Text>
          </Pressable>
        </>
      )}

      <Pressable onPress={() => router.back()} accessibilityRole="button">
        <Text style={styles.enlace}>Volver al grupo</Text>
      </Pressable>
    </PantallaFormulario>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 24, fontWeight: '800', color: PALETA.morado, textAlign: 'center' },
  circulo: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicial: { color: PALETA.blanco, fontSize: 26, fontWeight: '800' },
  texto: { fontSize: 15, color: PALETA.textoSuave, textAlign: 'center', lineHeight: 21 },
  error: { color: PALETA.error, fontSize: 14, textAlign: 'center' },
  qr: {
    alignSelf: 'center',
    padding: 14,
    borderRadius: 20,
    backgroundColor: PALETA.blanco,
    borderWidth: 2,
    borderColor: PALETA.lilaClaro,
  },
  codigo: {
    alignSelf: 'center',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 3,
    color: PALETA.morado,
    backgroundColor: PALETA.lilaClaro,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    overflow: 'hidden',
  },
  boton: {
    backgroundColor: PALETA.morado,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  botonTexto: { color: PALETA.blanco, fontSize: 16, fontWeight: '700' },
  presionado: { opacity: 0.8 },
  enlace: { color: PALETA.morado, fontSize: 15, fontWeight: '600', textAlign: 'center', paddingVertical: 6 },
});
