'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { Marca, NumeroAnimado } from '@/components/onboarding/ui';
import { OfertaPlanes } from '@/components/landing/OfertaPlanes';
import { leerEstado, saldoPendiente, simboloMoneda, type EstadoOnboarding } from '@/lib/onboarding';

export default function PaywallPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoOnboarding>({});

  useEffect(() => {
    const e = leerEstado();
    setEstado(e);
    // Sin un cliente cargado no hay recap que mostrar — vuelve al onboarding en vez
    // de enseñar una pantalla vacía (visitante que llega directo a /paywall por URL).
    if (!e.primerCliente) router.replace('/onboarding');
  }, [router]);

  if (!estado.primerCliente) return null;

  const saldo = saldoPendiente(estado.primerCliente);
  const moneda = estado.moneda ?? 'USD';

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[var(--bg)] pb-16 [font-family:var(--font-body)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(720px 460px at 50% -10%, color-mix(in oklab, var(--accent) 15%, transparent) 0%, transparent 62%), ' +
            'radial-gradient(560px 380px at 100% 0%, color-mix(in oklab, var(--accent-2) 12%, transparent) 0%, transparent 58%)',
        }}
      />
      <div className="mx-auto w-full max-w-[430px] px-5 pt-6">
        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push('/onboarding')}
            aria-label="Corregir mi cliente"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)]"
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </motion.button>
          <Marca />
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            Ya viste cómo trabaja tu <span className="text-[var(--accent)]">Radar de Cobros</span>
          </h1>
          <p className="mt-3 text-[15px] text-[var(--text-secondary)]">
            {estado.primerCliente.nombre} te debe{' '}
            <span className="font-semibold text-[var(--text-primary)] tabular-nums">
              <NumeroAnimado valor={saldo} prefijo={`${moneda} ${simboloMoneda(moneda)}`} />
            </span>
            . Elige con qué plan quieres seguir.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <OfertaPlanes
          kicker="ELIGE TU PLAN"
          tamanoTitulo="compacto"
          tituloMarked="Empieza gratis. [acento]Crece cuando lo necesites[/acento]."
          subtituloMarked="Sin tarjeta para el plan gratis. Cancela cuando quieras."
          planes={[
            {
              nombre: 'Free',
              precioMes: '$0',
              descripcion: 'Para empezar a controlar tus cobros hoy mismo.',
              ctaLabel: 'Seguir gratis',
              ctaHref: '/registro?plan=free',
              features: [
                'Hasta 3 clientes activos',
                'Hasta 5 proyectos',
                'Registro de pagos y saldo automático',
                'Panel básico y estado de cobros',
                'Recordatorios manuales para WhatsApp',
              ],
            },
            {
              nombre: 'Pro',
              precioMes: '$7.99',
              descripcion: 'Para freelancers con varios clientes activos a la vez.',
              ctaLabel: 'Quiero seguimiento ilimitado',
              ctaHref: '/registro?plan=pro',
              destacado: true,
              badge: 'MÁS POPULAR',
              features: [
                'Clientes y proyectos ilimitados',
                'Centro de cobros con seguimiento',
                'Recordatorios con plantillas y WhatsApp',
                'Reportes, gráficas y varias monedas',
                'Exportar en CSV y PDF',
              ],
            },
            {
              nombre: 'Premium',
              precioMes: '$14.99',
              descripcion: 'Para quien quiere proyectar y entender su negocio a fondo.',
              ctaLabel: 'Quiero proyectar mi negocio',
              ctaHref: '/registro?plan=premium',
              features: [
                'Todo lo de Pro, sin límites',
                'Proyección de tu flujo de dinero',
                'Metas mensuales con tu progreso',
                'Análisis de tu negocio con IA',
              ],
            },
          ]}
        />
      </div>

      <p className="mt-2 px-5 text-center text-[13px] text-[var(--text-tertiary)]">
        Cancela cuando quieras · {estado.primerCliente.nombre} queda guardado en cualquier plan
      </p>
    </div>
  );
}
