import { useMutation } from '@tanstack/react-query';

import { agregarIntegrantes, type NuevoIntegrante } from './api';

type Variables = {
  grupoId: string;
  integrantes: NuevoIntegrante[];
};

export function useAgregarIntegrantes() {
  return useMutation({
    mutationFn: ({ grupoId, integrantes }: Variables) => agregarIntegrantes(grupoId, integrantes),
  });
}
