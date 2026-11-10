// Edge Function: elimina la cuenta de quien la llama (decisión 6).
//
// 1. Verifica el JWT de la persona (solo puede borrarse a sí misma).
// 2. Anonimiza sus integrantes en todos sus grupos (anonimizar_usuario):
//    quedan como "Ex-integrante", sin acceso, conservando gastos y saldos.
// 3. Borra el usuario de Supabase Auth (requiere la clave de servicio, que
//    solo existe en el servidor y nunca en la app).
//
// Despliegue: npx supabase functions deploy eliminar-cuenta
import { createClient } from 'npm:@supabase/supabase-js@2';

function respuesta(estado: number, cuerpo: Record<string, unknown>): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return respuesta(405, { error: 'Método no permitido' });
  }

  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) {
    return respuesta(401, { error: 'No autenticado' });
  }

  const url = Deno.env.get('SUPABASE_URL');
  const claveServicio = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !claveServicio) {
    return respuesta(500, { error: 'Configuración incompleta' });
  }

  const admin = createClient(url, claveServicio, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error: errorUsuario } = await admin.auth.getUser(jwt);
  if (errorUsuario || !data.user) {
    return respuesta(401, { error: 'Sesión no válida' });
  }
  const usuarioId = data.user.id;

  const { error: errorAnonimizar } = await admin.rpc('anonimizar_usuario', {
    p_usuario_id: usuarioId,
  });
  if (errorAnonimizar) {
    console.error('anonimizar_usuario falló', errorAnonimizar.message);
    return respuesta(500, { error: 'No pudimos eliminar tus datos' });
  }

  const { error: errorBorrar } = await admin.auth.admin.deleteUser(usuarioId);
  if (errorBorrar) {
    // Los datos ya quedaron anonimizados; reintentar es seguro.
    console.error('deleteUser falló', errorBorrar.message);
    return respuesta(500, { error: 'No pudimos eliminar tu cuenta. Intenta de nuevo.' });
  }

  return respuesta(200, { ok: true });
});
