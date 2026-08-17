'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, MailCheck } from 'lucide-react';
import { Marca, CtaFunnel } from '@/components/onboarding/ui';
import { createClient } from '@/lib/supabase/client';
import { guardarEstado, leerEstado, type EstadoOnboarding } from '@/lib/onboarding';

const NOMBRE_PLAN: Record<string, string> = { free: 'Free', pro: 'Pro', premium: 'Premium' };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const plan = searchParams.get('plan');
  const nombrePlan = plan ? NOMBRE_PLAN[plan] : undefined;
  const [estado, setEstado] = useState<EstadoOnboarding>({});

  useEffect(() => {
    if (plan === 'free' || plan === 'pro' || plan === 'premium') {
      setEstado(guardarEstado({ planElegido: plan }));
    } else {
      setEstado(leerEstado());
    }
  }, [plan]);

  async function continuar() {
    if (!email.includes('@')) return;
    setEnviando(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/confirmar?next=/app`,
      },
    });
    setEnviando(false);
    if (err) {
      setError('No pudimos enviar el enlace. Revisa tu correo e intenta de nuevo.');
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
          Te mandamos un enlace a <span className="font-semibold text-[var(--text-primary)]">{email}</span>. Ábrelo
          desde tu celular o computadora para entrar.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col justify-center px-5 py-10">
      <Marca />

      <div className="mt-10">
        <h1 className="text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
          {estado.primerCliente ? 'Crea tu cuenta gratis' : 'Inicia sesión en CobroFlow'}
        </h1>
        <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
          {estado.primerCliente
            ? `Para guardar a ${estado.primerCliente.nombre} y no perder tu saldo calculado.`
            : 'Escribe tu correo y te mandamos un enlace para entrar. Si no tienes cuenta todavía, la creamos al instante.'}
          {nombrePlan && ` Elegiste el plan ${nombrePlan}.`}
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
                className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] pl-11 pr-4 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
              />
            </div>
          </label>

          {error && (
            <p role="alert" className="text-[13px] font-medium text-[var(--status-error)]">
              {error}
            </p>
          )}

          <CtaFunnel onClick={continuar} disabled={!email.includes('@') || enviando}>
            {enviando ? 'Enviando…' : 'Enviarme el enlace'}
          </CtaFunnel>
        </div>

        <p className="mt-5 text-center text-[12.5px] leading-relaxed text-[var(--text-tertiary)]">
          Al continuar aceptas los{' '}
          <a href="/terminos" className="underline">Términos</a> y la{' '}
          <a href="/privacidad" className="underline">Política de privacidad</a>.
        </p>
      </div>
    </div>
  );
}
