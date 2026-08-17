// Construye el resumen financiero AGREGADO que se le manda a la IA para
// "Analizar mi negocio" (Premium). Regla dura del proyecto (ver CLAUDE.md y
// docs/sistema/30-INTEGRACION-IA.md): la IA nunca recibe datos crudos de
// clientes/proyectos, solo este JSON ya calculado — toda la aritmética
// (sumas, agrupación por moneda, consolidado) se hace aquí en código, nunca
// se le delega al modelo. Mismas reglas de multimoneda que el Dashboard y el
// reporte PDF: nunca se suman monedas distintas sin tasa configurada.

import {
  type DB,
  type TasaCambio,
  proyectosConDatos,
  totalesPorMoneda,
  totalConsolidado,
  cobradoEsteMesPorMoneda,
  cobradoMesAnteriorPorMoneda,
} from './app-data';

export interface ResumenPorMoneda {
  cobradoEsteMes: number;
  cobradoMesAnterior: number;
  pendiente: number;
  atrasado: number;
  proximoAVencer: number;
  clientesActivos: number;
  proyectosActivos: number;
  ticketPromedio: number;
}

export type ConsolidadoResumen =
  | { disponible: true; cobradoEsteMes: number; pendiente: number }
  | { disponible: false; faltanTasasPara: string[] };

export interface ResumenNegocio {
  monedaPrincipal: string;
  monedas: string[];
  porMoneda: Record<string, ResumenPorMoneda>;
  consolidado: ConsolidadoResumen;
  gastos: null;
}

export function construirResumenNegocio(db: DB, monedaPrincipal: string, tasas: TasaCambio[]): ResumenNegocio {
  const proyectos = proyectosConDatos(db);
  const monedasDetectadas = Array.from(new Set(db.clientes.map((c) => c.moneda))).sort();
  const monedas = monedasDetectadas.length > 0 ? monedasDetectadas : [monedaPrincipal];

  const cobradoEsteMes = cobradoEsteMesPorMoneda(db);
  const cobradoMesAnterior = cobradoMesAnteriorPorMoneda(db);
  const pendientes = proyectos.filter((p) => p.saldo > 0);
  const pendientePorMoneda = totalesPorMoneda(pendientes.map((p) => ({ moneda: p.cliente.moneda, monto: p.saldo })));
  const atrasadoPorMoneda = totalesPorMoneda(
    pendientes.filter((p) => p.estado === 'atrasado').map((p) => ({ moneda: p.cliente.moneda, monto: p.saldo }))
  );
  const proximoPorMoneda = totalesPorMoneda(
    pendientes
      .filter((p) => p.estado === 'proximo' || p.estado === 'vence_hoy')
      .map((p) => ({ moneda: p.cliente.moneda, monto: p.saldo }))
  );

  const porMoneda: Record<string, ResumenPorMoneda> = {};
  for (const m of monedas) {
    const clientesDeEstaMoneda = new Set(db.clientes.filter((c) => c.moneda === m).map((c) => c.id));
    const proyectosDeEstaMoneda = proyectos.filter((p) => p.cliente.moneda === m);
    const ticketPromedio =
      proyectosDeEstaMoneda.length > 0
        ? Math.round(proyectosDeEstaMoneda.reduce((s, p) => s + p.precioTotal, 0) / proyectosDeEstaMoneda.length)
        : 0;
    porMoneda[m] = {
      cobradoEsteMes: Math.round(cobradoEsteMes[m] ?? 0),
      cobradoMesAnterior: Math.round(cobradoMesAnterior[m] ?? 0),
      pendiente: Math.round(pendientePorMoneda[m] ?? 0),
      atrasado: Math.round(atrasadoPorMoneda[m] ?? 0),
      proximoAVencer: Math.round(proximoPorMoneda[m] ?? 0),
      clientesActivos: clientesDeEstaMoneda.size,
      proyectosActivos: proyectosDeEstaMoneda.length,
      ticketPromedio,
    };
  }

  let consolidado: ConsolidadoResumen;
  if (monedas.length <= 1) {
    consolidado = {
      disponible: true,
      cobradoEsteMes: Math.round(cobradoEsteMes[monedaPrincipal] ?? 0),
      pendiente: Math.round(pendientePorMoneda[monedaPrincipal] ?? 0),
    };
  } else {
    const cCobrado = totalConsolidado(cobradoEsteMes, monedaPrincipal, tasas);
    const cPendiente = totalConsolidado(pendientePorMoneda, monedaPrincipal, tasas);
    const faltantes = Array.from(new Set([...cCobrado.faltantes, ...cPendiente.faltantes]));
    if (faltantes.length === 0) {
      consolidado = { disponible: true, cobradoEsteMes: Math.round(cCobrado.total), pendiente: Math.round(cPendiente.total) };
    } else {
      consolidado = { disponible: false, faltanTasasPara: faltantes };
    }
  }

  return { monedaPrincipal, monedas, porMoneda, consolidado, gastos: null };
}
