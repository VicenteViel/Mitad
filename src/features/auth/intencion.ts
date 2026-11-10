// Lo que la persona eligió en la bienvenida, para llevarla al lugar correcto
// apenas inicie sesión. Vive solo en memoria: si cierra la app, se pierde, y
// eso está bien (al volver entra a Inicio).

export type Intencion = 'crear-grupo' | null;

let intencion: Intencion = null;

export function definirIntencion(nueva: Intencion): void {
  intencion = nueva;
}

// Devuelve la intención y la borra, para que se use una sola vez.
export function consumirIntencion(): Intencion {
  const actual = intencion;
  intencion = null;
  return actual;
}
