'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutGrid, Plus, Wallet, User, X } from 'lucide-react';
import { obtenerTourCompletado, marcarTourCompletado } from '@/lib/app-data';

const PASOS = [
  {
    icono: LayoutGrid,
    titulo: 'Este es tu Dashboard',
    descripcion:
      'De un vistazo ves cuánto has cobrado este mes, qué está pendiente y qué está atrasado — todo calculado al instante, sin que tengas que sumar nada.',
  },
  {
    icono: Plus,
    titulo: 'Agrega tus clientes',
    descripcion:
      'Con el botón + registras un cliente, su proyecto y el anticipo que te dio. CobroFlow calcula el saldo pendiente solo.',
  },
  {
    icono: Wallet,
    titulo: 'Centro de Cobros',
    descripcion:
      'Aquí ves a quién seguirle hoy, con un mensaje de recordatorio listo para copiar y mandar por WhatsApp.',
  },
  {
    icono: User,
    titulo: 'Tu cuenta y tus reportes',
    descripcion:
      'Cambia tu moneda principal, descarga reportes en PDF y — si tienes Premium — pide un análisis de tu negocio con IA.',
  },
];

/** Recorrido guiado de 4 pasos, se muestra UNA sola vez por cuenta (Fase 6). */
export function RecorridoGuiado() {
  const [visible, setVisible] = useState(false);
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    obtenerTourCompletado().then((completado) => {
      if (!completado) setVisible(true);
    });
  }, []);

  function cerrar() {
    setVisible(false);
    marcarTourCompletado();
  }

  function siguiente() {
    if (paso < PASOS.length - 1) {
      setPaso((p) => p + 1);
    } else {
      cerrar();
    }
  }

  const actual = PASOS[paso];
  const Icono = actual.icono;
  const esUltimo = paso === PASOS.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_oklab,black_55%,transparent)] sm:items-center sm:px-5"
          onClick={cerrar}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[480px] rounded-t-[var(--radius-card)] bg-[var(--surface)] p-6 pb-8 shadow-[var(--shadow-2)] sm:rounded-[var(--radius-card)]"
          >
            <button
              type="button"
              onClick={cerrar}
              aria-label="Saltar el recorrido"
              className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-tertiary)]"
            >
              <X size={16} aria-hidden="true" />
            </button>

            <motion.span
              key={paso}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex size-14 items-center justify-center rounded-full bg-[var(--chip-bg)]"
            >
              <Icono size={24} color="var(--accent)" aria-hidden="true" />
            </motion.span>

            <h2 className="mt-4 text-[19px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
              {actual.titulo}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">{actual.descripcion}</p>

            <div className="mt-6 flex items-center justify-center gap-1.5">
              {PASOS.map((_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="h-1.5 rounded-full transition-all duration-200"
                  style={{
                    width: i === paso ? 20 : 6,
                    backgroundColor: i === paso ? 'var(--accent)' : 'var(--surface-2)',
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={siguiente}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[14px] font-semibold text-[var(--bg)]"
            >
              {esUltimo ? 'Empezar' : 'Siguiente'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
