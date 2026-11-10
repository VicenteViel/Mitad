// Reglas puras de las evidencias de un gasto (capturas de comprobantes).

const EXTENSIONES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/webp': 'webp',
};

// Tipos que acepta el bucket "evidencias" en Supabase.
export function esImagenPermitida(mime: string | null | undefined): boolean {
  return !!mime && mime.toLowerCase() in EXTENSIONES;
}

export function extensionDeMime(mime: string | null | undefined): string {
  return (mime && EXTENSIONES[mime.toLowerCase()]) || 'jpg';
}

// Ruta en Storage: {grupo}/{gasto}/{archivo}. La primera carpeta es el grupo:
// así las políticas de Storage deciden quién puede verla.
export function rutaEvidencia(
  grupoId: string,
  gastoId: string,
  archivoId: string,
  mime: string | null | undefined,
): string {
  return `${grupoId}/${gastoId}/${archivoId}.${extensionDeMime(mime)}`;
}

// Puede borrar quien la subió o un admin del grupo.
export function puedeBorrarEvidencia(
  subidaPorId: string,
  miIntegranteId: string | undefined,
  soyAdmin: boolean,
): boolean {
  return soyAdmin || (miIntegranteId !== undefined && subidaPorId === miIntegranteId);
}

export const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;
