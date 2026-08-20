'use client';

// COBROFLOW — §6 OFERTA, VARIANTE DE 3 PLANES (desviación documentada del kit)
// El Oferta.tsx del kit asume UN plan con periodo anual/mensual + trial opcional
// (02C). El modelo de CobroFlow es freemium de 3 tiers (Free/Pro/Premium, sin
// trial — el "probar antes de pagar" ES el plan Free) según ESTADO.md → decisión
// de monetización del usuario. Se reutilizan los MISMOS primitivos visuales del
// kit (Hairline, CheckCustom, CtaButton, Kicker, SectionShell) — solo cambia la
// estructura de 2 columnas a 3. Documentado en ESTADO.md → "Decisiones técnicas".

import { useState } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { CheckCustom, CtaButton, Hairline, Kicker, Perforacion, SectionShell, useReveal, VIEWPORT_ONCE } from './ui';
import { MarkedCopy, warnCopy, warnRango } from './MarkedCopy';

/* Check en tono neutro para Free/Premium — reserva el verde saturado solo para
   el plan destacado (Pro) + el CTA + el dato de dinero (regla 60-30-10, revisor
   paywall R2: >8 elementos en acento en una sola vista). */
function CheckNeutro() {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 inline-flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_16%,transparent)]"
    >
      <Check size={13} strokeWidth={2.5} color="var(--text-secondary)" aria-hidden="true" />
    </span>
  );
}

export interface PlanTier {
  nombre: string;
  /** Solo la cifra ("$0" / "$7.99" / "$14.99") — display tabular-nums. */
  precioMes: string;
  /** 1 línea de posicionamiento del plan (12 palabras). */
  descripcion: string;
  ctaLabel: string;
  ctaHref: string;
  /** El plan recomendado — hairline + elevación, como el "anual" del kit. */
  destacado?: boolean;
  badge?: string;
  /** 4-6 features en lenguaje de resultado. */
  features: string[];
  /** Nota de anclaje bajo el precio (panel de expertos, item #10 — el salto de
   *  precio al siguiente plan traducido a algo chico: "$X al día más"). Opcional. */
  notaAncla?: string;
  /** Variante anual opcional (hoy solo Premium) — activa un selector
   *  Mensual/Anual dentro de la card (panel de expertos, item #10). */
  anual?: { precio: string; ctaHref: string; notaAhorro: string };
}

export interface OfertaPlanesProps {
  kicker?: string;
  tituloMarked: string;
  subtituloMarked?: string;
  planes: [PlanTier, PlanTier, PlanTier];
  id?: string;
  /** 'compacto' cuando el título/subtítulo del H1 de la pantalla ya lo dice todo
   *  (paywall, con el recap personalizado arriba) — evita 2 titulares "héroe"
   *  compitiendo (revisor-visual, paywall R1). Default 'grande' (landing). */
  tamanoTitulo?: 'grande' | 'compacto';
}

function Features({ items, origen, destacado }: { items: string[]; origen: string; destacado?: boolean }) {
  warnRango(`${origen} → features`, items.length, 4, 6);
  items.forEach((f, i) => warnCopy(`${origen} → feature ${i + 1}`, f, 12));
  return (
    <ul className="mt-5 flex flex-col gap-3">
      {items.map((f, i) => (
        <li key={i} className="flex items-start gap-3 text-[14px] leading-snug text-[var(--text-primary)]">
          {destacado ? <CheckCustom /> : <CheckNeutro />}
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}

function CardPlan({ plan, origen }: { plan: PlanTier; origen: string }) {
  const [ciclo, setCiclo] = useState<'mensual' | 'anual'>('mensual');
  const esAnual = ciclo === 'anual' && !!plan.anual;
  const precioMostrado = esAnual ? plan.anual!.precio : plan.precioMes;
  const ctaHrefMostrado = esAnual ? plan.anual!.ctaHref : plan.ctaHref;
  const notaMostrada = esAnual ? plan.anual!.notaAhorro : plan.notaAncla;

  const cuerpo = (
    <div className={`relative rounded-[var(--radius-card)] p-6 pl-7 md:p-7 md:pl-8 ${plan.destacado ? 'bg-[color-mix(in_oklab,var(--accent)_5%,transparent)]' : 'bg-[var(--surface)]'}`}>
      <Perforacion tono={plan.destacado ? 'accent' : 'neutro'} />
      <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">{plan.nombre}</h3>
      <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">{plan.descripcion}</p>
      {plan.anual && (
        <div className="mt-4 inline-flex gap-1 rounded-full bg-[var(--surface-2)] p-1">
          {(['mensual', 'anual'] as const).map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setCiclo(opcion)}
              className={`rounded-full px-3 py-1 text-[12px] font-semibold capitalize transition-colors duration-150 ${
                ciclo === opcion ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-1)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              {opcion}
            </button>
          ))}
        </div>
      )}
      <p className="mt-4 flex items-baseline gap-1">
        <span className="text-[32px] font-bold leading-none tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
          {precioMostrado}
        </span>
        {precioMostrado !== '$0' && <span className="text-[14px] text-[var(--text-secondary)]">{esAnual ? '/año' : '/mes'}</span>}
      </p>
      {notaMostrada && <p className="mt-1.5 text-[12px] text-[var(--text-tertiary)]">{notaMostrada}</p>}
      <Features items={plan.features} origen={origen} destacado={plan.destacado} />
      <div className="mt-6">
        {plan.destacado ? (
          <CtaButton href={ctaHrefMostrado} fullMobile>
            {plan.ctaLabel}
          </CtaButton>
        ) : (
          <motion.a
            whileTap={{ scale: 0.97 }}
            href={ctaHrefMostrado}
            className="flex h-12 w-full items-center justify-center rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_35%,transparent)] text-[15px] font-semibold text-[var(--text-primary)] transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)] [touch-action:manipulation]"
          >
            {plan.ctaLabel}
          </motion.a>
        )}
      </div>
    </div>
  );

  if (!plan.destacado) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] shadow-[var(--shadow-1)]">
        {cuerpo}
      </div>
    );
  }

  return (
    <div className="relative md:-translate-y-2">
      {plan.badge && (
        <span className="absolute -top-[10px] left-1/2 z-10 -translate-x-1/2 rounded-full border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] bg-[var(--accent)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--bg)]">
          {plan.badge}
        </span>
      )}
      <Hairline emphasis surface="surface" className="shadow-[0_12px_36px_color-mix(in_oklab,var(--accent)_16%,transparent)]">
        {cuerpo}
      </Hairline>
    </div>
  );
}

export function OfertaPlanes({
  kicker = 'PLANES',
  tituloMarked,
  subtituloMarked,
  planes,
  id = 'oferta',
  tamanoTitulo = 'grande',
}: OfertaPlanesProps) {
  warnCopy('Oferta → título', tituloMarked, 8);
  const { contenedor, item } = useReveal();
  const [free, pro, premium] = planes;
  const compacto = tamanoTitulo === 'compacto';

  return (
    <SectionShell id={id} elevacion="base" ariaLabel="Planes y precios">
      <motion.div variants={contenedor} initial="hidden" whileInView="visible" viewport={VIEWPORT_ONCE}>
        <motion.div variants={item} className="mx-auto max-w-[620px] text-center">
          {!compacto && <Kicker>{kicker}</Kicker>}
          <h2
            className={`text-balance font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)] ${
              compacto ? 'text-[15px] text-[var(--text-secondary)]' : 'text-[30px] md:text-[40px]'
            }`}
          >
            <MarkedCopy text={tituloMarked} />
          </h2>
          {/* En modo compacto (paywall) el recap de la pantalla ya dio el titular y
              el número — el subtítulo aquí sería un 5º tamaño de texto compitiendo
              (revisor-visual, paywall R2). */}
          {subtituloMarked && !compacto && (
            <p className="mt-3 text-[15px] text-[var(--text-secondary)]">
              <MarkedCopy text={subtituloMarked} />
            </p>
          )}
        </motion.div>

        {/* Pro (destacado) va primero en el DOM en mobile — mismo principio del kit
            de mostrar antes el plan recomendado, adaptado a 3 columnas */}
        <div className="mx-auto mt-10 grid max-w-[1040px] grid-cols-1 items-start gap-6 md:grid-cols-3">
          <motion.div variants={item} className="order-2 md:order-1">
            <CardPlan plan={free} origen="Oferta → free" />
          </motion.div>
          <motion.div variants={item} className="order-1 md:order-2">
            <CardPlan plan={pro} origen="Oferta → pro" />
          </motion.div>
          <motion.div variants={item} className="order-3">
            <CardPlan plan={premium} origen="Oferta → premium" />
          </motion.div>
        </div>
      </motion.div>
    </SectionShell>
  );
}
