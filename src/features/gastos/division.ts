export type Participacion = { integranteId: string; monto: number };

/**
 * Divide un monto en partes iguales, en pesos enteros.
 * `participantes` debe venir ordenado por orden de llegada al grupo.
 */
export function dividirEquitativo(
  monto: number,
  participantes: string[],
  pagadorId: string,
): Participacion[] {
  if (!Number.isInteger(monto) || monto <= 0) {
    throw new Error('El monto debe ser un entero mayor que 0');
  }
  if (participantes.length === 0) {
    throw new Error('Debe haber al menos un participante');
  }
  if (new Set(participantes).size !== participantes.length) {
    throw new Error('Hay participantes repetidos');
  }
  if (monto < participantes.length) {
    throw new Error('El monto es menor que la cantidad de participantes');
  }

  const base = Math.floor(monto / participantes.length);
  const resto = monto - base * participantes.length;
  const pagadorParticipa = participantes.includes(pagadorId);

  return participantes.map((id, i) => {
    const extra = pagadorParticipa
      ? id === pagadorId ? resto : 0
      : i < resto ? 1 : 0;
    return { integranteId: id, monto: base + extra };
  });
}