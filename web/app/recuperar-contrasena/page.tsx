'use client';

import { useState } from 'react';
import { Mail, MailCheck, ChevronLeft } from 'lucide-react';
import { Marca, CtaFunnel } from '@/components/onboarding/ui';
import { createClient } from '@/lib/supabase/client';

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    if (!email.includes('@')) return;
    setEnviando(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer-contrasena`,
    });
    setEnviando(false);
    if (err) {
      setError('No pudimos enviar el enlace. Intenta de nuevo.');
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col items-center justify-center px-5 py-10 text-center">
        <Marca />
        <span
          aria-hidden="true"
          className="mt-10 flex size-14 items-center justify-center rounded-[var(--radius-button)] bg-[var(--chip-bg)]"
        >
          <MailCheck size={26} color="var(--accent)" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-[22px] font-bold leading-tight text-[var(--text-primary)] [font-family:var(--font-display)]">
          Revisa tu correo
        </h1>
        <p className="mt-2 max-w-[32ch] text-[14px] leading-relaxed text-[var(--text-secondary)]">
          Si <span className="font-semibold text-[var(--text-primary)]">{email}</span> tiene una cuenta, te mandamos
          un enlace para crear una nueva contraseña.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col justify-center px-5 py-10">
      <a
        href="/login"
        aria-label="Volver a iniciar sesión"
        className="flex size-11 items-center justify-center rounded-full text-[var(--text-secondary)]"
      >
        <ChevronLeft size={22} aria-hidden="true" />
      </a>

      <div className="mt-6">
        <Marca />
      </div>

      <div className="mt-10">
        <h1 className="text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
          Escribe tu correo y te mandamos un enlace para crear una nueva.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Correo electrónico</span>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                autoFocus
                className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] pl-11 pr-4 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
              />
            </div>
          </label>

          {error && (
            <p role="alert" className="text-[13px] font-medium text-[var(--status-error)]">
              {error}
            </p>
          )}

          <CtaFunnel onClick={enviar} disabled={!email.includes('@') || enviando}>
            {enviando ? 'Enviando…' : 'Enviarme el enlace'}
          </CtaFunnel>
        </div>
      </div>
    </div>
  );
}
