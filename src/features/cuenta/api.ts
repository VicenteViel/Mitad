import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

// Elimina la cuenta con la Edge Function `eliminar-cuenta` (decisión 6): en
// cada grupo quedas como "Ex-integrante", sin acceso, y tus gastos y saldos se
// conservan para el resto. Después cierra la sesión en este teléfono.
export async function eliminarCuenta(): Promise<void> {
  const { error } = await supabase.functions.invoke('eliminar-cuenta', { method: 'POST' });
  if (error) {
    let mensaje = 'No pudimos eliminar tu cuenta. Intenta de nuevo.';
    if (error instanceof FunctionsHttpError) {
      const cuerpo = (await error.context.json().catch(() => null)) as { error?: string } | null;
      if (cuerpo?.error) mensaje = cuerpo.error;
    }
    throw new Error(mensaje);
  }
  await supabase.auth.signOut();
}
