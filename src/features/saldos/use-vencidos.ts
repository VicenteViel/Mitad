import { useSesion } from '@/features/auth/use-sesion';
import { hoyLocal } from '@/features/gastos/api';
import { useGastos } from '@/features/gastos/use-registrar-gasto';

import { useRumisSaldo, useSaldos } from './use-saldos';
import { calcularVencidos, type Vencido } from './vencidos';

// Lo que tengo vencido en un grupo. Reutiliza las mismas consultas (y caché)
// que la pantalla del grupo.
export function useVencidos(grupoId: string): Vencido[] {
  const { sesion } = useSesion();
  const gastos = useGastos(grupoId);
  const rumis = useRumisSaldo(grupoId);
  const { saldos } = useSaldos(grupoId);

  const yo = rumis.data?.find((r) => r.usuarioId === sesion?.user.id)?.id;
  if (!gastos.data || !saldos) return [];
  return calcularVencidos(gastos.data, saldos.deudas, yo, hoyLocal());
}
