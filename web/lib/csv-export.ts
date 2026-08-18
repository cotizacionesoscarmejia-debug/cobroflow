// Exportación a CSV (Pro+) — rediseño integral, Sesión 6. 100% en el
// navegador, sin dependencias nuevas: arma el CSV a mano y lo descarga como
// Blob. Datos reales del usuario, nunca inventados.

import type { Cliente, ProyectoConDatos, PagoConDatos } from './app-data';

function escaparCSV(valor: string): string {
  if (/[",\n]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
  return valor;
}

function descargarCSV(nombreArchivo: string, filas: string[][]): void {
  const csv = filas.map((fila) => fila.map(escaparCSV).join(',')).join('\r\n');
  // ﻿: BOM UTF-8, para que Excel abra bien los acentos.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const hoy = () => new Date().toISOString().slice(0, 10);

export function exportarPagosCSV(pagos: PagoConDatos[]): void {
  const filas = [
    ['Fecha', 'Cliente', 'Proyecto', 'Moneda', 'Monto'],
    ...pagos.map((p) => [p.fecha, p.cliente.nombre, p.proyecto.nombre, p.cliente.moneda, String(p.monto)]),
  ];
  descargarCSV(`pagos-cobroflow-${hoy()}.csv`, filas);
}

export function exportarClientesCSV(clientes: Cliente[]): void {
  const filas = [
    ['Nombre', 'Teléfono', 'Moneda', 'Cliente desde'],
    ...clientes.map((c) => [c.nombre, c.telefono ?? '', c.moneda, c.creadoEn]),
  ];
  descargarCSV(`clientes-cobroflow-${hoy()}.csv`, filas);
}

export function exportarProyectosCSV(proyectos: ProyectoConDatos[]): void {
  const filas = [
    ['Cliente', 'Proyecto', 'Moneda', 'Precio total', 'Pagado', 'Pendiente', 'Estado', 'Fecha de vencimiento'],
    ...proyectos.map((p) => [p.cliente.nombre, p.nombre, p.cliente.moneda, String(p.precioTotal), String(p.pagado), String(p.saldo), p.estado, p.fechaPromesa]),
  ];
  descargarCSV(`proyectos-cobroflow-${hoy()}.csv`, filas);
}
