// Código de invitación: 10 caracteres de un alfabeto sin letras confusas
// (sin 0/O ni 1/I), que se muestra como XXXXX-XXXXX. Debe coincidir con el
// alfabeto de crear_invitacion en Supabase.
export const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const LARGO_CODIGO = 10;

// Mayúsculas y sin guiones ni espacios, para que "abcde-23456 " valga igual.
export function normalizarCodigo(texto: string): string {
  return texto.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function esCodigoValido(texto: string): boolean {
  const codigo = normalizarCodigo(texto);
  return (
    codigo.length === LARGO_CODIGO && [...codigo].every((c) => ALFABETO_CODIGO.includes(c))
  );
}

export function formatearCodigo(texto: string): string {
  const codigo = normalizarCodigo(texto);
  if (codigo.length <= 5) return codigo;
  return `${codigo.slice(0, 5)}-${codigo.slice(5)}`;
}
