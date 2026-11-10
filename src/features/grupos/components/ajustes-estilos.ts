import { StyleSheet } from 'react-native';

import { PALETA } from '@/theme/tema';

// Estilos compartidos por las secciones de "Ajustes del grupo".
export const estilosAjustes = StyleSheet.create({
  seccion: { backgroundColor: PALETA.blanco, borderRadius: 20, padding: 16, gap: 10 },
  titulo: { fontSize: 17, fontWeight: '800', color: PALETA.moradoOscuro },
  ayuda: { fontSize: 13, color: PALETA.textoSuave, lineHeight: 19 },
  label: { fontSize: 14, fontWeight: '600', color: PALETA.moradoOscuro },
  input: {
    borderWidth: 1,
    borderColor: PALETA.borde,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: PALETA.moradoOscuro,
    backgroundColor: PALETA.blanco,
  },
  boton: {
    backgroundColor: PALETA.morado,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botonTexto: { color: PALETA.blanco, fontSize: 15, fontWeight: '700' },
  botonSecundario: {
    borderWidth: 1.5,
    borderColor: PALETA.violeta,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  botonSecundarioTexto: { color: PALETA.morado, fontSize: 14, fontWeight: '700' },
  botonPeligro: {
    backgroundColor: PALETA.error,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  botonPeligroTexto: { color: PALETA.blanco, fontSize: 14, fontWeight: '700' },
  presionado: { opacity: 0.8 },
  error: { color: PALETA.error, fontSize: 14 },
  ok: { color: '#1E8E5A', fontSize: 14, fontWeight: '600' },
});
