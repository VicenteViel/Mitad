import { createContext, useContext, useState, type ReactNode } from 'react';

import {
  ajustarCantidad,
  aplicarCambios,
  borradorVacio,
  integranteVacio,
  type BorradorGrupo,
  type IntegranteBorrador,
} from './borrador-grupo';

type ContextoBorrador = {
  borrador: BorradorGrupo;
  actualizarGrupo: (cambios: Partial<Pick<BorradorGrupo, 'nombre' | 'descripcion'>>) => void;
  actualizarYo: (cambios: Partial<IntegranteBorrador>) => void;
  actualizarIntegrante: (indice: number, cambios: Partial<IntegranteBorrador>) => void;
  definirCantidad: (cantidad: number) => void;
  agregarIntegrante: () => void;
  quitarIntegrante: (indice: number) => void;
};

const Contexto = createContext<ContextoBorrador | null>(null);

// Comparte el borrador entre las pantallas de "nuevo grupo". Al salir del flujo
// el proveedor se desmonta y el borrador se descarta.
export function BorradorGrupoProvider({ children }: { children: ReactNode }) {
  const [borrador, setBorrador] = useState<BorradorGrupo>(borradorVacio);

  const valor: ContextoBorrador = {
    borrador,
    actualizarGrupo: (cambios) => setBorrador((b) => ({ ...b, ...cambios })),
    actualizarYo: (cambios) => setBorrador((b) => ({ ...b, yo: aplicarCambios(b.yo, cambios) })),
    actualizarIntegrante: (indice, cambios) =>
      setBorrador((b) => ({
        ...b,
        integrantes: b.integrantes.map((i, n) => (n === indice ? aplicarCambios(i, cambios) : i)),
      })),
    definirCantidad: (cantidad) =>
      setBorrador((b) => ({ ...b, integrantes: ajustarCantidad(b.integrantes, cantidad) })),
    agregarIntegrante: () =>
      setBorrador((b) => ({ ...b, integrantes: [...b.integrantes, integranteVacio()] })),
    quitarIntegrante: (indice) =>
      setBorrador((b) => ({ ...b, integrantes: b.integrantes.filter((_, n) => n !== indice) })),
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useBorradorGrupo(): ContextoBorrador {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error('useBorradorGrupo debe usarse dentro de BorradorGrupoProvider');
  }
  return contexto;
}
