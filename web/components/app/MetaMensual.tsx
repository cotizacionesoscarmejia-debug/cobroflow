'use client';

// Meta mensual (Premium) — cuánto quiere cobrar el usuario este mes, con
// progreso real (nunca inventado). Se usa compacta en el Dashboard y
// completa en Estadísticas.

import { useState } from 'react';
import { Target, Pencil } from 'lucide-react';
import { useAppData } from './AppDataProvider';
import { actualizarMetaMensual, cobradoEsteMesPorMoneda } from '@/lib/app-data';
import { simboloMoneda } from '@/lib/onboarding';

export function MetaMensual({ compacta = false }: { compacta?: boolean }) {
  const { db, monedaPrincipal, metaMensual, recargar } = useAppData();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(metaMensual ? String(metaMensual) : '');
  const [guardando, setGuardando] = useState(false);

  const cobrado = cobradoEsteMesPorMoneda(db)[monedaPrincipal] ?? 0;
  const progreso = metaMensual && metaMensual > 0 ? Math.min(100, Math.round((cobrado / metaMensual) * 100)) : 0;

  async function guardar() {
    const num = Number(valor.replace(',', '.')) || 0;
    setGuardando(true);
    try {
      await actualizarMetaMensual(num > 0 ? num : null);
      await recargar();
      setEditando(false);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className={compacta ? 'rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]' : ''}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--chip-bg)]">
            <Target size={16} color="var(--accent)" aria-hidden="true" />
          </span>
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">Meta mensual</p>
        </div>
        {metaMensual != null && !editando && (
          <button
            type="button"
            onClick={() => {
              setValor(String(metaMensual));
              setEditando(true);
            }}
            aria-label="Editar meta"
            className="flex size-8 items-center justify-center rounded-full text-[var(--text-tertiary)]"
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {editando ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            autoFocus
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value.replace(/[^0-9.,]/g, ''))}
            placeholder={`Ej. 3000 (${monedaPrincipal})`}
            className="h-10 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--bg)] px-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
          />
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="flex h-10 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-3 text-[12.5px] font-semibold text-[var(--bg)] disabled:opacity-40"
          >
            {guardando ? '…' : 'Guardar'}
          </button>
        </div>
      ) : metaMensual != null ? (
        <>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-[20px] font-bold tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
              {monedaPrincipal} {simboloMoneda(monedaPrincipal)}
              {cobrado.toLocaleString('es')}
            </p>
            <p className="text-[12px] text-[var(--text-secondary)]">
              de {monedaPrincipal} {simboloMoneda(monedaPrincipal)}
              {metaMensual.toLocaleString('es')}
            </p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${progreso}%` }} />
          </div>
          <p className="mt-1.5 text-[11.5px] font-medium text-[var(--text-secondary)]">{progreso}% de tu meta este mes</p>
        </>
      ) : (
        <>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Define cuánto quieres cobrar este mes y sigue tu progreso.</p>
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="mt-3 flex h-9 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-[12.5px] font-semibold text-[var(--bg)]"
          >
            Definir meta
          </button>
        </>
      )}
    </div>
  );
}
