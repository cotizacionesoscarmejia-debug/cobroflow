'use client';

// Recorrido guiado inicial (rediseño integral, Sesión 6) — bienvenida + 7
// pasos (uno por sección clave) + cierre con CTA. Se muestra una sola vez por
// cuenta (profiles.tour_completado) y se puede reabrir desde Configuración →
// Ayuda (AppDataProvider expone tourVisible/cerrarTour/reabrirTour para que
// ambos lugares controlen el mismo estado).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutGrid, Users, Briefcase, Receipt, Wallet, Bell, BarChart3, X, PartyPopper } from 'lucide-react';
import { useAppData } from './AppDataProvider';
import type { Plan } from '@/lib/planes';

const PASOS = [
  {
    icono: LayoutGrid,
    titulo: 'Panel principal',
    descripcion: () => 'Aquí tienes el resumen de tus cobros: cuánto has recibido, cuánto tienes pendiente y quién está atrasado.',
  },
  {
    icono: Users,
    titulo: 'Clientes',
    descripcion: () => 'Empieza agregando a la persona o empresa a la que vas a cobrar.',
  },
  {
    icono: Briefcase,
    titulo: 'Proyectos',
    descripcion: () => 'Vincula un proyecto a tu cliente e indica cuánto acordaron pagarte.',
  },
  {
    icono: Receipt,
    titulo: 'Pagos',
    descripcion: () => 'Cada vez que recibas dinero, regístralo aquí. CobroFlow calcula automáticamente cuánto falta.',
  },
  {
    icono: Wallet,
    titulo: 'Centro de cobros',
    descripcion: () => 'Aquí encontrarás exactamente a quién necesitas darle seguimiento.',
  },
  {
    icono: Bell,
    titulo: 'Recordatorios',
    descripcion: () => 'Desde aquí puedes recordarles a tus clientes sus pagos pendientes.',
  },
  {
    icono: BarChart3,
    titulo: 'Estadísticas',
    descripcion: (plan: Plan) =>
      plan === 'free'
        ? 'Con Pro puedes desbloquear reportes y gráficas para entender mejor tus cobros.'
        : plan === 'pro'
          ? 'Aquí puedes analizar cómo están evolucionando tus cobros.'
          : 'Además de tus estadísticas, Premium te ayuda a analizar tu negocio con IA.',
  },
] as const;

const TOTAL_PASOS = PASOS.length + 2; // bienvenida (0) + 7 contenido (1-7) + final (8)

export function RecorridoGuiado() {
  const router = useRouter();
  const { plan, tourVisible, cerrarTour } = useAppData();
  const [paso, setPaso] = useState(0);

  if (!tourVisible) return null;

  const esBienvenida = paso === 0;
  const esFinal = paso === TOTAL_PASOS - 1;
  const contenido = !esBienvenida && !esFinal ? PASOS[paso - 1] : null;

  function siguiente() {
    if (paso < TOTAL_PASOS - 1) setPaso((p) => p + 1);
    else cerrarTour();
  }

  function terminarYAgregarCliente() {
    cerrarTour();
    setPaso(0);
    router.push('/app/clientes/nuevo');
  }

  function saltar() {
    cerrarTour();
    setPaso(0);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_oklab,black_55%,transparent)] sm:items-center sm:px-5"
        onClick={saltar}
      >
        <motion.div
          key={paso}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[440px] rounded-t-[var(--radius-card)] bg-[var(--surface)] p-6 pb-8 shadow-[var(--shadow-2)] sm:rounded-[var(--radius-card)]"
        >
          <button
            type="button"
            onClick={saltar}
            aria-label="Cerrar el recorrido"
            className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-tertiary)]"
          >
            <X size={16} aria-hidden="true" />
          </button>

          {esBienvenida ? (
            <>
              <span className="flex size-14 items-center justify-center rounded-full bg-[var(--chip-bg)]">
                <PartyPopper size={24} color="var(--accent)" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-[20px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Bienvenido a CobroFlow 👋</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                CobroFlow te ayuda a saber quién te debe, cuánto te debe y qué cobros necesitan tu atención. Te enseñamos lo esencial en unos pasos.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <button type="button" onClick={siguiente} className="flex h-12 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[14px] font-semibold text-[var(--bg)]">
                  Comenzar recorrido
                </button>
                <button type="button" onClick={saltar} className="flex h-11 w-full items-center justify-center text-[13px] font-semibold text-[var(--text-secondary)]">
                  Explorar por mi cuenta
                </button>
              </div>
            </>
          ) : esFinal ? (
            <>
              <span className="flex size-14 items-center justify-center rounded-full bg-[var(--chip-bg)]">
                <PartyPopper size={24} color="var(--accent)" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-[20px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">¡Listo!</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                CobroFlow ya está preparado para ayudarte a tener tus cobros bajo control.
              </p>
              <button
                type="button"
                onClick={terminarYAgregarCliente}
                className="mt-6 flex h-12 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[14px] font-semibold text-[var(--bg)]"
              >
                Agregar mi primer cliente
              </button>
            </>
          ) : (
            contenido && (
              <>
                <span className="flex size-14 items-center justify-center rounded-full bg-[var(--chip-bg)]">
                  <contenido.icono size={24} color="var(--accent)" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-[19px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">{contenido.titulo}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">{contenido.descripcion(plan)}</p>

                <div className="mt-6 flex items-center justify-center gap-1.5">
                  {Array.from({ length: TOTAL_PASOS - 2 }).map((_, i) => (
                    <span
                      key={i}
                      aria-hidden="true"
                      className="h-1.5 rounded-full transition-all duration-200"
                      style={{ width: i === paso - 1 ? 20 : 6, backgroundColor: i === paso - 1 ? 'var(--accent)' : 'var(--surface-2)' }}
                    />
                  ))}
                </div>

                <div className="mt-5 flex gap-2">
                  {paso > 1 && (
                    <button
                      type="button"
                      onClick={() => setPaso((p) => p - 1)}
                      className="flex h-11 items-center justify-center rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] px-4 text-[13px] font-semibold text-[var(--text-primary)]"
                    >
                      Atrás
                    </button>
                  )}
                  <button type="button" onClick={siguiente} className="flex h-11 flex-1 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[13px] font-semibold text-[var(--bg)]">
                    Siguiente
                  </button>
                </div>
              </>
            )
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
