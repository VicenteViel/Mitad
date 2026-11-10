import { useQuery } from '@tanstack/react-query';

import { obtenerGrupo } from './api';

export function claveGrupo(grupoId: string) {
  return ['grupo', grupoId] as const;
}

export function useGrupo(grupoId: string) {
  return useQuery({
    queryKey: claveGrupo(grupoId),
    queryFn: () => obtenerGrupo(grupoId),
    enabled: grupoId.length > 0,
  });
}
