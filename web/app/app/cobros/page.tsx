'use client';

// Centro de Cobros (rediseño integral, Sesión 6) — el centro operativo: quién
// debe, cuánto, cuándo vence, qué está atrasado/parcial, con filtros y
// acciones rápidas. El envío de recordatorios (mensaje + WhatsApp) vive en
// /app/recordatorios — aquí solo se enlaza, para no duplicar esa lógica.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, MessageCircle, ChevronRight, Filter } from 'lucide-react';
import { EstadoBadge } from '@/components/app/EstadoBadge';
import { InsigniaBloqueo } from '@/components/app/BloqueoPlan';
import { SkeletonPantalla } from '@/components/app/SkeletonPantalla';
import { useAppData } from '@/components/app/AppDataProvider';
import { proyectosConDatos, diasAtraso, type ProyectoConDatos } from '@/lib/app-data';
import { capacidadesDe } from '@/lib/planes';
import { simboloMoneda } from '@/lib/onboarding';

type Filtro = 'todos' | 'pendientes' | 'parciales' | 'atrasados' | 'pagados';

const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'pendientes', etiqueta: 'Pendientes' },
  { valor: 'parciales', etiqueta: 'Parciales' },
  { valor: 'atrasados', etiqueta: 'Atrasados' },
  { valor: 'pagados', etiqueta: 'Pagados' },
];

function monto(moneda: string, valor: number): string {
  return `${moneda} ${simboloMoneda(moneda)}${Math.round(valor).toLocaleString('es')}`;
}

function esParcial(p: ProyectoConDatos): boolean {
  return p.pagado > 0 && p.saldo > 0;
}

function coincideFiltro(p: ProyectoConDatos, filtro: Filtro): boolean {
  switch (filtro) {
    case 'todos':
      return true;
    case 'pagados':
      return p.estado === 'pagado';
    case 'atrasados':
      return p.estado === 'atrasado';
    case 'parciales':
      return esParcial(p) && p.estado !== 'atrasado';
    case 'pendientes':
      return p.saldo > 0 && !esParcial(p) && p.estado !== 'atrasado';
  }
}

export default function CentroDeCobrosPage() {
  const { db, plan, cargando } = useAppData();
  const capacidades = capacidadesDe(plan);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [buscar, setBuscar] = useState('');
  const [moneda, setMoneda] = useState<string>('todas');

  const proyectos = useMemo(() => proyectosConDatos(db), [db]);
  const monedas = useMemo(() => Array.from(new Set(db.clientes.map((c) => c.moneda))).sort(), [db]);

  const filtrados = proyectos
    .filter((p) => coincideFiltro(p, filtro))
    .filter((p) => (moneda === 'todas' ? true : p.cliente.moneda === moneda))
    .filter((p) => {
      if (!buscar.trim()) return true;
      const t = buscar.trim().toLowerCase();
      return p.cliente.nombre.toLowerCase().includes(t) || p.nombre.toLowerCase().includes(t);
    })
    .sort((a, b) => a.fechaPromesa.localeCompare(b.fechaPromesa));

  if (cargando) return <SkeletonPantalla />;

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10 md:max-w-none md:px-8 md:pb-12">
      <h1 className="text-[22px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)] md:text-[24px]">Centro de cobros</h1>
      <p className="mt-1 text-[13.5px] text-[var(--text-secondary)]">Quién te debe, cuánto y cuándo vence — todo en un solo lugar.</p>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              type="button"
              onClick={() => setFiltro(f.valor)}
              className={`flex h-9 items-center rounded-full px-3.5 text-[12.5px] font-semibold transition-colors duration-150 ${
                filtro === f.valor ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
              }`}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>

        <div className="relative md:w-[240px]">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar cliente o proyecto"
            className="h-10 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] pl-9 pr-3 text-[13.5px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
          />
        </div>
      </div>

      {monedas.length > 1 && (
        <div className="mt-3 flex items-center gap-2">
          <Filter size={13} className="text-[var(--text-tertiary)]" aria-hidden="true" />
          {capacidades.canUseMultipleCurrencies ? (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setMoneda('todas')}
                className={`h-7 rounded-full px-2.5 text-[11.5px] font-semibold ${moneda === 'todas' ? 'bg-[var(--text-primary)] text-[var(--bg)]' : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'}`}
              >
                Todas las monedas
              </button>
              {monedas.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMoneda(m)}
                  className={`h-7 rounded-full px-2.5 text-[11.5px] font-semibold ${moneda === m ? 'bg-[var(--text-primary)] text-[var(--bg)]' : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          ) : (
            <InsigniaBloqueo plan="pro" />
          )}
        </div>
      )}

      {filtrados.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_35%,transparent)] p-8 text-center">
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">Nada por aquí</p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">No hay cobros que coincidan con este filtro.</p>
        </div>
      ) : (
        <>
          {/* Tabla — desktop/tablet */}
          <div className="mt-5 hidden overflow-x-auto rounded-[var(--radius-card)] bg-[var(--surface)] shadow-[var(--shadow-1)] md:block">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="text-[12px] text-[var(--text-tertiary)]">
                  <th className="px-5 pb-0 pt-4 font-medium">Cliente</th>
                  <th className="px-3 pb-0 pt-4 font-medium">Proyecto</th>
                  <th className="px-3 pb-0 pt-4 font-medium">Vence</th>
                  <th className="px-3 pb-0 pt-4 font-medium">Monto</th>
                  <th className="px-3 pb-0 pt-4 font-medium">Estado</th>
                  <th className="px-5 pb-0 pt-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.id} className="border-t border-[color-mix(in_oklab,var(--text-tertiary)_12%,transparent)]">
                    <td className="px-5 py-3">
                      <Link href={`/app/clientes/${p.cliente.id}`} className="flex items-center gap-2.5">
                        <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--chip-bg)] text-[11px] font-bold text-[var(--accent)]">
                          {p.cliente.nombre.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">{p.cliente.nombre}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-[var(--text-secondary)]">{p.nombre}</td>
                    <td className="px-3 py-3 text-[var(--text-secondary)]">
                      {new Date(p.fechaPromesa).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-3 py-3 font-semibold tabular-nums text-[var(--text-primary)]">{monto(p.cliente.moneda, p.saldo > 0 ? p.saldo : p.pagado)}</td>
                    <td className="px-3 py-3">
                      {esParcial(p) && p.estado !== 'atrasado' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--text-secondary)_12%,transparent)] px-2.5 py-1 text-[11px] font-bold text-[var(--text-secondary)]">
                          <span className="size-1.5 rounded-full bg-[var(--text-secondary)]" />
                          Parcial
                        </span>
                      ) : (
                        <EstadoBadge estado={p.estado} dias={diasAtraso(p)} />
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/app/clientes/${p.cliente.id}`}
                          className="flex h-8 items-center rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] px-2.5 text-[11.5px] font-semibold text-[var(--text-primary)]"
                        >
                          Ver cliente
                        </Link>
                        {p.saldo > 0 && (
                          <Link
                            href="/app/recordatorios"
                            className="flex h-8 items-center gap-1 rounded-[var(--radius-button)] bg-[var(--accent)] px-2.5 text-[11.5px] font-semibold text-[var(--bg)]"
                          >
                            <MessageCircle size={11} aria-hidden="true" />
                            Recordar
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards — móvil */}
          <div className="mt-5 flex flex-col gap-3 md:hidden">
            {filtrados.map((p) => (
              <div key={p.id} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[14.5px] font-semibold text-[var(--text-primary)]">{p.cliente.nombre}</p>
                    <p className="truncate text-[12px] text-[var(--text-secondary)]">{p.nombre}</p>
                  </div>
                  {esParcial(p) && p.estado !== 'atrasado' ? (
                    <span className="shrink-0 rounded-full bg-[color-mix(in_oklab,var(--text-secondary)_12%,transparent)] px-2.5 py-1 text-[11px] font-bold text-[var(--text-secondary)]">
                      Parcial
                    </span>
                  ) : (
                    <EstadoBadge estado={p.estado} dias={diasAtraso(p)} />
                  )}
                </div>
                <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
                  Vence: {new Date(p.fechaPromesa).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                </p>
                <p className="mt-0.5 text-[17px] font-bold tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
                  {monto(p.cliente.moneda, p.saldo > 0 ? p.saldo : p.pagado)}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/app/clientes/${p.cliente.id}`}
                    className="flex h-10 flex-1 items-center justify-center gap-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] text-[12.5px] font-semibold text-[var(--text-primary)]"
                  >
                    Ver cliente
                    <ChevronRight size={13} aria-hidden="true" />
                  </Link>
                  {p.saldo > 0 && (
                    <Link href="/app/recordatorios" className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--accent)] text-[12.5px] font-semibold text-[var(--bg)]">
                      <MessageCircle size={13} aria-hidden="true" />
                      Recordar
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
