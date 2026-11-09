import { useMutation } from '@tanstack/react-query';

import { crearGrupo } from './api';

export function useCrearGrupo() {
  return useMutation({
    mutationFn: crearGrupo,
  });
}