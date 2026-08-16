'use client';

// Piezas compartidas del funnel de onboarding/paywall/login (50-DISENO-ONBOARDING-PAYWALL.md).
// Consumen los tokens de components/landing/tokens.css (ya importados en globals.css) — misma
// marca, mismo brand kit, cero valores propios.

import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, Check } from 'lucide-react';

/* ── <Marca> — logo + nombre arriba de TODA pantalla del funnel (regla de 50: nunca
   anónima). Vuelve a "/" — con un modal propio del kit si hay progreso en curso
   (antes era un window.confirm() nativo, rompía la identidad — revisor-visual R3). ── */
export function Marca({ confirmarSalida = false }: { confirmarSalida?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <a
        href="/"
        onClick={(e) => {
          if (confirmarSalida) {
            e.preventDefault();
            setAbierto(true);
          }
        }}
        className="inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--text-primary)]"
      >
        <img src="/logo.png" alt="" aria-hidden="true" className="size-6 object-contain" />
        CobroFlow
      </a>
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_oklab,var(--text-primary)_45%,transparent)] sm:items-center"
            onClick={() => setAbierto(false)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[360px] rounded-t-[var(--radius-card)] bg-[var(--surface)] p-6 shadow-[var(--shadow-2)] sm:rounded-[var(--radius-card)]"
            >
              <h2 className="text-[18px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
                ¿Salir de aquí?
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                Vas a perder lo que llevas hecho en esta pantalla.
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="flex h-12 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[15px] font-semibold text-[var(--bg)]"
                >
                  Seguir aquí
                </button>
                <a
                  href="/"
                  className="flex h-12 w-full items-center justify-center rounded-[var(--radius-button)] text-[15px] font-semibold text-[var(--text-secondary)]"
                >
                  Salir de todas formas
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── <BarraProgreso> — línea fina, SIEMPRE visible, arranca en 5-8% (efecto
   Zeigarnik), nunca dots/steps numerados (regla 3 de 02B). ── */
export function BarraProgreso({ pasoActual, totalPasos }: { pasoActual: number; totalPasos: number }) {
  const pct = Math.max(7, Math.round((pasoActual / totalPasos) * 100));
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)]">
      <motion.div
        className="h-full rounded-full bg-[var(--accent)]"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

/* ── <EncabezadoPaso> — atrás + barra, mismo renglón (A2 de 50). ── */
export function EncabezadoPaso({
  pasoActual,
  totalPasos,
  onAtras,
}: {
  pasoActual: number;
  totalPasos: number;
  onAtras?: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onAtras}
        disabled={!onAtras}
        aria-label="Atrás"
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] disabled:opacity-0"
      >
        <ChevronLeft size={22} aria-hidden="true" />
      </button>
      <BarraProgreso pasoActual={pasoActual} totalPasos={totalPasos} />
    </div>
  );
}

/* ── <Chip> — opción de selección única, ancho completo (A2/A3 de 50). ── */
export function Chip({
  label,
  seleccionado,
  onSelect,
  index = 0,
}: {
  label: string;
  seleccionado: boolean;
  onSelect: () => void;
  index?: number;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`flex h-14 w-full items-center justify-between rounded-[var(--radius-button)] border px-5 text-left text-[16px] font-medium shadow-[var(--shadow-1)] transition-colors duration-150 ${
        seleccionado
          ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-[var(--text-primary)]'
          : 'border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] text-[var(--text-primary)]'
      }`}
    >
      {label}
      {seleccionado && (
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex size-5 items-center justify-center rounded-full bg-[var(--accent)]"
        >
          <Check size={12} strokeWidth={3} color="var(--bg)" aria-hidden="true" />
        </motion.span>
      )}
    </motion.button>
  );
}

/* ── <PasoTransicion> — envuelve cada paso con la gramática de entrada/salida
   de A4 (50): translateX + fade, reduced-motion → solo cross-fade. ── */
export function PasoTransicion({ pasoKey, children }: { pasoKey: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={pasoKey}
      initial={{ opacity: 0, x: reduce ? 0 : 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: reduce ? 0 : -20 }}
      transition={{ duration: reduce ? 0.15 : 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── <CtaFunnel> — CTA fijo de 52-56px del funnel (input libre / selección múltiple). ── */
export function CtaFunnel({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <motion.button
      type={type}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className="flex h-14 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] transition-opacity duration-150 disabled:opacity-40 [touch-action:manipulation]"
    >
      {children}
    </motion.button>
  );
}

/* ── <NumeroAnimado> — cuenta 0→valor en ~700ms, tabular-nums (baseline #2 de
   CLAUDE.md: ninguna cifra héroe aparece estática). ── */
export function NumeroAnimado({ valor, prefijo = '' }: { valor: number; prefijo?: string }) {
  const reduce = useReducedMotion();
  const [mostrado, setMostrado] = useState(reduce ? valor : 0);

  useEffect(() => {
    if (reduce) {
      setMostrado(valor);
      return;
    }
    const duracion = 700;
    const inicio = performance.now();
    let frame: number;
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      const eased = 1 - Math.pow(1 - t, 3);
      setMostrado(Math.round(valor * eased));
      if (t < 1) frame = requestAnimationFrame(paso);
    };
    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [valor, reduce]);

  return (
    <span className="tabular-nums">
      {prefijo}
      {mostrado.toLocaleString('es')}
    </span>
  );
}
