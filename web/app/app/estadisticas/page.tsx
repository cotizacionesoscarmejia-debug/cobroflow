'use client';

// Estadísticas (rediseño integral, Sesión 6) — Pro+. Resumen operativo básico
// (Dashboard) vs. analítica real aquí: evolución de cobros, clientes con
// mayor facturación, desglose por moneda. El análisis con IA y el reporte en
// PDF (Premium) ya existen en Cuenta — se enlazan desde aquí, no se duplican.

import { useMemo } from 'react';
import Link from 'next/link';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Sparkles, FileDown, ChevronRight, TrendingUp } from 'lucide-react';
import { BloqueoPlan } from '@/components/app/BloqueoPlan';
import { MetaMensual } from '@/components/app/MetaMensual';
import { useAppData } from '@/components/app/AppDataProvider';
import { proyectosConDatos, cobradosUltimosMeses, totalesPorMoneda, proyeccionFlujo } from '@/lib/app-data';
import { capacidadesDe } from '@/lib/planes';
import { simboloMoneda } from '@/lib/onboarding';

function monto(moneda: string, valor: number): string {
  return `${moneda} ${simboloMoneda(moneda)}${Math.round(valor).toLocaleString('es')}`;
}

export default function EstadisticasPage() {
  const { db, plan, monedaPrincipal, perfil } = useAppData();
  const capacidades = capacidadesDe(plan);

  const proyectos = useMemo(() => proyectosConDatos(db), [db]);
  const serieMensual = useMemo(() => cobradosUltimosMeses(db, monedaPrincipal, 6), [db, monedaPrincipal]);
  const proyeccion = useMemo(() => proyeccionFlujo(db, monedaPrincipal, 6), [db, monedaPrincipal]);

  const porCliente = useMemo(() => {
    const mapa = new Map<string, { nombre: string; moneda: string; total: number }>();
    for (const p of proyectos) {
      const actual = mapa.get(p.cliente.id) ?? { nombre: p.cliente.nombre, moneda: p.cliente.moneda, total: 0 };
      actual.total += p.pagado;
      mapa.set(p.cliente.id, actual);
    }
    return Array.from(mapa.values())
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [proyectos]);

  const cobradoPorMoneda = useMemo(
    () => totalesPorMoneda(db.pagos.map((p) => {
      const proyecto = db.proyectos.find((pr) => pr.id === p.proyectoId);
      const cliente = proyecto ? db.clientes.find((c) => c.id === proyecto.clienteId) : undefined;
      return { moneda: cliente?.moneda ?? monedaPrincipal, monto: p.monto };
    })),
    [db, monedaPrincipal]
  );

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10 md:max-w-none md:px-8 md:pb-12">
      <h1 className="text-[22px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)] md:text-[24px]">Estadísticas</h1>
      <p className="mt-1 text-[13.5px] text-[var(--text-secondary)]">Cómo está evolucionando tu negocio, más allá del día a día.</p>

      {!capacidades.canUseAdvancedReports ? (
        <div className="mt-6">
          <BloqueoPlan
            plan="pro"
            titulo="Con Pro puedes desbloquear reportes y gráficas"
            descripcion="Entiende mejor tus cobros: evolución mensual, tus mejores clientes y el desglose por moneda."
            email={perfil.email}
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          <section className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] md:p-5">
            <h2 className="text-[16px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Evolución de cobros</h2>
            <p className="text-[12px] text-[var(--text-secondary)]">Últimos 6 meses, en {monedaPrincipal}</p>
            <div className="mt-4 h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serieMensual} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid vertical={false} stroke="color-mix(in oklab, var(--text-tertiary) 14%, transparent)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip formatter={(v) => monto(monedaPrincipal, Number(v))} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-2)', fontSize: 12 }} />
                  <Bar dataKey="total" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <section className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] md:p-5">
              <h2 className="text-[16px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Clientes con mayor facturación</h2>
              {porCliente.length === 0 ? (
                <p className="mt-3 text-[12.5px] text-[var(--text-secondary)]">Aparecerán aquí cuando registres pagos.</p>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  {porCliente.map((c, i) => (
                    <div key={c.nombre + i} className="flex items-center justify-between">
                      <span className="flex items-center gap-2.5 text-[13.5px] font-medium text-[var(--text-primary)]">
                        <span className="flex size-6 items-center justify-center rounded-full bg-[var(--chip-bg)] text-[10.5px] font-bold text-[var(--accent)]">{i + 1}</span>
                        {c.nombre}
                      </span>
                      <span className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">{monto(c.moneda, c.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] md:p-5">
              <h2 className="text-[16px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Cobrado por moneda</h2>
              {Object.keys(cobradoPorMoneda).length === 0 ? (
                <p className="mt-3 text-[12.5px] text-[var(--text-secondary)]">Todavía no has recibido pagos.</p>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  {Object.entries(cobradoPorMoneda).map(([m, v]) => (
                    <div key={m} className="flex items-center justify-between">
                      <span className="text-[13.5px] font-medium text-[var(--text-primary)]">{m}</span>
                      <span className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">{monto(m, v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Premium — meta mensual y proyección de flujo. */}
          {capacidades.canUseGoals && capacidades.canUseForecasting ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <section className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] md:p-5">
                <MetaMensual />
              </section>

              <section className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] md:p-5">
                <div className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--chip-bg)]">
                    <TrendingUp size={16} color="var(--accent)" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Proyección de flujo</h2>
                    <p className="text-[12px] text-[var(--text-secondary)]">Lo que esperas cobrar, mes a mes</p>
                  </div>
                </div>
                <div className="mt-3 h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={proyeccion} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid vertical={false} stroke="color-mix(in oklab, var(--text-tertiary) 14%, transparent)" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} width={44} />
                      <Tooltip formatter={(v) => monto(monedaPrincipal, Number(v))} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-2)', fontSize: 12 }} />
                      <Bar dataKey="esperado" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-1 text-[11px] text-[var(--text-secondary)]">Según las fechas prometidas de tus proyectos pendientes, en {monedaPrincipal}.</p>
              </section>
            </div>
          ) : null}

          {/* Premium — el análisis con IA y el reporte en PDF ya existen en Cuenta; se enlazan aquí. */}
          <section className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] md:p-5">
            <h2 className="text-[16px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Reportes y análisis con IA</h2>
            {capacidades.canUseAI ? (
              <div className="mt-3 flex flex-col gap-2.5">
                <Link href="/app/cuenta" className="flex items-center justify-between rounded-[var(--radius-button)] bg-[var(--surface-2)] px-4 py-3">
                  <span className="flex items-center gap-2.5 text-[13.5px] font-semibold text-[var(--text-primary)]">
                    <Sparkles size={16} color="var(--accent)" aria-hidden="true" />
                    Analizar mi negocio con IA
                  </span>
                  <ChevronRight size={15} className="text-[var(--text-tertiary)]" aria-hidden="true" />
                </Link>
                <Link href="/app/cuenta" className="flex items-center justify-between rounded-[var(--radius-button)] bg-[var(--surface-2)] px-4 py-3">
                  <span className="flex items-center gap-2.5 text-[13.5px] font-semibold text-[var(--text-primary)]">
                    <FileDown size={16} color="var(--accent)" aria-hidden="true" />
                    Descargar reporte en PDF
                  </span>
                  <ChevronRight size={15} className="text-[var(--text-tertiary)]" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="mt-3">
                <BloqueoPlan
                  plan="premium"
                  titulo="Analiza tu negocio con IA"
                  descripcion="Premium interpreta tus números y te dice qué va bien, qué necesita atención y qué hacer a continuación."
                  email={perfil.email}
                />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
