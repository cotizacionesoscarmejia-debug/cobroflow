'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock } from 'lucide-react';
import { Marca, CtaFunnel } from '@/components/onboarding/ui';
import { createClient } from '@/lib/supabase/client';

const LARGO_MINIMO = 8;

// Mismo patron anti-escaner que /confirmar: no se verifica el token solo con
// cargar la pagina (Gmail/Outlook a veces "abren" el enlace del correo por
// seguridad y gastarian el unico uso antes de que la persona haga clic).

export default function RestablecerContrasenaPage() {
  return (
    <Suspense fallback={null}>
      <RestablecerForm />
    </Suspense>
  );
}

type Estado = 'esperando' | 'verificando' | 'formulario' | 'guardando' | 'listo' | 'error';

function RestablecerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [estado, setEstado] = useState<Estado>('esperando');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const tokenHash = searchParams.get('token_hash');

  async function confirmarEnlace() {
    if (!tokenHash) {
      setEstado('error');
      return;
    }
    setEstado('verificando');
    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
    if (err) {
      setEstado('error');
      return;
    }
    setEstado('formulario');
  }

  async function guardarContrasena() {
    if (password.length < LARGO_MINIMO || password !== confirmarPassword) return;
    setEstado('guardando');
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      // Supabase rechaza guardar la MISMA contraseña que ya tienes (protección
      // normal, no un fallo real) — si pasa esto, tu contraseña ya es esta,
      // así que se trata igual que un exito en vez de mostrar un error confuso.
      const yaEsTuContrasena = err.message.toLowerCase().includes('different from the old password');
      if (!yaEsTuContrasena) {
        setError('No pudimos guardar tu nueva contraseña. Intenta de nuevo.');
        setEstado('formulario');
        return;
      }
    }
    setEstado('listo');
    setTimeout(() => router.push('/app'), 1500);
  }

  const listoParaGuardar = password.length >= LARGO_MINIMO && password === confirmarPassword;

  if (estado === 'error' || !tokenHash) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col items-center justify-center px-5 py-10 text-center">
        <Marca />
        <h1 className="mt-8 text-[20px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
          El enlace ya no es válido
        </h1>
        <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-[var(--text-secondary)]">
          Puede que ya lo hayas usado o que haya vencido. Pide uno nuevo para continuar.
        </p>
        <a href="/recuperar-contrasena" className="mt-6 text-[14px] font-semibold text-[var(--accent)]">
          Pedir un enlace nuevo
        </a>
      </div>
    );
  }

  if (estado === 'listo') {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col items-center justify-center px-5 py-10 text-center">
        <Marca />
        <h1 className="mt-8 text-[20px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
          Contraseña actualizada
        </h1>
        <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-[var(--text-secondary)]">
          Entrando a tu cuenta…
        </p>
      </div>
    );
  }

  if (estado === 'formulario' || estado === 'guardando') {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col justify-center px-5 py-10">
        <Marca />
        <div className="mt-10">
          <h1 className="text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            Crea tu nueva contraseña
          </h1>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
            Ya confirmamos que eres tú. Escribe tu nueva contraseña.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              guardarContrasena();
            }}
          >
            <div className="mt-8 flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[var(--text-secondary)]">Nueva contraseña</span>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoFocus
                    className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] pl-11 pr-4 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                  />
                </div>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[var(--text-secondary)]">Confirmar contraseña</span>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
                  <input
                    type="password"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] pl-11 pr-4 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                  />
                </div>
              </label>
              {confirmarPassword.length > 0 && password !== confirmarPassword && (
                <p className="text-[13px] font-medium text-[var(--status-error)]">Las contraseñas no coinciden.</p>
              )}
              {password.length > 0 && password.length < LARGO_MINIMO && (
                <p className="text-[13px] font-medium text-[var(--status-error)]">
                  La contraseña debe tener al menos {LARGO_MINIMO} caracteres.
                </p>
              )}
              {error && (
                <p role="alert" className="text-[13px] font-medium text-[var(--status-error)]">
                  {error}
                </p>
              )}
              <CtaFunnel onClick={guardarContrasena} disabled={!listoParaGuardar || estado === 'guardando'}>
                {estado === 'guardando' ? 'Guardando…' : 'Guardar y entrar'}
              </CtaFunnel>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col items-center justify-center px-5 py-10 text-center">
      <Marca />
      <h1 className="mt-8 text-[20px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
        Confirma que eres tú
      </h1>
      <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-[var(--text-secondary)]">
        Toca el botón para continuar y crear tu nueva contraseña.
      </p>
      <div className="mt-6 w-full">
        <CtaFunnel onClick={confirmarEnlace} disabled={estado === 'verificando'}>
          {estado === 'verificando' ? 'Confirmando…' : 'Confirmar'}
        </CtaFunnel>
      </div>
    </div>
  );
}
