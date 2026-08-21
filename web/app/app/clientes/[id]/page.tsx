'use client';

import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { NumeroAnimado } from '@/components/onboarding/ui';
import { Perforacion, CheckCustom } from '@/components/landing/ui';
import { EstadoBadge } from '@/components/app/EstadoBadge';
import { useAppData } from '@/components/app/AppDataProvider';
import {
  proyectosConDatos,
  diasAtraso,
  registrarPago,
  eliminarCliente,
  eliminarProyecto,
  type ProyectoConDatos,
} from '@/lib/app-data';
import { simboloMoneda } from '@/lib/onboarding';

export default function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { db, cargando, recargar } = useAppData();
  const [registrando, setRegistrando] = useState<string | null>(null);
  const [monto, setMonto] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);
  const [borrarCliente, setBorrarCliente] = useState(false);
  const [proyectoParaBorrar, setProyectoParaBorrar] = useState<ProyectoConDatos | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [errorBorrar, setErrorBorrar] = useState<string | null>(null);

  const proyectos = useMemo(() => proyectosConDatos(db).filter((p) => p.cliente.id === id), [db, id]);
  const pagosDelCliente = useMemo(
    () => db.pagos.filter((pg) => proyectos.some((p) => p.id === pg.proyectoId)).length,
    [db.pagos, proyectos]
  );

  if (cargando) return null;
  if (proyectos.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[480px] px-5 pt-6 text-center">
        <p className="text-[15px] text-[var(--text-secondary)]">No encontramos este cliente.</p>
        <button onClick={() => router.push('/app/clientes')} className="mt-3 text-[14px] font-semibold text-[var(--accent)]">
          Volver a Clientes
        </button>
      </div>
    );
  }

  const cliente = proyectos[0].cliente;
  const saldoTotal = proyectos.reduce((s, p) => s + p.saldo, 0);
  const pagadoTotal = proyectos.reduce((s, p) => s + p.pagado, 0);

  async function confirmarPago(proyectoId: string) {
    // Preauditoría — P0-1: sin esta guarda, un doble-tap podía registrar el
    // mismo pago dos veces (era el único formulario de dinero sin protección).
    if (confirmando) return;
    const montoNum = Number(monto.replace(',', '.')) || 0;
    if (montoNum <= 0) return;
    setConfirmando(true);
    setErrorPago(null);
    try {
      await registrarPago({ clientes: [], proyectos: [], pagos: [] }, proyectoId, montoNum);
      setRegistrando(null);
      setMonto('');
      await recargar();
    } catch {
      setErrorPago('No pudimos guardar el pago. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setConfirmando(false);
    }
  }

  async function confirmarBorrarCliente() {
    setBorrando(true);
    setErrorBorrar(null);
    try {
      await eliminarCliente(id);
      await recargar();
      router.push('/app/clientes');
    } catch {
      setErrorBorrar('No pudimos eliminar al cliente. Intenta de nuevo.');
      setBorrando(false);
    }
  }

  async function confirmarBorrarProyecto() {
    if (!proyectoParaBorrar) return;
    setBorrando(true);
    setErrorBorrar(null);
    try {
      await eliminarProyecto(proyectoParaBorrar.id);
      await recargar();
      setProyectoParaBorrar(null);
    } catch {
      setErrorBorrar('No pudimos eliminar el proyecto. Intenta de nuevo.');
    } finally {
      setBorrando(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push('/app/clientes')}
          aria-label="Volver a clientes"
          className="flex size-11 items-center justify-center rounded-full text-[var(--text-secondary)]"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <div className="flex items-center gap-1">
          <Link
            href={`/app/clientes/${id}/editar`}
            aria-label="Editar cliente"
            className="flex size-10 items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--accent)]"
          >
            <Pencil size={17} aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => setBorrarCliente(true)}
            aria-label="Eliminar cliente"
            className="flex size-10 items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--status-error)]"
          >
            <Trash2 size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-[var(--radius-button)] bg-[var(--chip-bg)] text-[18px] font-bold text-[var(--accent)]"
        >
          {cliente.nombre.slice(0, 2).toUpperCase()}
        </span>
        <div>
          <h1 className="text-[22px] font-bold leading-tight text-[var(--text-primary)] [font-family:var(--font-display)]">
            {cliente.nombre}
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)]">Cliente desde {cliente.creadoEn}</p>
        </div>
      </div>

      <div className="relative mt-6 overflow-hidden rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
        <Perforacion tono={saldoTotal > 0 ? 'accent' : 'neutro'} />
        <p className="text-[13px] text-[var(--text-secondary)]">Saldo pendiente</p>
        <p className="mt-1 text-[32px] font-bold tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
          <NumeroAnimado valor={saldoTotal} prefijo={`${cliente.moneda} ${simboloMoneda(cliente.moneda)}`} />
        </p>
        <div className="mt-3 flex justify-between border-t border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] pt-3 text-[13px]">
          <span className="text-[var(--text-secondary)]">Total facturado</span>
          <span className="tabular-nums font-medium text-[var(--text-primary)]">
            {cliente.moneda} {simboloMoneda(cliente.moneda)}
            {(saldoTotal + pagadoTotal).toLocaleString('es')}
          </span>
        </div>
        <div className="mt-1 flex justify-between text-[13px]">
          <span className="text-[var(--text-secondary)]">Ya pagado</span>
          <span className="tabular-nums font-medium text-[var(--status-success)]">
            {cliente.moneda} {simboloMoneda(cliente.moneda)}
            {pagadoTotal.toLocaleString('es')}
          </span>
        </div>
      </div>

      <h2 className="mt-8 text-[16px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Proyectos</h2>
      <div className="mt-4 flex flex-col gap-3">
        {proyectos.map((p) => (
          <div key={p.id} className="relative overflow-hidden rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
            <Perforacion tono={p.estado === 'atrasado' ? 'accent' : 'neutro'} />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{p.nombre}</p>
                <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
                  {p.saldo > 0
                    ? `Saldo: ${cliente.moneda} ${simboloMoneda(cliente.moneda)}${p.saldo.toLocaleString('es')}`
                    : 'Pagado por completo'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <EstadoBadge estado={p.estado} dias={diasAtraso(p)} />
                <Link
                  href={`/app/proyectos/${p.id}/editar`}
                  aria-label="Editar proyecto"
                  className="flex size-8 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:text-[var(--accent)]"
                >
                  <Pencil size={13} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={() => setProyectoParaBorrar(p)}
                  aria-label="Eliminar proyecto"
                  className="flex size-8 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:text-[var(--status-error)]"
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </div>
            </div>

            {p.saldo > 0 && (
              <div className="mt-3">
                {registrando === p.id ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        inputMode="decimal"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value.replace(/[^0-9.,]/g, ''))}
                        placeholder="Monto recibido"
                        disabled={confirmando}
                        className="h-11 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--bg)] px-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)] disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => confirmarPago(p.id)}
                        disabled={confirmando}
                        aria-label="Confirmar pago"
                        className="flex h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-[var(--bg)] disabled:opacity-60"
                      >
                        <CheckCustom />
                      </button>
                    </div>
                    {errorPago && <p className="mt-2 text-[12.5px] text-[var(--status-error)]">{errorPago}</p>}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRegistrando(p.id)}
                    className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] text-[13px] font-semibold text-[var(--accent)]"
                  >
                    <Plus size={14} aria-hidden="true" />
                    Registrar pago
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirmación de borrado — cliente o proyecto. Nunca inmediato, y siempre
          avisando qué más se va a borrar en cascada (preauditoría P1). */}
      <AnimatePresence>
        {(borrarCliente || proyectoParaBorrar) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_oklab,var(--text-primary)_45%,transparent)] sm:items-center"
            onClick={() => {
              if (borrando) return;
              setBorrarCliente(false);
              setProyectoParaBorrar(null);
              setErrorBorrar(null);
            }}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[360px] rounded-t-[var(--radius-card)] bg-[var(--surface)] p-6 shadow-[var(--shadow-2)] sm:rounded-[var(--radius-card)]"
            >
              {borrarCliente ? (
                <>
                  <h2 className="text-[18px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
                    ¿Eliminar a {cliente.nombre}?
                  </h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                    También se van a eliminar sus {proyectos.length} proyecto{proyectos.length === 1 ? '' : 's'} y{' '}
                    {pagosDelCliente} pago{pagosDelCliente === 1 ? '' : 's'} registrado{pagosDelCliente === 1 ? '' : 's'}.
                    No se puede deshacer.
                  </p>
                </>
              ) : (
                proyectoParaBorrar && (
                  <>
                    <h2 className="text-[18px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
                      ¿Eliminar "{proyectoParaBorrar.nombre}"?
                    </h2>
                    <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                      También se van a eliminar los {db.pagos.filter((pg) => pg.proyectoId === proyectoParaBorrar.id).length} pago
                      {db.pagos.filter((pg) => pg.proyectoId === proyectoParaBorrar.id).length === 1 ? '' : 's'} registrados en este
                      proyecto. No se puede deshacer.
                    </p>
                  </>
                )
              )}
              {errorBorrar && <p className="mt-3 text-[13px] font-medium text-[var(--status-error)]">{errorBorrar}</p>}
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={borrarCliente ? confirmarBorrarCliente : confirmarBorrarProyecto}
                  disabled={borrando}
                  className="flex h-12 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--status-error)] text-[15px] font-semibold text-white disabled:opacity-60"
                >
                  {borrando ? 'Eliminando…' : 'Sí, eliminar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBorrarCliente(false);
                    setProyectoParaBorrar(null);
                    setErrorBorrar(null);
                  }}
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
