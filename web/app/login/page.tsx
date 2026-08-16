'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail } from 'lucide-react';
import { Marca, CtaFunnel } from '@/components/onboarding/ui';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
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

  function continuar() {
    if (!email.includes('@')) return;
    setEnviando(true);
    // Sin backend real todavía (llega en Sesión 6 con Supabase Auth) — se guarda la
    // intención y se entra directo, en vez de fingir un correo que no se envió.
    guardarEstado({});
    setTimeout(() => router.push('/app'), 500);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col justify-center px-5 py-10">
      <Marca />

      <div className="mt-10">
        <h1 className="text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
          Crea tu cuenta gratis
        </h1>
        <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
          {estado.primerCliente
            ? `Para guardar a ${estado.primerCliente.nombre} y no perder tu saldo calculado.`
            : 'Para guardar tus clientes y no perder tu progreso.'}
          {nombrePlan && ` Elegiste el plan ${nombrePlan}.`}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            className="flex h-14 w-full items-center justify-center gap-3 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] text-[15px] font-semibold text-[var(--text-primary)]"
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          <div className="my-1 flex items-center gap-3 text-[12px] text-[var(--text-tertiary)]">
            <span className="h-px flex-1 bg-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)]" />
            o con tu correo
            <span className="h-px flex-1 bg-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)]" />
          </div>

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

          <CtaFunnel onClick={continuar} disabled={!email.includes('@') || enviando}>
            {enviando ? 'Entrando…' : 'Crear mi cuenta'}
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.95v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.95a9 9 0 0 0 0 8.08l3.02-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.96l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}
