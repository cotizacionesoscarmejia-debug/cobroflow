'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Perforacion } from '@/components/landing/ui';
import { EstadoBadge } from '@/components/app/EstadoBadge';
import { obtenerDB, proyectosConDatos, diasAtraso, type ProyectoConDatos } from '@/lib/app-data';

interface ClienteResumen {
  id: string;
  nombre: string;
  moneda: string;
  saldo: number;
  peorEstado: ProyectoConDatos['estado'];
  peorProyecto: ProyectoConDatos;
}

const ORDEN_URGENCIA: Record<string, number> = { atrasado: 0, vence_hoy: 1, proximo: 2, al_dia: 3, pagado: 4 };

export default function ClientesPage() {
  const [resumen, setResumen] = useState<ClienteResumen[] | null>(null);
  const [buscar, setBuscar] = useState('');

  useEffect(() => {
    const db = obtenerDB();
    const proyectos = proyectosConDatos(db);
    const porCliente = new Map<string, ProyectoConDatos[]>();
    for (const p of proyectos) {
      const lista = porCliente.get(p.cliente.id) ?? [];
      lista.push(p);
      porCliente.set(p.cliente.id, lista);
    }
    const filas: ClienteResumen[] = [];
    for (const [, lista] of porCliente) {
      const ordenada = [...lista].sort((a, b) => ORDEN_URGENCIA[a.estado] - ORDEN_URGENCIA[b.estado]);
      const peor = ordenada[0];
      filas.push({
        id: peor.cliente.id,
        nombre: peor.cliente.nombre,
        moneda: peor.cliente.moneda,
        saldo: lista.reduce((s, p) => s + p.saldo, 0),
        peorEstado: peor.estado,
        peorProyecto: peor,
      });
    }
    filas.sort((a, b) => ORDEN_URGENCIA[a.peorEstado] - ORDEN_URGENCIA[b.peorEstado]);
    setResumen(filas);
  }, []);

  if (!resumen) return null;

  const filtrados = buscar.trim()
    ? resumen.filter((c) => c.nombre.toLowerCase().includes(buscar.trim().toLowerCase()))
    : resumen;

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Clientes</h1>
        <Link
          href="/app/clientes/nuevo"
          aria-label="Agregar cliente"
          className="flex size-10 items-center justify-center rounded-full bg-[var(--accent)]"
        >
          <Plus size={19} color="var(--bg)" aria-hidden="true" />
        </Link>
      </div>

      {resumen.length > 3 && (
        <div className="relative mt-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar cliente"
            className="h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] pl-10 pr-4 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
          />
        </div>
      )}

      {resumen.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_35%,transparent)] p-8 text-center">
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">Todavía no tienes clientes</p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Agrega el primero para empezar a controlar tus cobros.
          </p>
          <Link
            href="/app/clientes/nuevo"
            className="mt-4 flex h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-5 text-[14px] font-semibold text-[var(--bg)]"
          >
            + Crear cliente
          </Link>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3 pb-8">
          {filtrados.map((c) => (
            <Link
              key={c.id}
              href={`/app/clientes/${c.id}`}
              className="relative flex items-center gap-3 overflow-hidden rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]"
            >
              <Perforacion tono={c.peorEstado === 'atrasado' ? 'accent' : 'neutro'} />
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--chip-bg)] text-[13px] font-bold text-[var(--accent)]"
              >
                {c.nombre.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{c.nombre}</p>
                <p className="text-[12px] text-[var(--text-secondary)]">
                  {c.saldo > 0 ? `Debe ${c.moneda} $${c.saldo.toLocaleString('es')}` : 'Sin saldo pendiente'}
                </p>
              </div>
              <EstadoBadge estado={c.peorEstado} dias={diasAtraso(c.peorProyecto)} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
