'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { CtaFunnel } from '@/components/onboarding/ui';
import {
  obtenerPerfilMoneda,
  actualizarMonedaPrincipal,
  obtenerTasas,
  guardarTasa,
  type TasaCambio,
} from '@/lib/app-data';
import { MONEDAS, simboloMoneda } from '@/lib/onboarding';

export default function MonedasPage() {
  const router = useRouter();
  const [monedaPrincipal, setMonedaPrincipal] = useState('USD');
  const [tasas, setTasas] = useState<TasaCambio[] | null>(null);
  const [origenNueva, setOrigenNueva] = useState<string>('');
  const [tasaNueva, setTasaNueva] = useState('');
  const [guardandoTasa, setGuardandoTasa] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    const [perfil, tasasData] = await Promise.all([obtenerPerfilMoneda(), obtenerTasas()]);
    setMonedaPrincipal(perfil.monedaPrincipal);
    setTasas(tasasData);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cambiarMonedaPrincipal(nueva: string) {
    setMonedaPrincipal(nueva);
    await actualizarMonedaPrincipal(nueva);
  }

  async function enviarTasa() {
    setError(null);
    if (!origenNueva) {
      setError('Elige de qué moneda quieres configurar la tasa.');
      return;
    }
    const tasaNum = Number(tasaNueva.replace(',', '.'));
    if (!tasaNum || tasaNum <= 0) {
      setError('Escribe una tasa válida, mayor que cero.');
      return;
    }
    setGuardandoTasa(true);
    try {
      await guardarTasa(origenNueva, monedaPrincipal, tasaNum);
      setOrigenNueva('');
      setTasaNueva('');
      await cargar();
    } catch {
      setError('No pudimos guardar la tasa. Intenta de nuevo.');
    } finally {
      setGuardandoTasa(false);
    }
  }

  const monedasParaOrigen = MONEDAS.filter((m) => m !== monedaPrincipal);

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10">
      <button
        type="button"
        onClick={() => router.push('/app/cuenta')}
        aria-label="Volver a Cuenta"
        className="flex size-11 items-center justify-center rounded-full text-[var(--text-secondary)]"
      >
        <ChevronLeft size={22} aria-hidden="true" />
      </button>

      <h1 className="mt-2 text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
        Moneda y tipo de cambio
      </h1>
      <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
        Tu moneda principal se usa para metas, proyecciones y tus totales consolidados.
      </p>

      <div className="mt-6 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--text-secondary)]">Moneda principal de tu negocio</span>
          <div className="relative">
            <select
              value={monedaPrincipal}
              onChange={(e) => cambiarMonedaPrincipal(e.target.value)}
              className="h-14 w-full appearance-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--bg)] px-4 pr-11 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            >
              {MONEDAS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              aria-hidden="true"
            />
          </div>
        </label>
      </div>

      <h2 className="mt-8 text-[16px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
        Tipos de cambio
      </h2>
      <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
        Configura manualmente cuánto vale cada moneda en {monedaPrincipal}. Sin una tasa configurada, esa moneda se
        muestra separada — nunca se inventa una conversión.
      </p>

      {tasas === null ? (
        <div className="mt-4 h-16 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
      ) : tasas.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2">
          {tasas.map((t) => (
            <div
              key={t.monedaOrigen}
              className="flex items-center justify-between rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]"
            >
              <div>
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                  1 {t.monedaOrigen} {simboloMoneda(t.monedaOrigen)} = {t.tasa} {t.monedaDestino}
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">Actualizado: {t.actualizadoEn}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-[13px] text-[var(--text-tertiary)]">
          Todavía no tienes tasas configuradas.
        </p>
      )}

      {monedasParaOrigen.length > 0 && (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_35%,transparent)] p-4">
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">Agregar o actualizar una tasa</p>
          <div className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--text-secondary)]">Moneda de origen</span>
              <div className="relative">
                <select
                  value={origenNueva}
                  onChange={(e) => setOrigenNueva(e.target.value)}
                  className="h-14 w-full appearance-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 pr-11 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                >
                  <option value="">Elige una moneda</option>
                  {monedasParaOrigen.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
                  aria-hidden="true"
                />
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--text-secondary)]">
                1 {origenNueva || 'moneda'} equivale a cuántos {monedaPrincipal}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={tasaNueva}
                onChange={(e) => setTasaNueva(e.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="Ej. 7.65"
                className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none placeholder:text-[color-mix(in_oklab,var(--text-tertiary)_75%,transparent)] focus-visible:border-[var(--accent)]"
              />
            </label>
            {error && (
              <p role="alert" className="text-[13px] font-medium text-[var(--status-error)]">
                {error}
              </p>
            )}
            <CtaFunnel onClick={enviarTasa} disabled={guardandoTasa}>
              {guardandoTasa ? 'Guardando…' : 'Guardar tasa'}
            </CtaFunnel>
          </div>
        </div>
      )}
    </div>
  );
}
