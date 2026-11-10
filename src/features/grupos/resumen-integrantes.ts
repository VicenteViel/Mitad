import type { IntegranteDetalle } from './api';

export type EtiquetasIntegrante = {
  esYo: boolean;
  esAdmin: boolean;
  esPendiente: boolean;
};

export function etiquetasIntegrante(
  integrante: IntegranteDetalle,
  miUsuarioId: string | undefined,
): EtiquetasIntegrante {
  return {
    esYo: miUsuarioId !== undefined && integrante.usuarioId === miUsuarioId,
    esAdmin: integrante.rol === 'admin',
    esPendiente: integrante.usuarioId === null,
  };
}

// Conteo para el encabezado: "4 rumis · 2 pendientes".
export function contarIntegrantes(integrantes: IntegranteDetalle[]): string {
  const total = integrantes.length;
  const pendientes = integrantes.filter((i) => i.usuarioId === null).length;
  const textoTotal = total === 1 ? '1 rumi' : `${total} rumis`;
  if (pendientes === 0) return textoTotal;
  return `${textoTotal} · ${pendientes === 1 ? '1 pendiente' : `${pendientes} pendientes`}`;
}
