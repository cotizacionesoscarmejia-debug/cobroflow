// Exportación a PDF — SOLO Premium (24-DEL-MVP-AL-PRODUCTO / plan gating en cuenta/page.tsx).
// Se genera 100% en el navegador con datos reales del usuario autenticado — nunca
// datos ficticios. Nunca suma monedas distintas: cada tabla va agrupada por
// moneda (misma regla que el dashboard multimoneda de la Fase 1).

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { simboloMoneda } from './onboarding';
import {
  type DB,
  type TasaCambio,
  proyectosConDatos,
  totalesPorMoneda,
  totalConsolidado,
} from './app-data';

export type PeriodoReporte = 'mes' | 'trimestre' | 'todo';

export interface PerfilReporte {
  nombre: string;
  apellido: string;
  email: string;
  nombreNegocio: string;
}

interface DatosReporte {
  db: DB;
  perfil: PerfilReporte;
  monedaPrincipal: string;
  tasas: TasaCambio[];
  periodo: PeriodoReporte;
}

const VERDE_ACENTO: [number, number, number] = [24, 124, 81];
const GRIS_TEXTO: [number, number, number] = [30, 30, 30];
const GRIS_SECUNDARIO: [number, number, number] = [120, 120, 120];

function nombrePeriodo(periodo: PeriodoReporte): string {
  if (periodo === 'mes') return 'Este mes';
  if (periodo === 'trimestre') return 'Últimos 3 meses';
  return 'Todo el historial';
}

function fechaDesde(periodo: PeriodoReporte): string | null {
  if (periodo === 'todo') return null;
  const d = new Date();
  if (periodo === 'mes') {
    d.setDate(1);
  } else {
    d.setMonth(d.getMonth() - 3);
  }
  return d.toISOString().slice(0, 10);
}

function monto(m: string, valor: number): string {
  return `${simboloMoneda(m)}${valor.toLocaleString('es')}`;
}

export function generarReportePDF({ db, perfil, monedaPrincipal, tasas, periodo }: DatosReporte): void {
  const desde = fechaDesde(periodo);
  const proyectos = proyectosConDatos(db);
  const pagosPeriodo = desde ? db.pagos.filter((p) => p.fecha >= desde) : db.pagos;

  const cobradoItems = pagosPeriodo.map((p) => {
    const proyecto = db.proyectos.find((pr) => pr.id === p.proyectoId);
    const cliente = proyecto ? db.clientes.find((c) => c.id === proyecto.clienteId) : undefined;
    return { moneda: cliente?.moneda ?? monedaPrincipal, monto: p.monto };
  });
  const cobradoPorMoneda = totalesPorMoneda(cobradoItems);

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

  const monedasUsadas = Array.from(new Set(db.clientes.map((c) => c.moneda))).sort();
  const monedasParaTabla = monedasUsadas.length > 0 ? monedasUsadas : [monedaPrincipal];

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = 46;

  function franjaAcento(): void {
    doc.setFillColor(...VERDE_ACENTO);
    doc.rect(0, 0, pageWidth, 5, 'F');
  }

  function saltoDePaginaSiHaceFalta(alturaNecesaria: number): void {
    if (y + alturaNecesaria > pageHeight - 50) {
      doc.addPage();
      franjaAcento();
      y = 46;
    }
  }

  franjaAcento();

  // ── Encabezado ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(...GRIS_TEXTO);
  doc.text('Reporte financiero', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRIS_SECUNDARIO);
  doc.text('CobroFlow · cobroflow.app', pageWidth - margin, y, { align: 'right' });
  y += 26;

  const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`.trim() || perfil.email;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...GRIS_TEXTO);
  doc.text(nombreCompleto, margin, y);
  y += 15;
  if (perfil.nombreNegocio) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...GRIS_SECUNDARIO);
    doc.text(perfil.nombreNegocio, margin, y);
    y += 15;
  }

  doc.setFontSize(9);
  doc.setTextColor(...GRIS_SECUNDARIO);
  const fechaGen = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Fecha de generación: ${fechaGen}`, margin, y);
  y += 13;
  doc.text(`Período analizado: ${nombrePeriodo(periodo)}`, margin, y);
  y += 13;
  doc.text(`Moneda${monedasParaTabla.length > 1 ? 's' : ''}: ${monedasParaTabla.join(', ')}`, margin, y);
  y += 24;

  // ── Resumen financiero (nunca se suman monedas distintas) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...GRIS_TEXTO);
  doc.text('Resumen financiero', margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['Moneda', 'Cobrado', 'Pendiente', 'Atrasado', 'Próximos 30 días']],
    body: monedasParaTabla.map((m) => [
      m,
      monto(m, cobradoPorMoneda[m] ?? 0),
      monto(m, pendientePorMoneda[m] ?? 0),
      monto(m, atrasadoPorMoneda[m] ?? 0),
      monto(m, proximoPorMoneda[m] ?? 0),
    ]),
    margin: { left: margin, right: margin },
    headStyles: { fillColor: VERDE_ACENTO, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 6, textColor: GRIS_TEXTO },
    theme: 'grid',
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 16;

  if (monedasParaTabla.length > 1) {
    const consolidado = totalConsolidado(pendientePorMoneda, monedaPrincipal, tasas);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (consolidado.faltantes.length === 0) {
      doc.setTextColor(...GRIS_TEXTO);
      doc.text(
        `Total pendiente consolidado en ${monedaPrincipal}: ${monto(monedaPrincipal, consolidado.total)}`,
        margin,
        y
      );
      y += 12;
      doc.setFontSize(8);
      doc.setTextColor(...GRIS_SECUNDARIO);
      doc.text('Conversión calculada con las tasas de cambio configuradas en tu cuenta.', margin, y);
      y += 18;
    } else {
      doc.setTextColor(170, 90, 20);
      doc.text(
        `No se pudo calcular el total consolidado: falta configurar el tipo de cambio de ${consolidado.faltantes.join(', ')} a ${monedaPrincipal} (Cuenta → Moneda y tipo de cambio).`,
        margin,
        y,
        { maxWidth: pageWidth - margin * 2 }
      );
      y += 26;
    }
  }
  y += 8;

  // ── Estadísticas relevantes ──
  saltoDePaginaSiHaceFalta(80);
  const totalClientes = db.clientes.length;
  const totalProyectos = proyectos.length;
  const proyectosPagados = proyectos.filter((p) => p.estado === 'pagado').length;
  const pctCobrado = totalProyectos > 0 ? Math.round((proyectosPagados / totalProyectos) * 100) : 0;
  const ticketPromedioPorMoneda: Record<string, number> = {};
  for (const m of monedasParaTabla) {
    const deEstaMoneda = proyectos.filter((p) => p.cliente.moneda === m);
    if (deEstaMoneda.length > 0) {
      ticketPromedioPorMoneda[m] = Math.round(
        deEstaMoneda.reduce((s, p) => s + p.precioTotal, 0) / deEstaMoneda.length
      );
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...GRIS_TEXTO);
  doc.text('Estadísticas', margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    body: [
      ['Clientes activos', String(totalClientes)],
      ['Proyectos totales', String(totalProyectos)],
      ['Proyectos ya cobrados por completo', `${proyectosPagados} de ${totalProyectos} (${pctCobrado}%)`],
      [
        'Ticket promedio por proyecto',
        monedasParaTabla.map((m) => (ticketPromedioPorMoneda[m] ? `${m} ${monto(m, ticketPromedioPorMoneda[m])}` : null)).filter(Boolean).join(' · ') || '—',
      ],
    ],
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 6, textColor: GRIS_TEXTO },
    theme: 'plain',
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 220 } },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 16;

  // ── Gráfica simple: cobrado vs pendiente vs atrasado (moneda principal o la única) ──
  const monedaGrafica = monedasParaTabla.includes(monedaPrincipal) ? monedaPrincipal : monedasParaTabla[0];
  if (monedaGrafica) {
    saltoDePaginaSiHaceFalta(120);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...GRIS_TEXTO);
    doc.text(`Cobrado vs. pendiente vs. atrasado (${monedaGrafica})`, margin, y);
    y += 16;

    const valores: [string, number, [number, number, number]][] = [
      ['Cobrado', cobradoPorMoneda[monedaGrafica] ?? 0, VERDE_ACENTO],
      ['Pendiente', pendientePorMoneda[monedaGrafica] ?? 0, [201, 122, 46]],
      ['Atrasado', atrasadoPorMoneda[monedaGrafica] ?? 0, [190, 60, 60]],
    ];
    const maxValor = Math.max(1, ...valores.map((v) => v[1]));
    const anchoMaxBarra = pageWidth - margin * 2 - 140;
    const altoBarra = 16;

    for (const [etiqueta, valor, color] of valores) {
      doc.setFontSize(9);
      doc.setTextColor(...GRIS_TEXTO);
      doc.text(etiqueta, margin, y + altoBarra - 5);
      const anchoBarra = Math.max(2, (valor / maxValor) * anchoMaxBarra);
      doc.setFillColor(...color);
      doc.rect(margin + 90, y, anchoBarra, altoBarra, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...GRIS_SECUNDARIO);
      doc.text(monto(monedaGrafica, valor), margin + 90 + anchoBarra + 6, y + altoBarra - 5);
      y += altoBarra + 8;
    }
    y += 14;
  }

  // ── Clientes principales (por monto total: pagado + pendiente) ──
  saltoDePaginaSiHaceFalta(60);
  const porCliente = new Map<string, { nombre: string; moneda: string; total: number; pendiente: number }>();
  for (const p of proyectos) {
    const actual = porCliente.get(p.cliente.id) ?? {
      nombre: p.cliente.nombre,
      moneda: p.cliente.moneda,
      total: 0,
      pendiente: 0,
    };
    actual.total += p.precioTotal;
    actual.pendiente += p.saldo;
    porCliente.set(p.cliente.id, actual);
  }
  const topClientes = Array.from(porCliente.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...GRIS_TEXTO);
  doc.text('Clientes principales', margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['Cliente', 'Moneda', 'Total acordado', 'Pendiente']],
    body:
      topClientes.length > 0
        ? topClientes.map((c) => [c.nombre, c.moneda, monto(c.moneda, c.total), monto(c.moneda, c.pendiente)])
        : [['Sin clientes registrados todavía', '—', '—', '—']],
    margin: { left: margin, right: margin },
    headStyles: { fillColor: VERDE_ACENTO, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 6, textColor: GRIS_TEXTO },
    theme: 'grid',
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 16;

  // ── Proyectos ──
  saltoDePaginaSiHaceFalta(60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...GRIS_TEXTO);
  doc.text('Proyectos', margin, y);
  y += 8;

  const NOMBRE_ESTADO: Record<string, string> = {
    pagado: 'Pagado',
    atrasado: 'Atrasado',
    vence_hoy: 'Vence hoy',
    proximo: 'Próximo',
    al_dia: 'Al día',
  };

  autoTable(doc, {
    startY: y,
    head: [['Cliente', 'Proyecto', 'Moneda', 'Total', 'Pagado', 'Pendiente', 'Estado']],
    body:
      proyectos.length > 0
        ? proyectos.map((p) => [
            p.cliente.nombre,
            p.nombre,
            p.cliente.moneda,
            monto(p.cliente.moneda, p.precioTotal),
            monto(p.cliente.moneda, p.pagado),
            monto(p.cliente.moneda, p.saldo),
            NOMBRE_ESTADO[p.estado] ?? p.estado,
          ])
        : [['Sin proyectos registrados todavía', '', '', '', '', '', '']],
    margin: { left: margin, right: margin },
    headStyles: { fillColor: VERDE_ACENTO, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 5, textColor: GRIS_TEXTO },
    theme: 'grid',
  });

  // ── Gastos: función no disponible todavía en CobroFlow — se dice explícitamente,
  // nunca se inventa un número. ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 16;
  saltoDePaginaSiHaceFalta(30);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...GRIS_SECUNDARIO);
  doc.text('Gastos: CobroFlow todavía no registra gastos del negocio (próximamente).', margin, y);

  // ── Pie de página con numeración ──
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRIS_SECUNDARIO);
    doc.text(`CobroFlow · Página ${i} de ${totalPaginas}`, pageWidth / 2, pageHeight - 22, { align: 'center' });
  }

  doc.save(`reporte-cobroflow-${new Date().toISOString().slice(0, 10)}.pdf`);
}
