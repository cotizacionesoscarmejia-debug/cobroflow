'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { CtaFunnel } from '@/components/onboarding/ui';
import { useAppData } from '@/components/app/AppDataProvider';
import { proyectosConDatos, registrarPago } from '@/lib/app-data';
import { simboloMoneda } from '@/lib/onboarding';

export default function NuevoPagoPage() {
  const router = useRouter();
  const { db, recargar } = useAppData();
  const proyectosConSaldo = useMemo(() => proyectosConDatos(db).filter((p) => p.saldo > 0), [db]);

  const [proyectoId, setProyectoId] = useState(proyectosConSaldo[0]?.id ?? '');
  const [monto, setMonto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const proyecto = proyectosConSaldo.find((p) => p.id === proyectoId);

  async function enviar() {
    if (!proyecto) {
      setError('Elige a qué proyecto corresponde este pago.');
      return;
    }
    const montoNum = Number(monto.replace(',', '.')) || 0;
    if (montoNum <= 0) {
      setError('Escribe cuánto recibiste.');
      return;
    }
    setGuardando(true);
    try {
      await registrarPago({ clientes: [], proyectos: [], pagos: [] }, proyecto.id, montoNum);
      await recargar();
      router.push('/app/pagos');
    } catch {
      setError('No pudimos registrar el pago. Intenta de nuevo.');
      setGuardando(false);
    }
  }

  if (proyectosConSaldo.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10 text-center">
        <button type="button" onClick={() => router.back()} aria-label="Atrás" className="flex size-11 items-center justify-center rounded-full text-[var(--text-secondary)]">
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <p className="mt-6 text-[15px] text-[var(--text-secondary)]">No tienes proyectos con saldo pendiente ahora mismo.</p>
        <Link href="/app/proyectos/nuevo" className="mt-3 inline-block text-[14px] font-semibold text-[var(--accent)]">
          + Crear proyecto
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10">
      <button type="button" onClick={() => router.back()} aria-label="Atrás" className="flex size-11 items-center justify-center rounded-full text-[var(--text-secondary)]">
        <ChevronLeft size={22} aria-hidden="true" />
      </button>

      <h1 className="mt-4 text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">Registrar pago</h1>
      <p className="mt-1 text-[14px] text-[var(--text-secondary)]">El saldo pendiente se actualiza solo.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Proyecto</span>
            <div className="relative">
              <select
                value={proyectoId}
                onChange={(e) => setProyectoId(e.target.value)}
                className="h-14 w-full appearance-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 pr-11 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
              >
                {proyectosConSaldo.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.cliente.nombre} — {p.nombre} ({p.cliente.moneda} {simboloMoneda(p.cliente.moneda)}
                    {p.saldo.toLocaleString('es')} pendiente)
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Monto recibido {proyecto ? `(${proyecto.cliente.moneda})` : ''}</span>
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={monto}
              onChange={(e) => setMonto(e.target.value.replace(/[^0-9.,]/g, ''))}
              placeholder="200"
              className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none placeholder:text-[color-mix(in_oklab,var(--text-tertiary)_75%,transparent)] focus-visible:border-[var(--accent)]"
            />
          </label>

          {proyecto && (
            <p className="text-[12.5px] text-[var(--text-tertiary)]">
              Saldo pendiente actual: {proyecto.cliente.moneda} {simboloMoneda(proyecto.cliente.moneda)}
              {proyecto.saldo.toLocaleString('es')}
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-[13px] font-medium text-[var(--status-error)]">
            {error}
          </p>
        )}

        <div className="mt-8">
          <CtaFunnel type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Registrar pago'}
          </CtaFunnel>
        </div>
      </form>
    </div>
  );
}
