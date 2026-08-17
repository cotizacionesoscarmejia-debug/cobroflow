'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';
import { Marca, CtaFunnel } from '@/components/onboarding/ui';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function entrar() {
    if (!email.includes('@') || password.length === 0) return;
    setEnviando(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setEnviando(false);
    if (err) {
      setError('Correo o contraseña incorrectos.');
      return;
    }
    router.push('/app');
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col justify-center px-5 py-10">
      <Marca />

      <div className="mt-10">
        <h1 className="text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
          Inicia sesión en CobroFlow
        </h1>
        <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
          Entra con tu correo y tu contraseña.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            entrar();
          }}
        >
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

            <label className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[var(--text-secondary)]">Contraseña</span>
                <a href="/recuperar-contrasena" className="text-[12.5px] font-medium text-[var(--accent)]">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] pl-11 pr-4 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                />
              </div>
            </label>

            {error && (
              <p role="alert" className="text-[13px] font-medium text-[var(--status-error)]">
                {error}
              </p>
            )}

            <CtaFunnel onClick={entrar} disabled={!email.includes('@') || password.length === 0 || enviando}>
              {enviando ? 'Entrando…' : 'Iniciar sesión'}
            </CtaFunnel>
          </div>
        </form>

        <p className="mt-5 text-center text-[13px] text-[var(--text-secondary)]">
          ¿No tienes cuenta?{' '}
          <a href="/registro" className="font-semibold text-[var(--accent)]">
            Crea una gratis
          </a>
        </p>

        <p className="mt-5 text-center text-[12.5px] leading-relaxed text-[var(--text-tertiary)]">
          Al continuar aceptas los{' '}
          <a href="/terminos" className="underline">Términos</a> y la{' '}
          <a href="/privacidad" className="underline">Política de privacidad</a>.
        </p>
      </div>
    </div>
  );
}
