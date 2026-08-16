'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { leerEstado } from '@/lib/onboarding';

const NOMBRE_PLAN: Record<string, string> = { free: 'Free', pro: 'Pro', premium: 'Premium' };

export default function CuentaPage() {
  const router = useRouter();
  const [plan, setPlan] = useState('Free');

  useEffect(() => {
    const e = leerEstado();
    if (e.planElegido) setPlan(NOMBRE_PLAN[e.planElegido] ?? 'Free');
  }, []);

  function cerrarSesion() {
    try {
      window.sessionStorage.removeItem('cobroflow_onboarding');
      window.localStorage.removeItem('cobroflow_app_data');
    } catch {
      // almacenamiento bloqueado — igual navega afuera
    }
    router.push('/');
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10">
      <h1 className="text-[22px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Cuenta</h1>

      <div className="mt-6 flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-[var(--chip-bg)] text-[15px] font-bold text-[var(--accent)]"
        >
          CR
        </span>
        <div>
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">Carlos Rodríguez</p>
          <p className="text-[13px] text-[var(--text-secondary)]">CR Digital</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
        <div>
          <p className="text-[13px] text-[var(--text-secondary)]">Tu plan</p>
          <p className="text-[16px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">{plan}</p>
        </div>
        {plan === 'Free' && (
          <a
            href="/paywall"
            className="flex h-10 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-[var(--bg)]"
          >
            Mejorar
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={cerrarSesion}
        className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] text-[14px] font-semibold text-[var(--text-primary)]"
      >
        <LogOut size={16} aria-hidden="true" />
        Cerrar sesión
      </button>
    </div>
  );
}
