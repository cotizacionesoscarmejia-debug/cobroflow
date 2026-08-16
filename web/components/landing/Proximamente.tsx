// Stub honesto para rutas que la SECUENCIA MAESTRA construye en una sesión propia
// (/onboarding en Sesión 4, /login en Sesión 4). Evita el 404 genérico de Next.js
// sin fingir una función que todavía no existe — mismo tono y tokens de la marca.

import { ArrowLeft } from 'lucide-react';

export function Proximamente({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--bg)] px-6 text-center">
      <span
        aria-hidden="true"
        className="mb-6 flex size-14 items-center justify-center rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--accent)_22%,transparent)] bg-[var(--chip-bg)]"
      >
        <span className="size-3 rounded-full bg-[var(--accent)]" />
      </span>
      <h1 className="max-w-[22ch] text-[22px] font-bold leading-tight text-[var(--text-primary)] [font-family:var(--font-display)]">
        {titulo}
      </h1>
      <p className="mt-3 max-w-[38ch] text-[15px] leading-relaxed text-[var(--text-secondary)]">
        {detalle}
      </p>
      <a
        href="/"
        className="mt-8 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--accent)]"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Volver a CobroFlow
      </a>
    </main>
  );
}
