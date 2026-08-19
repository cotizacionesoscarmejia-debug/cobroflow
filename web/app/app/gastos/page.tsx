'use client';

// Gastos (Pro+; categorías y recurrencia solo Premium) — lo que sale, para
// saber la utilidad neta real (cobrado - gastado), no solo lo cobrado.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Repeat, Trash2 } from 'lucide-react';
import { BloqueoPlan } from '@/components/app/BloqueoPlan';
import { useAppData } from '@/components/app/AppDataProvider';
import { cobradoEsteMesPorMoneda, gastadoEsteMesPorMoneda, eliminarGasto } from '@/lib/app-data';
import { capacidadesDe } from '@/lib/planes';
import { simboloMoneda } from '@/lib/onboarding';

function monto(moneda: string, valor: number): string {
  return `${moneda} ${simboloMoneda(moneda)}${Math.round(valor).toLocaleString('es')}`;
}

export default function GastosPage() {
  const { db, gastos, plan, perfil, recargar } = useAppData();
  const capacidades = capacidadesDe(plan);
  const [borrando, setBorrando] = useState<string | null>(null);

  const cobrado = useMemo(() => cobradoEsteMesPorMoneda(db), [db]);
  const gastado = useMemo(() => gastadoEsteMesPorMoneda(gastos), [gastos]);
  const monedas = useMemo(() => Array.from(new Set([...Object.keys(cobrado), ...Object.keys(gastado)])), [cobrado, gastado]);

  async function borrar(id: string) {
    setBorrando(id);
    try {
      await eliminarGasto(id);
      await recargar();
    } finally {
      setBorrando(null);
    }
  }

  if (!capacidades.canUseExpenses) {
    return (
      <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10 md:max-w-none md:px-8 md:pb-12">
        <h1 className="text-[22px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)] md:text-[24px]">Gastos</h1>
        <p className="mt-1 text-[13.5px] text-[var(--text-secondary)]">Lo que sale, para saber cuánto ganas de verdad.</p>
        <div className="mt-6">
          <BloqueoPlan
            plan="pro"
            titulo="Registra tus gastos y ve tu utilidad neta"
            descripcion="Cobrado menos gastado: cuánto te queda de verdad, no solo cuánto facturaste."
            email={perfil.email}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10 md:max-w-none md:px-8 md:pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)] md:text-[24px]">Gastos</h1>
        <Link href="/app/gastos/nuevo" className="flex h-10 items-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-[var(--bg)]">
          <Plus size={16} aria-hidden="true" />
          Registrar gasto
        </Link>
      </div>

      {monedas.length > 0 && (
        <div className="mt-5 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] md:p-5">
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Utilidad neta este mes</h2>
          <div className="mt-3 flex flex-col gap-3">
            {monedas.map((m) => {
              const c = cobrado[m] ?? 0;
              const g = gastado[m] ?? 0;
              const neto = c - g;
              return (
                <div key={m} className="flex items-center justify-between">
                  <span className="text-[13px] text-[var(--text-secondary)]">
                    {m}: {monto(m, c)} cobrado − {monto(m, g)} gastado
                  </span>
                  <span
                    className="text-[14px] font-bold tabular-nums"
                    style={{ color: neto >= 0 ? 'var(--status-success)' : 'var(--status-error)' }}
                  >
                    {monto(m, neto)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {gastos.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_35%,transparent)] p-8 text-center">
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">Registra tu primer gasto</p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Software, transporte, contratistas — lo que te cuesta operar.</p>
          <Link href="/app/gastos/nuevo" className="mt-4 flex h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-5 text-[14px] font-semibold text-[var(--bg)]">
            + Registrar gasto
          </Link>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2.5">
          {gastos.map((g) => (
            <div key={g.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[var(--text-primary)]">
                  {g.descripcion || g.categoria || 'Gasto'}
                </p>
                <p className="truncate text-[12px] text-[var(--text-secondary)]">
                  {new Date(g.fecha).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  {g.categoria ? ` · ${g.categoria}` : ''}
                  {g.recurrente ? ' · Recurrente' : ''}
                </p>
              </div>
              {g.recurrente && <Repeat size={14} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />}
              <span className="shrink-0 text-[14px] font-bold tabular-nums text-[var(--status-error)]">-{monto(g.moneda, g.monto)}</span>
              <button
                type="button"
                onClick={() => borrar(g.id)}
                disabled={borrando === g.id}
                aria-label="Eliminar gasto"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--text-tertiary)] disabled:opacity-40"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
