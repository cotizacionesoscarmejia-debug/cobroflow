'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, MailCheck, Lock } from 'lucide-react';
import { Marca, CtaFunnel } from '@/components/onboarding/ui';
import { createClient } from '@/lib/supabase/client';
import { guardarEstado, leerEstado, type EstadoOnboarding } from '@/lib/onboarding';

const NOMBRE_PLAN: Record<string, string> = { free: 'Free', pro: 'Pro', premium: 'Premium' };
const LARGO_MINIMO = 8;

export default function RegistroPage() {
  return (
    <Suspense fallback={null}>
      <RegistroForm />
    </Suspense>
  );
}

function RegistroForm() {
  const searchParams = useSearchParams();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
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

  const listoParaEnviar =
    nombre.trim().length > 0 &&
    apellido.trim().length > 0 &&
    email.includes('@') &&
    password.length >= LARGO_MINIMO &&
    password === confirmarPassword &&
    aceptaTerminos;

  async function crearCuenta() {
    if (!listoParaEnviar) return;
    setEnviando(true);
    setError(null);
    // Se guarda tambien en sessionStorage como respaldo: si por lo que sea el
    // trigger de la base de datos no toma los metadatos, /confirmar lo aplica
    // de todas formas (mismo patron ya probado con primerCliente).
    guardarEstado({ nombre: nombre.trim(), apellido: apellido.trim() });
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/confirmar?next=/app`,
        data: {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          full_name: `${nombre.trim()} ${apellido.trim()}`.trim(),
        },
      },
    });
    setEnviando(false);
    if (err) {
      if (err.message.toLowerCase().includes('already registered') || err.message.toLowerCase().includes('already exists')) {
        setError('Ya existe una cuenta con ese correo. Inicia sesión en vez de crear una nueva.');
      } else {
        setError('No pudimos crear tu cuenta. Intenta de nuevo.');
      }
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
          Confirma tu correo
        </h1>
        <p className="mt-2 max-w-[32ch] text-[14px] leading-relaxed text-[var(--text-secondary)]">
          Te mandamos un enlace a <span className="font-semibold text-[var(--text-primary)]">{email}</span>. Ábrelo
          para activar tu cuenta y entrar.
        </p>
      </div>
    );
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            crearCuenta();
          }}
        >
          <div className="mt-8 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[var(--text-secondary)]">Nombre</span>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ana"
                  autoFocus
                  className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[var(--text-secondary)]">Apellido</span>
                <input
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="López"
                  className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                />
              </label>
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

            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--text-secondary)]">Contraseña</span>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
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

            <label className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]"
              />
              <span className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
                Acepto los <a href="/terminos" className="underline" target="_blank" rel="noopener noreferrer">Términos</a> y
                autorizo el tratamiento de mis datos según la{' '}
                <a href="/privacidad" className="underline" target="_blank" rel="noopener noreferrer">Política de privacidad</a>.
              </span>
            </label>

            {error && (
              <p role="alert" className="text-[13px] font-medium text-[var(--status-error)]">
                {error}
              </p>
            )}

            <CtaFunnel onClick={crearCuenta} disabled={!listoParaEnviar || enviando}>
              {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
            </CtaFunnel>
          </div>
        </form>

        <p className="mt-5 text-center text-[13px] text-[var(--text-secondary)]">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="font-semibold text-[var(--accent)]">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}
