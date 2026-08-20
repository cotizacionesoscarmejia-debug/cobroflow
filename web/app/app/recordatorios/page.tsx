'use client';

// Recordatorios (rediseño integral, Sesión 6) — a quién seguirle hoy, con el
// mensaje listo para copiar o mandar por WhatsApp. Hereda la lógica que antes
// vivía en /app/cobros (Fase original). Pro/Premium suman plantillas de tono;
// Free conserva su recordatorio manual de siempre.

import { useMemo, useState } from 'react';
import { Copy, Check, MessageCircle } from 'lucide-react';
import { Perforacion } from '@/components/landing/ui';
import { EstadoBadge } from '@/components/app/EstadoBadge';
import { InsigniaBloqueo } from '@/components/app/BloqueoPlan';
import { SkeletonPantalla } from '@/components/app/SkeletonPantalla';
import { useAppData } from '@/components/app/AppDataProvider';
import { proyectosConDatos, diasAtraso, type ProyectoConDatos } from '@/lib/app-data';
import { capacidadesDe } from '@/lib/planes';
import { simboloMoneda } from '@/lib/onboarding';

const ORDEN_URGENCIA: Record<string, number> = { atrasado: 0, vence_hoy: 1, proximo: 2, al_dia: 3, pagado: 4 };

type Tono = 'amigable' | 'formal' | 'directo';
const TONOS: { valor: Tono; etiqueta: string }[] = [
  { valor: 'amigable', etiqueta: 'Amigable' },
  { valor: 'formal', etiqueta: 'Formal' },
  { valor: 'directo', etiqueta: 'Directo' },
];

function mensajePorTono(p: ProyectoConDatos, tono: Tono): string {
  const dias = diasAtraso(p);
  const montoTxt = `${p.cliente.moneda} ${simboloMoneda(p.cliente.moneda)}${p.saldo.toLocaleString('es')}`;
  const proyectoTxt = p.nombre ? ` del proyecto ${p.nombre}` : '';

  if (tono === 'formal') {
    return `Estimado/a ${p.cliente.nombre}, le escribo para recordarle que tiene un pago pendiente de ${montoTxt}${proyectoTxt}. Le agradecería confirmarme la fecha en la que podría realizarlo. Saludos cordiales.`;
  }
  if (tono === 'directo') {
    return `Hola ${p.cliente.nombre}, tu pago de ${montoTxt}${proyectoTxt} sigue pendiente${dias > 0 ? ` (${dias} día${dias === 1 ? '' : 's'} de atraso)` : ''}. ¿Me confirmas cuándo lo puedes hacer? Gracias.`;
  }
  const base = `Hola, ${p.cliente.nombre} 👋. Espero que estés muy bien. Te escribo para recordarte que permanece pendiente un pago de ${montoTxt}`;
  if (p.estado === 'atrasado' && dias > 0) {
    return `${base}${proyectoTxt}, que lleva ${dias} día${dias === 1 ? '' : 's'} de atraso. Cuando puedas, ¿me confirmas el pago? ¡Muchas gracias!`;
  }
  return `${base}${proyectoTxt}. Cuando tengas oportunidad puedes confirmarme el pago por este medio. ¡Muchas gracias!`;
}

export default function RecordatoriosPage() {
  const { db, plan, cargando } = useAppData();
  const capacidades = capacidadesDe(plan);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [tonos, setTonos] = useState<Record<string, Tono>>({});

  const pendientes = useMemo(
    () =>
      proyectosConDatos(db)
        .filter((p) => p.saldo > 0)
        .sort((a, b) => ORDEN_URGENCIA[a.estado] - ORDEN_URGENCIA[b.estado]),
    [db]
  );

  if (cargando) return <SkeletonPantalla />;

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
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10 md:max-w-none md:px-8 md:pb-12">
      <h1 className="text-[22px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)] md:text-[24px]">Recordatorios</h1>
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
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pendientes.map((p) => {
            const tono = tonos[p.id] ?? 'amigable';
            const mensaje = mensajePorTono(p, tono);
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
                  {p.cliente.moneda} {simboloMoneda(p.cliente.moneda)}
                  {p.saldo.toLocaleString('es')}
                </p>

                {capacidades.canUseReminderTemplates ? (
                  <div className="mt-3 flex gap-1.5">
                    {TONOS.map((t) => (
                      <button
                        key={t.valor}
                        type="button"
                        onClick={() => setTonos((s) => ({ ...s, [p.id]: t.valor }))}
                        className={`h-7 rounded-full px-2.5 text-[11px] font-semibold transition-colors duration-150 ${
                          tono === t.valor ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {t.etiqueta}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3">
                    <InsigniaBloqueo plan="pro" />
                  </div>
                )}

                <div className="mt-3 rounded-[var(--radius-button)] bg-[var(--bg)] p-3 text-[12.5px] leading-relaxed text-[var(--text-secondary)]">{mensaje}</div>

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
