'use client';

// Pagos (rediseño integral, Sesión 6) — historial de todos los pagos
// recibidos, cruzando todos los clientes/proyectos. Cada pago ya actualizó
// (vía el Radar de Cobros) el saldo/estado/panel principal/estadísticas al
// registrarse — esta pantalla solo LEE ese mismo cálculo, nunca duplica lógica.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Search, Download, Trash2, Pencil } from 'lucide-react';
import { useAppData } from '@/components/app/AppDataProvider';
import { pagosConDatos, eliminarPago, actualizarPago, type PagoConDatos } from '@/lib/app-data';
import { capacidadesDe } from '@/lib/planes';
import { InsigniaBloqueo } from '@/components/app/BloqueoPlan';
import { SkeletonPantalla } from '@/components/app/SkeletonPantalla';
import { simboloMoneda } from '@/lib/onboarding';
import { exportarPagosCSV } from '@/lib/csv-export';

function monto(moneda: string, valor: number): string {
  return `${moneda} ${simboloMoneda(moneda)}${Math.round(valor).toLocaleString('es')}`;
}

export default function PagosPage() {
  const { db, plan, cargando, recargar } = useAppData();
  const capacidades = capacidadesDe(plan);
  const [buscar, setBuscar] = useState('');
  const [porBorrar, setPorBorrar] = useState<PagoConDatos | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [porEditar, setPorEditar] = useState<PagoConDatos | null>(null);
  const [montoEditado, setMontoEditado] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);

  const pagos = useMemo(() => pagosConDatos(db), [db]);

  async function confirmarBorrado() {
    if (!porBorrar) return;
    setBorrando(true);
    try {
      await eliminarPago(porBorrar.id);
      await recargar();
      setPorBorrar(null);
    } finally {
      setBorrando(false);
    }
  }

  function abrirEdicion(p: PagoConDatos) {
    setPorEditar(p);
    setMontoEditado(String(p.monto));
    setErrorEdicion(null);
  }

  async function confirmarEdicion() {
    if (!porEditar) return;
    const montoNum = Number(montoEditado.replace(',', '.')) || 0;
    if (montoNum <= 0) {
      setErrorEdicion('Escribe un monto válido.');
      return;
    }
    setGuardandoEdicion(true);
    setErrorEdicion(null);
    try {
      await actualizarPago(porEditar.id, montoNum);
      await recargar();
      setPorEditar(null);
    } catch {
      setErrorEdicion('No pudimos guardar el cambio. Intenta de nuevo.');
    } finally {
      setGuardandoEdicion(false);
    }
  }
  const filtrados = buscar.trim()
    ? pagos.filter(
        (p) => p.cliente.nombre.toLowerCase().includes(buscar.trim().toLowerCase()) || p.proyecto.nombre.toLowerCase().includes(buscar.trim().toLowerCase())
      )
    : pagos;

  if (cargando) return <SkeletonPantalla />;

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10 md:max-w-none md:px-8 md:pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)] md:text-[24px]">Pagos</h1>
        <div className="flex items-center gap-2">
          {pagos.length > 0 &&
            (capacidades.canExportCSV ? (
              <button
                type="button"
                onClick={() => exportarPagosCSV(pagos)}
                aria-label="Exportar a CSV"
                className="flex h-10 items-center gap-1.5 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] px-3 text-[13px] font-semibold text-[var(--text-primary)]"
              >
                <Download size={14} aria-hidden="true" />
                CSV
              </button>
            ) : (
              <InsigniaBloqueo plan="pro" />
            ))}
          <Link href="/app/pagos/nuevo" className="flex h-10 items-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-[var(--bg)]">
            <Plus size={16} aria-hidden="true" />
            Registrar pago
          </Link>
        </div>
      </div>

      {pagos.length > 5 && (
        <div className="relative mt-4 max-w-[360px]">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar cliente o proyecto"
            className="h-10 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] pl-9 pr-3 text-[13.5px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
          />
        </div>
      )}

      {pagos.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_35%,transparent)] p-8 text-center">
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">Registra tu primer pago</p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Cada pago actualiza automáticamente lo que todavía tienes pendiente.</p>
          <Link href="/app/pagos/nuevo" className="mt-4 flex h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-5 text-[14px] font-semibold text-[var(--bg)]">
            + Registrar pago
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 hidden overflow-x-auto rounded-[var(--radius-card)] bg-[var(--surface)] shadow-[var(--shadow-1)] md:block">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="text-[12px] text-[var(--text-tertiary)]">
                  <th className="px-5 pb-0 pt-4 font-medium">Fecha</th>
                  <th className="px-3 pb-0 pt-4 font-medium">Cliente</th>
                  <th className="px-3 pb-0 pt-4 font-medium">Proyecto</th>
                  <th className="px-5 pb-0 pt-4 font-medium">Monto</th>
                  <th className="px-5 pb-0 pt-4 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.id} className="border-t border-[color-mix(in_oklab,var(--text-tertiary)_12%,transparent)]">
                    <td className="px-5 py-3 text-[var(--text-secondary)]">
                      {new Date(p.fecha).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/app/clientes/${p.cliente.id}`} className="font-medium text-[var(--text-primary)]">
                        {p.cliente.nombre}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-[var(--text-secondary)]">{p.proyecto.nombre}</td>
                    <td className="px-5 py-3 font-semibold tabular-nums text-[var(--status-success)]">+{monto(p.cliente.moneda, p.monto)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => abrirEdicion(p)}
                          aria-label="Editar pago"
                          className="flex size-8 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:text-[var(--accent)]"
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPorBorrar(p)}
                          aria-label="Eliminar pago"
                          className="flex size-8 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:text-[var(--status-error)]"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-col gap-2.5 md:hidden">
            {filtrados.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
                <Link href={`/app/clientes/${p.cliente.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{p.cliente.nombre}</p>
                  <p className="truncate text-[12px] text-[var(--text-secondary)]">
                    {p.proyecto.nombre} · {new Date(p.fecha).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </p>
                </Link>
                <span className="shrink-0 text-[14px] font-bold tabular-nums text-[var(--status-success)]">+{monto(p.cliente.moneda, p.monto)}</span>
                <button
                  type="button"
                  onClick={() => abrirEdicion(p)}
                  aria-label="Editar pago"
                  className="ml-1 flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--text-tertiary)]"
                >
                  <Pencil size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setPorBorrar(p)}
                  aria-label="Eliminar pago"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--text-tertiary)]"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Editar monto — a pedido del usuario tras la preauditoría. */}
      <AnimatePresence>
        {porEditar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_oklab,var(--text-primary)_45%,transparent)] sm:items-center"
            onClick={() => !guardandoEdicion && setPorEditar(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[360px] rounded-t-[var(--radius-card)] bg-[var(--surface)] p-6 shadow-[var(--shadow-2)] sm:rounded-[var(--radius-card)]"
            >
              <h2 className="text-[18px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
                Editar monto
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                {porEditar.cliente.nombre} · {porEditar.proyecto.nombre}
              </p>
              <label className="mt-4 flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[var(--text-secondary)]">Monto ({porEditar.cliente.moneda})</span>
                <input
                  autoFocus
                  inputMode="decimal"
                  value={montoEditado}
                  onChange={(e) => setMontoEditado(e.target.value.replace(/[^0-9.,]/g, ''))}
                  disabled={guardandoEdicion}
                  className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--bg)] px-4 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)] disabled:opacity-60"
                />
              </label>
              {errorEdicion && <p className="mt-2 text-[13px] font-medium text-[var(--status-error)]">{errorEdicion}</p>}
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={confirmarEdicion}
                  disabled={guardandoEdicion}
                  className="flex h-12 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[15px] font-semibold text-[var(--bg)] disabled:opacity-60"
                >
                  {guardandoEdicion ? 'Guardando…' : 'Guardar cambio'}
                </button>
                <button
                  type="button"
                  onClick={() => setPorEditar(null)}
                  disabled={guardandoEdicion}
                  className="flex h-12 w-full items-center justify-center rounded-[var(--radius-button)] text-[15px] font-semibold text-[var(--text-secondary)]"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmación de borrado — nunca inmediato, panel de expertos + preauditoría (P1-1/P0-2) */}
      <AnimatePresence>
        {porBorrar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_oklab,var(--text-primary)_45%,transparent)] sm:items-center"
            onClick={() => !borrando && setPorBorrar(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[360px] rounded-t-[var(--radius-card)] bg-[var(--surface)] p-6 shadow-[var(--shadow-2)] sm:rounded-[var(--radius-card)]"
            >
              <h2 className="text-[18px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
                ¿Eliminar este pago?
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                {porBorrar.cliente.nombre} — {monto(porBorrar.cliente.moneda, porBorrar.monto)}. El saldo de este
                cliente se va a recalcular sin este pago. No se puede deshacer.
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={confirmarBorrado}
                  disabled={borrando}
                  className="flex h-12 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--status-error)] text-[15px] font-semibold text-white disabled:opacity-60"
                >
                  {borrando ? 'Eliminando…' : 'Sí, eliminar'}
                </button>
                <button
                  type="button"
                  onClick={() => setPorBorrar(null)}
                  disabled={borrando}
                  className="flex h-12 w-full items-center justify-center rounded-[var(--radius-button)] text-[15px] font-semibold text-[var(--text-secondary)]"
                >
                  Mejor no
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
