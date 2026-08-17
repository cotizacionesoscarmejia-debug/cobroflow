'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Plus, TrendingUp, ChevronRight, Check, ArrowRightLeft } from 'lucide-react';
import { NumeroAnimado } from '@/components/onboarding/ui';
import { Perforacion } from '@/components/landing/ui';
import { EstadoBadge } from '@/components/app/EstadoBadge';
import { createClient } from '@/lib/supabase/client';
import {
  obtenerDB,
  proyectosConDatos,
  cobradoEsteMesPorMoneda,
  diasAtraso,
  totalesPorMoneda,
  totalConsolidado,
  obtenerPerfilMoneda,
  obtenerTasas,
  type ProyectoConDatos,
  type TasaCambio,
} from '@/lib/app-data';
import { simboloMoneda } from '@/lib/onboarding';

const MotionLink = motion.create(Link);
const ORDEN_URGENCIA: Record<string, number> = { atrasado: 0, vence_hoy: 1, proximo: 2, al_dia: 3, pagado: 4 };

const entra = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const, delay: i * 0.07 },
});

function SkeletonDashboard() {
  return (
    <div className="mx-auto w-full max-w-[480px] animate-pulse px-5 pt-6">
      <div className="flex items-center justify-between">
        <div className="h-10 w-36 rounded-[var(--radius-button)] bg-[var(--surface-2)]" />
        <div className="size-11 rounded-full bg-[var(--surface-2)]" />
      </div>
      <div className="mt-6 h-32 rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="h-24 rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
        <div className="h-24 rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
      </div>
      <div className="mt-3 h-20 rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
      <div className="mt-8 h-16 rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
    </div>
  );
}

/** Un solo número grande si hay 1 moneda; una lista compacta si hay varias — nunca las suma. */
function MontoHero({ totales }: { totales: Record<string, number> }) {
  const entradas = Object.entries(totales);
  if (entradas.length <= 1) {
    const [moneda, monto] = entradas[0] ?? ['USD', 0];
    return (
      <p className="mt-1 text-[38px] font-bold leading-none tabular-nums [font-family:var(--font-display)]">
        <NumeroAnimado valor={monto} prefijo={`${moneda} ${simboloMoneda(moneda)}`} />
      </p>
    );
  }
  return (
    <div className="mt-2 flex flex-col gap-1">
      {entradas.map(([moneda, monto]) => (
        <p key={moneda} className="text-[22px] font-bold leading-none tabular-nums [font-family:var(--font-display)]">
          <NumeroAnimado valor={monto} prefijo={`${moneda} ${simboloMoneda(moneda)}`} />
        </p>
      ))}
    </div>
  );
}

/** Versión compacta del mismo patrón para las cards de la grilla (Por cobrar / Atrasado / Próximos). */
function MontoCompacto({ totales, tono }: { totales: Record<string, number>; tono?: 'error' }) {
  const entradas = Object.entries(totales);
  const color = tono === 'error' && entradas.some(([, m]) => m > 0) ? 'var(--status-error)' : 'var(--text-primary)';
  if (entradas.length === 0) {
    return (
      <p className="mt-1 text-[22px] font-bold tabular-nums [font-family:var(--font-display)]" style={{ color }}>
        —
      </p>
    );
  }
  if (entradas.length === 1) {
    const [moneda, monto] = entradas[0];
    return (
      <p className="mt-1 text-[22px] font-bold tabular-nums [font-family:var(--font-display)]" style={{ color }}>
        {moneda} {simboloMoneda(moneda)}
        {monto.toLocaleString('es')}
      </p>
    );
  }
  return (
    <div className="mt-1 flex flex-col gap-0.5">
      {entradas.map(([moneda, monto]) => (
        <p key={moneda} className="text-[15px] font-bold tabular-nums [font-family:var(--font-display)]" style={{ color }}>
          {moneda} {simboloMoneda(moneda)}
          {monto.toLocaleString('es')}
        </p>
      ))}
    </div>
  );
}

/** Total consolidado en la moneda principal — solo si hay tasa para cada moneda distinta; nunca lo inventa. */
function BloqueConsolidado({
  totales,
  monedaPrincipal,
  tasas,
}: {
  totales: Record<string, number>;
  monedaPrincipal: string;
  tasas: TasaCambio[];
}) {
  const monedas = Object.keys(totales);
  if (monedas.length <= 1) return null;
  const { total, faltantes } = totalConsolidado(totales, monedaPrincipal, tasas);
  return (
    <motion.div {...entra(2.5)} className="mt-3 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] bg-[color-mix(in_oklab,var(--accent)_6%,transparent)] p-4">
      <div className="flex items-center gap-2">
        <ArrowRightLeft size={14} color="var(--accent)" aria-hidden="true" />
        <p className="text-[12px] font-semibold text-[var(--accent)]">Valor consolidado</p>
      </div>
      {faltantes.length === 0 ? (
        <>
          <p className="mt-1 text-[24px] font-bold tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
            {monedaPrincipal} {simboloMoneda(monedaPrincipal)}
            {total.toLocaleString('es')}
          </p>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
            Conversión calculada con las tasas configuradas en tu cuenta.
          </p>
        </>
      ) : (
        <>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
            No se puede calcular el total consolidado porque falta configurar el tipo de cambio{' '}
            {faltantes.map((m) => `${m} → ${monedaPrincipal}`).join(', ')}.
          </p>
          <Link href="/app/cuenta/monedas" className="mt-2 inline-block text-[13px] font-semibold text-[var(--accent)]">
            Configurar tipo de cambio
          </Link>
        </>
      )}
    </motion.div>
  );
}

export default function DashboardPage() {
  const [proyectos, setProyectos] = useState<ProyectoConDatos[] | null>(null);
  const [cobradoPorMoneda, setCobradoPorMoneda] = useState<Record<string, number>>({});
  const [monedaPrincipal, setMonedaPrincipal] = useState('USD');
  const [tasas, setTasas] = useState<TasaCambio[]>([]);
  const [email, setEmail] = useState('');

  useEffect(() => {
    Promise.all([obtenerDB(), obtenerPerfilMoneda(), obtenerTasas()]).then(([db, perfil, tasasData]) => {
      setProyectos(proyectosConDatos(db));
      setCobradoPorMoneda(cobradoEsteMesPorMoneda(db));
      setMonedaPrincipal(perfil.monedaPrincipal);
      setTasas(tasasData);
    });
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ''));
  }, []);

  if (!proyectos) return <SkeletonDashboard />;

  const nombreUsuario = email ? email.split('@')[0].replace(/[._]/g, ' ') : '';
  const iniciales = email ? email.slice(0, 2).toUpperCase() : '··';

  const pendientes = proyectos.filter((p) => p.saldo > 0);
  const pendientePorMoneda = totalesPorMoneda(pendientes.map((p) => ({ moneda: p.cliente.moneda, monto: p.saldo })));
  const atrasadoPorMoneda = totalesPorMoneda(
    pendientes.filter((p) => p.estado === 'atrasado').map((p) => ({ moneda: p.cliente.moneda, monto: p.saldo }))
  );
  const proximosPorMoneda = totalesPorMoneda(
    pendientes
      .filter((p) => p.estado === 'proximo' || p.estado === 'vence_hoy')
      .map((p) => ({ moneda: p.cliente.moneda, monto: p.saldo }))
  );
  const necesitanAtencion = [...pendientes].sort((a, b) => ORDEN_URGENCIA[a.estado] - ORDEN_URGENCIA[b.estado]).slice(0, 4);

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]"
        style={{
          background:
            'radial-gradient(560px 360px at 20% 0%, color-mix(in oklab, var(--accent) 12%, transparent) 0%, transparent 60%)',
        }}
      />
      <div className="mx-auto w-full max-w-[480px] px-5 pt-6">
        <motion.div {...entra(0)} className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-[var(--text-secondary)]">Buenos días</p>
            <h1 className="truncate text-[20px] font-bold capitalize text-[var(--text-primary)] [font-family:var(--font-display)]">
              {nombreUsuario || 'tu negocio'}
            </h1>
          </div>
          <MotionLink
            href="/app/cuenta"
            aria-label="Ir a mi cuenta"
            whileTap={{ scale: 0.92 }}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--chip-bg)] text-[15px] font-bold text-[var(--accent)]"
          >
            {iniciales}
          </MotionLink>
        </motion.div>

        <motion.div
          {...entra(1)}
          className="relative mt-6 overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-[var(--accent)] to-[color-mix(in_oklab,var(--accent)_78%,black)] p-6 text-[var(--bg)] shadow-[var(--shadow-2)]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full"
            style={{ background: 'color-mix(in oklab, white 10%, transparent)' }}
          />
          <span
            aria-hidden="true"
            className="absolute inset-y-4 left-1.5 w-[3px] rounded-full"
            style={{ backgroundImage: 'repeating-linear-gradient(180deg, color-mix(in oklab, white 55%, transparent) 0 8px, transparent 8px 16px)' }}
          />
          <p className="text-[13px] opacity-85">Cobrado este mes</p>
          <MontoHero totales={cobradoPorMoneda} />
          <p className="mt-2 flex items-center gap-1.5 text-[12.5px] opacity-90">
            <TrendingUp size={14} aria-hidden="true" />
            Se actualiza cada vez que registras un pago
          </p>
        </motion.div>

        <motion.div {...entra(2)} className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
            <p className="text-[12px] text-[var(--text-secondary)]">Por cobrar</p>
            <MontoCompacto totales={pendientePorMoneda} />
          </div>
          <div className="rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
            <p className="text-[12px] text-[var(--text-secondary)]">Atrasado</p>
            <MontoCompacto totales={atrasadoPorMoneda} tono="error" />
          </div>
        </motion.div>

        <motion.div {...entra(3)} className="mt-3 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Próximos 30 días</p>
          <MontoCompacto totales={proximosPorMoneda} />
        </motion.div>

        <BloqueConsolidado totales={pendientePorMoneda} monedaPrincipal={monedaPrincipal} tasas={tasas} />

        <motion.div {...entra(4)} className="mt-8 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
            Necesitan tu atención
          </h2>
          {necesitanAtencion.length > 0 && (
            <span className="text-[12px] font-semibold text-[var(--text-secondary)]">{necesitanAtencion.length}</span>
          )}
        </motion.div>

        {necesitanAtencion.length === 0 ? (
          <motion.div
            {...entra(5)}
            className="mt-4 flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_35%,transparent)] p-6 text-center"
          >
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 }}
              className="flex size-12 items-center justify-center rounded-full bg-[var(--status-success-soft)]"
            >
              <Check size={22} strokeWidth={3} color="var(--status-success)" aria-hidden="true" />
            </motion.span>
            <p className="mt-3 text-[14px] font-semibold text-[var(--text-primary)]">Todo cobrado</p>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">No tienes pagos pendientes ahora mismo.</p>
          </motion.div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {necesitanAtencion.map((p, i) => (
              <MotionLink
                key={p.id}
                href={`/app/clientes/${p.cliente.id}`}
                {...entra(5 + i)}
                whileTap={{ scale: 0.97 }}
                className="relative flex items-center gap-3 overflow-hidden rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]"
              >
                <Perforacion tono={p.estado === 'atrasado' ? 'accent' : 'neutro'} />
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--chip-bg)] text-[13px] font-bold text-[var(--accent)]"
                >
                  {p.cliente.nombre.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{p.cliente.nombre}</p>
                  <p className="truncate text-[12px] text-[var(--text-secondary)]">{p.nombre}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[14px] font-bold tabular-nums text-[var(--text-primary)]">
                    {p.cliente.moneda} {simboloMoneda(p.cliente.moneda)}
                    {p.saldo.toLocaleString('es')}
                  </p>
                  <div className="mt-1">
                    <EstadoBadge estado={p.estado} dias={diasAtraso(p)} />
                  </div>
                </div>
                <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
              </MotionLink>
            ))}
          </div>
        )}
      </div>

      <MotionLink
        href="/app/clientes/nuevo"
        aria-label="Agregar cliente"
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-24 right-5 z-30 flex size-14 items-center justify-center rounded-full bg-[var(--accent)] shadow-[var(--shadow-2)]"
      >
        <Plus size={24} color="var(--bg)" aria-hidden="true" />
      </MotionLink>
    </div>
  );
}
