// Exportación a PDF del análisis de negocio con IA — SOLO Premium (misma
// función que ya generó el análisis en pantalla). Se genera 100% en el
// navegador con el contenido que ya devolvió la IA, sin volver a llamarla.

import jsPDF from 'jspdf';

export interface AnalisisReporte {
  resumen: string;
  positivos: string[];
  alertas: string[];
  recomendaciones: string[];
  proximos_pasos: string[];
}

export interface PerfilReporte {
  nombre: string;
  apellido: string;
  email: string;
  nombreNegocio: string;
}

const VERDE_ACENTO: [number, number, number] = [24, 124, 81];
const ROJO_ALERTA: [number, number, number] = [190, 60, 60];
const GRIS_TEXTO: [number, number, number] = [30, 30, 30];
const GRIS_SECUNDARIO: [number, number, number] = [120, 120, 120];

export function generarAnalisisPDF(analisis: AnalisisReporte, perfil: PerfilReporte, fecha: Date = new Date()): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const anchoTexto = pageWidth - margin * 2;
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

  function parrafo(texto: string, tamano = 10, color: [number, number, number] = GRIS_TEXTO): void {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(tamano);
    doc.setTextColor(...color);
    const lineas = doc.splitTextToSize(texto, anchoTexto) as string[];
    for (const linea of lineas) {
      saltoDePaginaSiHaceFalta(16);
      doc.text(linea, margin, y);
      y += 15;
    }
  }

  function seccion(titulo: string, items: string[], colorViñeta: [number, number, number] = VERDE_ACENTO): void {
    if (items.length === 0) return;
    saltoDePaginaSiHaceFalta(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...GRIS_TEXTO);
    doc.text(titulo, margin, y);
    y += 18;
    for (const item of items) {
      const lineas = doc.splitTextToSize(item, anchoTexto - 16) as string[];
      saltoDePaginaSiHaceFalta(lineas.length * 14 + 6);
      doc.setFillColor(...colorViñeta);
      doc.circle(margin + 3, y - 4, 2.2, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...GRIS_TEXTO);
      for (let i = 0; i < lineas.length; i++) {
        doc.text(lineas[i], margin + 14, y);
        y += 14;
      }
      y += 4;
    }
    y += 8;
  }

  franjaAcento();

  // ── Encabezado ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(...GRIS_TEXTO);
  doc.text('Análisis de tu negocio', margin, y);
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
  const fechaGen = fecha.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Fecha de generación: ${fechaGen}`, margin, y);
  y += 24;

  // ── Resumen ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...GRIS_TEXTO);
  doc.text('Resumen', margin, y);
  y += 16;
  parrafo(analisis.resumen);
  y += 8;

  seccion('Lo que va bien', analisis.positivos, VERDE_ACENTO);
  seccion('Alertas', analisis.alertas, ROJO_ALERTA);
  seccion('Recomendaciones', analisis.recomendaciones, VERDE_ACENTO);
  seccion('Próximos pasos', analisis.proximos_pasos, VERDE_ACENTO);

  // ── Nota de IA ──
  saltoDePaginaSiHaceFalta(40);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...GRIS_SECUNDARIO);
  const nota = doc.splitTextToSize(
    'Este análisis fue generado con inteligencia artificial a partir de un resumen numérico de tu cuenta. Interprétalo como una guía, no como asesoría financiera profesional.',
    anchoTexto
  ) as string[];
  for (const linea of nota) {
    doc.text(linea, margin, y);
    y += 11;
  }

  // ── Pie de página con numeración ──
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRIS_SECUNDARIO);
    doc.text(`CobroFlow · Página ${i} de ${totalPaginas}`, pageWidth / 2, pageHeight - 22, { align: 'center' });
  }

  doc.save(`analisis-cobroflow-${fecha.toISOString().slice(0, 10)}.pdf`);
}
