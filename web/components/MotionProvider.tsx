'use client';

import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

// Respeta prefers-reduced-motion en TODA animación de motion/react de la app
// (antes solo NumeroAnimado lo hacía a mano) — revisor-visual, Dashboard R2.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
