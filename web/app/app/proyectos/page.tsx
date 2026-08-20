'use client';

// Proyectos (rediseño integral, Sesión 6) — todos los proyectos del usuario,
// cruzando todos sus clientes, en un solo listado.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Download } from 'lucide-react';
import { EstadoBadge } from '@/components/app/EstadoBadge';
import { InsigniaBloqueo } from '@/components/app/BloqueoPlan';
import { SkeletonPantalla } from '@/components/app/SkeletonPantalla';
import { useAppData } from '@/components/app/AppDataProvider';
import { proyectosConDatos, diasAtraso } from '@/lib/app-data';
import { capacidadesDe } from '@/lib/planes';
import { exportarProyectosCSV } from '@/lib/csv-export';
import { simboloMoneda } from '@/lib/onboarding';

function monto(moneda: string, valor: number): string {
  return `${moneda} ${simboloMoneda(moneda)}${Math.round(valor).toLocaleString('es')}`;
}

export default function ProyectosPage() {
  const { db, plan, cargando } = useAppData();
  const capacidades = capacidadesDe(plan);
  const [buscar, setBuscar] = useState('');

  const proyectos = useMemo(() => proyectosConDatos(db).sort((a, b) => b.fechaPromesa.localeCompare(a.fechaPromesa)), [db]);

  const filtrados = buscar.trim()
    ? proyectos.filter(
        (p) => p.nombre.toLowerCase().includes(buscar.trim().toLowerCase()) || p.cliente.nombre.toLowerCase().includes(buscar.trim().toLowerCase())
      )
    : proyectos;

  if (cargando) return <SkeletonPantalla />;

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10 md:max-w-none md:px-8 md:pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)] md:text-[24px]">Proyectos</h1>
        <div className="flex items-center gap-2">
          {proyectos.length > 0 &&
            (capacidades.canExportCSV ? (
              <button
                type="button"
                onClick={() => exportarProyectosCSV(proyectos)}
                aria-label="Exportar a CSV"
                className="hidden h-10 items-center gap-1.5 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] px-3 text-[13px] font-semibold text-[var(--text-primary)] md:flex"
              >
                <Download size={14} aria-hidden="true" />
                CSV
              </button>
            ) : (
              <span className="hidden md:block">
                <InsigniaBloqueo plan="pro" />
              </span>
            ))}
          <Link
            href="/app/proyectos/nuevo"
            className="flex h-10 items-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-[var(--bg)]"
          >
            <Plus size={16} aria-hidden="true" />
            Nuevo proyecto
          </Link>
        </div>
      </div>

      {proyectos.length > 5 && (
        <div className="relative mt-4 max-w-[360px]">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar proyecto o cliente"
            className="h-10 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] pl-9 pr-3 text-[13.5px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
          />
        </div>
      )}

      {proyectos.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_35%,transparent)] p-8 text-center">
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">Crea tu primer proyecto</p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Indica qué trabajo realizaste y cuánto acordaron pagarte.</p>
          <Link href="/app/proyectos/nuevo" className="mt-4 flex h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-5 text-[14px] font-semibold text-[var(--bg)]">
            + Crear proyecto
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((p) => (
            <Link key={p.id} href={`/app/clientes/${p.cliente.id}`} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-semibold text-[var(--text-primary)]">{p.nombre}</p>
                  <p className="truncate text-[12px] text-[var(--text-secondary)]">{p.cliente.nombre}</p>
                </div>
                <EstadoBadge estado={p.estado} dias={diasAtraso(p)} />
              </div>
              <div className="mt-3 flex items-center justify-between text-[12.5px]">
                <span className="text-[var(--text-secondary)]">Total {monto(p.cliente.moneda, p.precioTotal)}</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {p.saldo > 0 ? `Falta ${monto(p.cliente.moneda, p.saldo)}` : 'Pagado'}
                </span>
              </div>
              <p className="mt-1.5 text-[11.5px] text-[var(--text-tertiary)]">
                Vence {new Date(p.fechaPromesa).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
