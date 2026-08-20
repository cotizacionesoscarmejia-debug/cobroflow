'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Marca, CtaFunnel } from '@/components/onboarding/ui';
import { createClient } from '@/lib/supabase/client';
import { guardarEstado, leerEstado } from '@/lib/onboarding';
import { migrarClienteDeOnboarding, actualizarNombre } from '@/lib/app-data';

// No se verifica el token automáticamente al cargar: Gmail/Outlook a veces
// "escanean" el enlace del correo por seguridad y gastan el único uso antes de
// que la persona haga clic — por eso esto exige un tap humano real primero.
// Mismo patrón ya probado y funcionando en English2Hire.

export default function ConfirmarPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmarForm />
    </Suspense>
  );
}

type Estado = 'esperando' | 'verificando' | 'error';

function ConfirmarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [estado, setEstado] = useState<Estado>('esperando');
  const tokenHash = searchParams.get('token_hash');
  const next = searchParams.get('next') || '/app';

  async function confirmar() {
    if (!tokenHash) {
      setEstado('error');
      return;
    }
    setEstado('verificando');
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
    if (error) {
      setEstado('error');
      return;
    }

    // Migra el primer cliente del onboarding (si existe) a la cuenta real recién creada.
    const { planElegido, cicloElegido, nombre, apellido } = leerEstado();
    try {
      await migrarClienteDeOnboarding();
      if (nombre && apellido) {
        await actualizarNombre(nombre, apellido);
      }
      guardarEstado({ primerCliente: undefined, planElegido: undefined, cicloElegido: undefined, nombre: undefined, apellido: undefined });
    } catch {
      // La cuenta ya quedó creada — si esto falla, el usuario solo pierde el
      // traspaso del cliente de prueba o su nombre, no el acceso. No bloquea el login.
    }

    // Si eligió un plan pago en el paywall, lo mandamos directo al pago real de
    // Hotmart en vez de a la app — vía /api/ir-a-hotmart, que registra el clic
    // (fuente real del carrito abandonado, B/18/35) y arma el link con la
    // sesión que se acaba de crear.
    if (planElegido === 'pro' || planElegido === 'premium') {
      const sufijoCiclo = cicloElegido === 'anual' ? '&ciclo=anual' : '';
      window.location.href = `/api/ir-a-hotmart?plan=${planElegido}${sufijoCiclo}`;
      return;
    }

    router.push(next);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col items-center justify-center px-5 py-10 text-center">
      <Marca />

      {estado === 'error' || !tokenHash ? (
        <>
          <h1 className="mt-8 text-[20px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
            El enlace ya no es válido
          </h1>
          <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-[var(--text-secondary)]">
            Puede que ya lo hayas usado o que haya vencido. Pide uno nuevo para entrar.
          </p>
          <a href="/registro" className="mt-6 text-[14px] font-semibold text-[var(--accent)]">
            Crear mi cuenta de nuevo
          </a>
        </>
      ) : (
        <>
          <h1 className="mt-8 text-[20px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
            Ya casi entras
          </h1>
          <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-[var(--text-secondary)]">
            Toca el botón para confirmar que eres tú.
          </p>
          <div className="mt-6 w-full">
            <CtaFunnel onClick={confirmar} disabled={estado === 'verificando'}>
              {estado === 'verificando' ? 'Entrando…' : 'Confirmar y entrar'}
            </CtaFunnel>
          </div>
        </>
      )}
    </div>
  );
}
