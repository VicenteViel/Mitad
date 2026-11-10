import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PALETA } from '@/theme/tema';

import type { EvidenciaGasto, OrigenEvidencia } from '../api-detalle';
import { esImagenPermitida, puedeBorrarEvidencia, TAMANO_MAXIMO_BYTES } from '../evidencia';
import { textoFecha } from '../historial';
import { useBorrarEvidencia, useEvidencias, useSubirEvidencia } from '../use-detalle-gasto';

type Props = {
  grupoId: string;
  origen: OrigenEvidencia;
  miIntegranteId: string | undefined;
  soyAdmin: boolean;
  hoy: string;
};

// "Evidencia": capturas de comprobantes de un gasto (boletas) o de un pago
// (transferencias). Cualquier rumi sube; borra quien la subió o un admin.
// Tocar una imagen la abre en grande.
export function SeccionEvidencia({ grupoId, origen, miIntegranteId, soyAdmin, hoy }: Props) {
  const evidencias = useEvidencias(origen);
  const subir = useSubirEvidencia(origen);
  const borrar = useBorrarEvidencia(origen);
  const [abierta, setAbierta] = useState<EvidenciaGasto | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function elegirImagen() {
    setAviso(null);
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });
    if (resultado.canceled) return;

    const imagen = resultado.assets[0];
    if (!esImagenPermitida(imagen.mimeType ?? 'image/jpeg')) {
      setAviso('Elige una imagen (JPG, PNG, HEIC o WEBP).');
      return;
    }
    if (imagen.fileSize && imagen.fileSize > TAMANO_MAXIMO_BYTES) {
      setAviso('La imagen pesa más de 5 MB. Prueba con otra captura.');
      return;
    }
    subir.mutate({ grupoId, origen, uri: imagen.uri, mimeType: imagen.mimeType });
  }

  function confirmarBorrado(evidencia: EvidenciaGasto) {
    Alert.alert('¿Borrar esta evidencia?', 'La imagen se elimina para todos los rumis.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () => {
          setAbierta(null);
          borrar.mutate(evidencia.id);
        },
      },
    ]);
  }

  return (
    <View style={styles.seccion}>
      <Text style={styles.titulo}>Evidencia</Text>
      <Text style={styles.ayuda}>
        {origen.tipo === 'gasto'
          ? 'Sube la boleta o una captura para que todos la vean.'
          : 'Sube la captura de la transferencia para que todos la vean.'}
      </Text>

      {evidencias.isPending && <ActivityIndicator color={PALETA.morado} />}
      {evidencias.isError && (
        <Text style={styles.error}>No pudimos cargar las evidencias.</Text>
      )}

      {evidencias.data && evidencias.data.length > 0 && (
        <View style={styles.galeria}>
          {evidencias.data.map((evidencia) => (
            <Pressable
              key={evidencia.id}
              onPress={() => setAbierta(evidencia)}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Evidencia de ${evidencia.subidaPorNombre}`}
              style={styles.miniatura}
            >
              {evidencia.url ? (
                <Image source={{ uri: evidencia.url }} style={styles.miniaturaImagen} />
              ) : (
                <View style={[styles.miniaturaImagen, styles.sinImagen]}>
                  <Text style={styles.sinImagenTexto}>Sin vista previa</Text>
                </View>
              )}
              <Text style={styles.autor} numberOfLines={1}>
                {evidencia.subidaPorNombre} · {textoFecha(evidencia.subidaEn.slice(0, 10), hoy)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {evidencias.data?.length === 0 && (
        <Text style={styles.vacio}>Todavía no hay comprobantes.</Text>
      )}

      {aviso && <Text style={styles.error}>{aviso}</Text>}
      {subir.isError && <Text style={styles.error}>{subir.error.message}</Text>}
      {borrar.isError && <Text style={styles.error}>{borrar.error.message}</Text>}

      <Pressable
        onPress={() => void elegirImagen()}
        disabled={subir.isPending}
        accessibilityRole="button"
        style={({ pressed }) => [styles.boton, (pressed || subir.isPending) && styles.presionado]}
      >
        {subir.isPending ? (
          <ActivityIndicator color={PALETA.morado} />
        ) : (
          <Text style={styles.botonTexto}>＋ Subir comprobante</Text>
        )}
      </Pressable>

      {/* Imagen en grande */}
      <Modal visible={abierta !== null} transparent animationType="fade" onRequestClose={() => setAbierta(null)}>
        <View style={styles.modalFondo}>
          {abierta?.url && (
            <Image
              source={{ uri: abierta.url }}
              style={styles.modalImagen}
              resizeMode="contain"
              accessibilityLabel={`Evidencia de ${abierta.subidaPorNombre}`}
            />
          )}
          <Text style={styles.modalAutor}>Subida por {abierta?.subidaPorNombre}</Text>
          <View style={styles.modalAcciones}>
            {abierta && puedeBorrarEvidencia(abierta.subidaPorId, miIntegranteId, soyAdmin) && (
              <Pressable
                onPress={() => confirmarBorrado(abierta)}
                accessibilityRole="button"
                style={[styles.modalBoton, styles.modalBorrar]}
              >
                <Text style={styles.modalBotonTexto}>Borrar</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setAbierta(null)}
              accessibilityRole="button"
              style={styles.modalBoton}
            >
              <Text style={styles.modalBotonTexto}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  seccion: {
    backgroundColor: PALETA.blanco,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  titulo: { fontSize: 18, fontWeight: '800', color: PALETA.moradoOscuro },
  ayuda: { fontSize: 14, color: PALETA.textoSuave, lineHeight: 20 },
  error: { fontSize: 14, color: PALETA.error },
  vacio: { fontSize: 14, color: PALETA.textoSuave, fontStyle: 'italic' },
  galeria: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  miniatura: { width: 96, gap: 4 },
  miniaturaImagen: { width: 96, height: 128, borderRadius: 12, backgroundColor: PALETA.lilaClaro },
  sinImagen: { alignItems: 'center', justifyContent: 'center', padding: 6 },
  sinImagenTexto: { fontSize: 11, color: PALETA.textoSuave, textAlign: 'center' },
  autor: { fontSize: 11, color: PALETA.textoSuave },
  boton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: PALETA.violeta,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonTexto: { color: PALETA.morado, fontSize: 15, fontWeight: '700' },
  presionado: { opacity: 0.7 },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(20, 6, 34, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 14,
  },
  modalImagen: { width: '100%', height: '70%' },
  modalAutor: { color: PALETA.lilaClaro, fontSize: 14 },
  modalAcciones: { flexDirection: 'row', gap: 12 },
  modalBoton: {
    backgroundColor: PALETA.morado,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  modalBorrar: { backgroundColor: PALETA.error },
  modalBotonTexto: { color: PALETA.blanco, fontSize: 15, fontWeight: '700' },
});
