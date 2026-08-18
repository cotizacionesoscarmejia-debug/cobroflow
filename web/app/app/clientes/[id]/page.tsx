'use client';

import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus } from 'lucide-react';
import { NumeroAnimado } from '@/components/onboarding/ui';
import { Perforacion, CheckCustom } from '@/components/landing/ui';
import { EstadoBadge } from '@/components/app/EstadoBadge';
import { useAppData } from '@/components/app/AppDataProvider';
import { proyectosConDatos, diasAtraso, registrarPago } from '@/lib/app-data';
import { simboloMoneda } from '@/lib/onboarding';

export default function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { db, cargando, recargar } = useAppData();
  const [registrando, setRegistrando] = useState<string | null>(null);
  const [monto, setMonto] = useState('');

  const proyectos = useMemo(() => proyectosConDatos(db).filter((p) => p.cliente.id === id), [db, id]);

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
    const montoNum = Number(monto.replace(',', '.')) || 0;
    if (montoNum <= 0) return;
    await registrarPago({ clientes: [], proyectos: [], pagos: [] }, proyectoId, montoNum);
    setRegistrando(null);
    setMonto('');
    await recargar();
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10">
      <button
        type="button"
        onClick={() => router.push('/app/clientes')}
        aria-label="Volver a clientes"
        className="flex size-11 items-center justify-center rounded-full text-[var(--text-secondary)]"
      >
        <ChevronLeft size={22} aria-hidden="true" />
      </button>

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
              <EstadoBadge estado={p.estado} dias={diasAtraso(p)} />
            </div>

            {p.saldo > 0 && (
              <div className="mt-3">
                {registrando === p.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      inputMode="decimal"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value.replace(/[^0-9.,]/g, ''))}
                      placeholder="Monto recibido"
                      className="h-11 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--bg)] px-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => confirmarPago(p.id)}
                      className="flex h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-[var(--bg)]"
                    >
                      <CheckCustom />
                    </button>
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
    </div>
  );
}
