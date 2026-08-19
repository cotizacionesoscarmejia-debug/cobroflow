'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { CtaFunnel } from '@/components/onboarding/ui';
import { useAppData } from '@/components/app/AppDataProvider';
import { agregarGasto, CATEGORIAS_GASTO } from '@/lib/app-data';
import { capacidadesDe } from '@/lib/planes';
import { MONEDAS } from '@/lib/onboarding';

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NuevoGastoPage() {
  const router = useRouter();
  const { plan, monedaPrincipal, recargar } = useAppData();
  const capacidades = capacidadesDe(plan);

  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState(monedaPrincipal);
  const [fecha, setFecha] = useState(hoyISO());
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [recurrente, setRecurrente] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function enviar() {
    const montoNum = Number(monto.replace(',', '.')) || 0;
    if (montoNum <= 0) {
      setError('Escribe cuánto gastaste.');
      return;
    }
    setGuardando(true);
    try {
      await agregarGasto({
        monto: montoNum,
        moneda,
        categoria: capacidades.canCategorizeExpenses && categoria ? categoria : null,
        descripcion: descripcion.trim(),
        fecha,
        recurrente: capacidades.canCategorizeExpenses ? recurrente : false,
      });
      await recargar();
      router.push('/app/gastos');
    } catch {
      setError('No pudimos registrar el gasto. Intenta de nuevo.');
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10">
      <button type="button" onClick={() => router.back()} aria-label="Atrás" className="flex size-11 items-center justify-center rounded-full text-[var(--text-secondary)]">
        <ChevronLeft size={22} aria-hidden="true" />
      </button>

      <h1 className="mt-4 text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">Registrar gasto</h1>
      <p className="mt-1 text-[14px] text-[var(--text-secondary)]">Se descuenta de tu utilidad neta de este mes.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Descripción</span>
            <input
              type="text"
              autoFocus
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Suscripción de diseño"
              className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none placeholder:text-[color-mix(in_oklab,var(--text-tertiary)_75%,transparent)] focus-visible:border-[var(--accent)]"
            />
          </label>

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--text-secondary)]">Monto</span>
              <input
                type="text"
                inputMode="decimal"
                value={monto}
                onChange={(e) => setMonto(e.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="50"
                className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none placeholder:text-[color-mix(in_oklab,var(--text-tertiary)_75%,transparent)] focus-visible:border-[var(--accent)]"
              />
            </label>
            <label className="flex w-[110px] flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--text-secondary)]">Moneda</span>
              <div className="relative">
                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                  className="h-14 w-full appearance-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3 pr-8 text-[15px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                >
                  {MONEDAS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
              </div>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Fecha</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 text-[15px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
          </label>

          {capacidades.canCategorizeExpenses && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[var(--text-secondary)]">Categoría</span>
                <div className="relative">
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="h-14 w-full appearance-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 pr-11 text-[15px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                  >
                    <option value="">Sin categoría</option>
                    {CATEGORIAS_GASTO.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={recurrente}
                  onChange={(e) => setRecurrente(e.target.checked)}
                  className="size-5 accent-[var(--accent)]"
                />
                <span className="flex-1 text-[13.5px] text-[var(--text-primary)]">
                  Es un gasto recurrente (se repite cada mes)
                </span>
              </label>
            </>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-[13px] font-medium text-[var(--status-error)]">
            {error}
          </p>
        )}

        <div className="mt-8">
          <CtaFunnel type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Registrar gasto'}
          </CtaFunnel>
        </div>
      </form>
    </div>
  );
}
