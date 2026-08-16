'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { hotmartCheckoutUrl } from '@/lib/hotmart-links';

const NOMBRE_PLAN: Record<string, string> = { free: 'Free', pro: 'Pro', premium: 'Premium' };

export default function CuentaPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [plan, setPlan] = useState<'free' | 'pro' | 'premium'>('free');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      setEmail(user.email ?? '');
      setUserId(user.id);
      const { data: perfil } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
      if (perfil) setPlan((perfil.plan as 'free' | 'pro' | 'premium') ?? 'free');
    });
  }, [router]);

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  const iniciales = email ? email.slice(0, 2).toUpperCase() : '··';

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10">
      <h1 className="text-[22px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Cuenta</h1>

      <div className="mt-6 flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-[var(--chip-bg)] text-[15px] font-bold text-[var(--accent)]"
        >
          {iniciales}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-[var(--text-primary)]">{email || 'Cargando…'}</p>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-[var(--text-secondary)]">Tu plan</p>
            <p className="text-[16px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
              {NOMBRE_PLAN[plan]}
            </p>
          </div>
          {plan === 'premium' && (
            <span className="text-[12px] font-semibold text-[var(--accent)]">Ya tienes todo</span>
          )}
        </div>
        {plan !== 'premium' && (
          <div className="mt-4 flex flex-col gap-2">
            {plan === 'free' && (
              <a
                href={hotmartCheckoutUrl('pro', { email, userId })}
                className="flex h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-[var(--bg)]"
              >
                Pasar a Pro — $7.99/mes
              </a>
            )}
            <a
              href={hotmartCheckoutUrl('premium', { email, userId })}
              className="flex h-11 items-center justify-center rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] px-4 text-[13px] font-semibold text-[var(--accent)]"
            >
              Pasar a Premium — $14.99/mes
            </a>
          </div>
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
