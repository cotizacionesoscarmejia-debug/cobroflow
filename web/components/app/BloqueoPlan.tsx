// Mecanismo de upgrade elegante (rediseño integral, Sesión 6): en vez de
// esconder una función Pro/Premium, se MUESTRA bloqueada con un CTA claro.
// Toda pantalla que dependa de una capacidad la lee de lib/planes.ts — nunca
// un `if (plan === ...)` disperso sin pasar por ahí.

import { Lock } from 'lucide-react';

interface BloqueoPlanProps {
  plan: 'pro' | 'premium';
  titulo: string;
  descripcion: string;
  email?: string;
  userId?: string;
}

/** Tarjeta grande de upsell — para reemplazar el contenido completo de una sección bloqueada. */
export function BloqueoPlan({ plan, titulo, descripcion }: BloqueoPlanProps) {
  const nombrePlan = plan === 'pro' ? 'Pro' : 'Premium';
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--accent)_35%,transparent)] bg-[color-mix(in_oklab,var(--accent)_5%,transparent)] p-6 text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--chip-bg)]">
        <Lock size={18} color="var(--accent)" aria-hidden="true" />
      </span>
      <p className="mt-3 text-[12px] font-bold uppercase tracking-wide text-[var(--accent)]">Disponible en {nombrePlan}</p>
      <h3 className="mt-1.5 text-[17px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">{titulo}</h3>
      <p className="mx-auto mt-1.5 max-w-[340px] text-[13px] leading-relaxed text-[var(--text-secondary)]">{descripcion}</p>
      {/* Pasa por /api/ir-a-hotmart: registra el clic (fuente real del carrito
          abandonado, B/18/35) y ahí mismo arma el link con el correo/id de la
          sesión — ya no hace falta pasarlos por props. */}
      <a
        href={`/api/ir-a-hotmart?plan=${plan}`}
        className="mt-4 inline-flex h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-5 text-[13px] font-semibold text-[var(--bg)]"
      >
        Mejorar a {nombrePlan}
      </a>
    </div>
  );
}

/** Insignia compacta — para un filtro/botón puntual bloqueado dentro de una pantalla que sí es visible. */
export function InsigniaBloqueo({ plan }: { plan: 'pro' | 'premium' }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--chip-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent)]">
      <Lock size={9} aria-hidden="true" />
      {plan === 'pro' ? 'Pro' : 'Premium'}
    </span>
  );
}
