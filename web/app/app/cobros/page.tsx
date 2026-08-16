'use client';

import { useEffect, useState } from 'react';
import { Copy, Check, MessageCircle } from 'lucide-react';
import { Perforacion } from '@/components/landing/ui';
import { EstadoBadge } from '@/components/app/EstadoBadge';
import { obtenerDB, proyectosConDatos, diasAtraso, type ProyectoConDatos } from '@/lib/app-data';

const ORDEN_URGENCIA: Record<string, number> = { atrasado: 0, vence_hoy: 1, proximo: 2, al_dia: 3, pagado: 4 };

function mensajeRecordatorio(p: ProyectoConDatos): string {
  const dias = diasAtraso(p);
  const base = `Hola, ${p.cliente.nombre} 👋. Espero que estés muy bien. Te escribo para recordarte que permanece pendiente un pago de ${p.cliente.moneda} $${p.saldo.toLocaleString('es')}`;
  const proyectoTxt = p.nombre ? ` correspondiente al proyecto ${p.nombre}` : '';
  if (p.estado === 'atrasado' && dias > 0) {
    return `${base}${proyectoTxt}, que lleva ${dias} día${dias === 1 ? '' : 's'} de atraso. Cuando puedas, ¿me confirmas el pago? ¡Muchas gracias!`;
  }
  return `${base}${proyectoTxt}. Cuando tengas oportunidad puedes confirmarme el pago por este medio. ¡Muchas gracias!`;
}

export default function CobrosPage() {
  const [pendientes, setPendientes] = useState<ProyectoConDatos[] | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  useEffect(() => {
    const db = obtenerDB();
    const lista = proyectosConDatos(db)
      .filter((p) => p.saldo > 0)
      .sort((a, b) => ORDEN_URGENCIA[a.estado] - ORDEN_URGENCIA[b.estado]);
    setPendientes(lista);
  }, []);

  if (!pendientes) return null;

  async function copiar(id: string, texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(id);
      setTimeout(() => setCopiado(null), 1800);
    } catch {
      // portapapeles bloqueado — el usuario puede seleccionar el texto a mano
    }
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10">
      <h1 className="text-[22px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Centro de cobros</h1>
      <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
        {pendientes.length > 0
          ? `${pendientes.length} ${pendientes.length === 1 ? 'cliente necesita' : 'clientes necesitan'} seguimiento`
          : 'Nadie necesita seguimiento ahora mismo'}
      </p>

      {pendientes.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_35%,transparent)] p-8 text-center">
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">Todo cobrado 🎉</p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">No tienes pagos atrasados ni por vencer.</p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {pendientes.map((p) => {
            const mensaje = mensajeRecordatorio(p);
            return (
              <div key={p.id} className="relative overflow-hidden rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
                <Perforacion tono={p.estado === 'atrasado' ? 'accent' : 'neutro'} />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-[var(--text-primary)]">{p.cliente.nombre}</p>
                    <p className="text-[12px] text-[var(--text-secondary)]">{p.nombre}</p>
                  </div>
                  <EstadoBadge estado={p.estado} dias={diasAtraso(p)} />
                </div>

                <p className="mt-3 text-[20px] font-bold tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
                  {p.cliente.moneda} ${p.saldo.toLocaleString('es')}
                </p>

                <div className="mt-3 rounded-[var(--radius-button)] bg-[var(--bg)] p-3 text-[12.5px] leading-relaxed text-[var(--text-secondary)]">
                  {mensaje}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => copiar(p.id, mensaje)}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] text-[13px] font-semibold text-[var(--text-primary)]"
                  >
                    {copiado === p.id ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    {copiado === p.id ? 'Copiado' : 'Copiar'}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--accent)] text-[13px] font-semibold text-[var(--bg)]"
                  >
                    <MessageCircle size={14} aria-hidden="true" />
                    WhatsApp
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
