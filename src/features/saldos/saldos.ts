// Cálculo de saldos (modelo-datos.md → "Saldos por par" y "Saldo por integrante").
// Los saldos nunca se guardan: se derivan de los gastos y pagos no borrados.
// Todo en pesos enteros: sumas y restas de enteros, sin redondeos.

export type GastoParaSaldo = {
  pagadoPor: string;
  eliminado: boolean;
  participaciones: { integranteId: string; monto: number }[];
};

export type PagoParaSaldo = {
  de: string;
  a: string;
  monto: number;
  eliminado: boolean;
};

// "deudor le debe monto a acreedor", ya compensado dentro del par.
export type Deuda = { deudor: string; acreedor: string; monto: number };

export type Saldos = {
  // Positivo: le deben. Negativo: debe. Cero: al día.
  netos: Map<string, number>;
  // Una deuda por par como máximo, de mayor a menor monto.
  deudas: Deuda[];
};

function clavePar(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function calcularSaldos(gastos: GastoParaSaldo[], pagos: PagoParaSaldo[]): Saldos {
  const netos = new Map<string, number>();
  const sumarNeto = (id: string, monto: number) => netos.set(id, (netos.get(id) ?? 0) + monto);

  // Por par ordenado (menor, mayor): cuánto le debe "menor" a "mayor".
  // Negativo significa que "mayor" le debe a "menor".
  const pares = new Map<string, { menor: string; mayor: string; saldo: number }>();
  const sumarDeuda = (deudor: string, acreedor: string, monto: number) => {
    const [menor, mayor] = clavePar(deudor, acreedor);
    const clave = `${menor}|${mayor}`;
    const par = pares.get(clave) ?? { menor, mayor, saldo: 0 };
    par.saldo += deudor === menor ? monto : -monto;
    pares.set(clave, par);
  };

  for (const gasto of gastos) {
    if (gasto.eliminado) continue;
    for (const p of gasto.participaciones) {
      sumarNeto(gasto.pagadoPor, p.monto);
      sumarNeto(p.integranteId, -p.monto);
      // Cada participante distinto de quien pagó le debe su parte.
      if (p.integranteId !== gasto.pagadoPor) {
        sumarDeuda(p.integranteId, gasto.pagadoPor, p.monto);
      }
    }
  }

  for (const pago of pagos) {
    if (pago.eliminado) continue;
    // Quien paga reduce lo que debe (o queda con saldo a favor si paga de más).
    sumarNeto(pago.de, pago.monto);
    sumarNeto(pago.a, -pago.monto);
    sumarDeuda(pago.a, pago.de, pago.monto);
  }

  const deudas: Deuda[] = [];
  for (const { menor, mayor, saldo } of pares.values()) {
    if (saldo > 0) deudas.push({ deudor: menor, acreedor: mayor, monto: saldo });
    else if (saldo < 0) deudas.push({ deudor: mayor, acreedor: menor, monto: -saldo });
  }
  deudas.sort((x, y) => y.monto - x.monto || x.deudor.localeCompare(y.deudor));

  // Quita los ceros para que "al día" sea simplemente no tener neto.
  for (const [id, neto] of netos) if (neto === 0) netos.delete(id);

  return { netos, deudas };
}

// Deudas donde participa un integrante (para "tus deudas").
export function deudasDe(saldos: Saldos, integranteId: string): Deuda[] {
  return saldos.deudas.filter((d) => d.deudor === integranteId || d.acreedor === integranteId);
}
