'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { DollarSign, Clock, AlertTriangle, ChevronRight, MessageCircle, Info } from 'lucide-react';
import { NumeroAnimado } from '@/components/onboarding/ui';
import { Perforacion } from '@/components/landing/ui';
import { EstadoBadge } from '@/components/app/EstadoBadge';
import { BloqueoPlan } from '@/components/app/BloqueoPlan';
import { MetaMensual } from '@/components/app/MetaMensual';
import { useAppData } from '@/components/app/AppDataProvider';
import {
  proyectosConDatos,
  cobradoEsteMesPorMoneda,
  cobradoMesAnteriorPorMoneda,
  cobradoEsteAnioPorMoneda,
  serieCobrosDelMes,
  diasAtraso,
  totalesPorMoneda,
  totalConsolidado,
  nombreParaMostrar,
  gastadoEsteMesPorMoneda,
  type ProyectoConDatos,
} from '@/lib/app-data';
import { capacidadesDe } from '@/lib/planes';
import { simboloMoneda } from '@/lib/onboarding';

const ORDEN_URGENCIA: Record<string, number> = { atrasado: 0, vence_hoy: 1, proximo: 2, al_dia: 3, pagado: 4 };

const entra = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const, delay: i * 0.06 },
});

function monto(moneda: string, valor: number): string {
  return `${moneda} ${simboloMoneda(moneda)}${Math.round(valor).toLocaleString('es')}`;
}

function calcularComparacion(actual: number, anterior: number): { texto: string; positivo: boolean } | null {
  if (anterior <= 0) return null;
  const cambio = Math.round(((actual - anterior) / anterior) * 100);
  if (cambio === 0) return null;
  return {
    texto: `${cambio > 0 ? '↗' : '↘'} ${Math.abs(cambio)}% ${cambio > 0 ? 'más' : 'menos'} que el mes pasado`,
    positivo: cambio > 0,
  };
}

function SkeletonDashboard() {
  return (
    <div className="mx-auto w-full max-w-[480px] animate-pulse px-5 pt-6 md:max-w-none md:px-8 md:pt-6">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-28 rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
        <div className="h-28 rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
        <div className="h-28 rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
      </div>
      <div className="mt-4 h-64 rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
    </div>
  );
}

function TarjetaStat({
  i,
  icono: Icono,
  tono,
  titulo,
  valor,
  nota,
  notaTono,
}: {
  i: number;
  icono: typeof DollarSign;
  tono: 'accent' | 'accent-2' | 'error';
  titulo: string;
  valor: React.ReactNode;
  nota?: string;
  notaTono?: 'positivo' | 'negativo' | 'error' | 'neutro';
}) {
  const color = tono === 'accent' ? 'var(--accent)' : tono === 'accent-2' ? 'var(--accent-2)' : 'var(--status-error)';
  const bgSuave = tono === 'accent' ? 'var(--status-success-soft)' : tono === 'accent-2' ? 'var(--chip-bg)' : 'var(--status-error-soft)';
  const notaColor =
    notaTono === 'error' ? 'var(--status-error)' : notaTono === 'negativo' ? 'var(--text-secondary)' : 'var(--status-success)';
  return (
    <motion.div
      {...entra(i)}
      className="relative overflow-hidden rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: bgSuave }}>
          <Icono size={18} color={color} aria-hidden="true" />
        </span>
        <p className="text-[13px] font-medium text-[var(--text-secondary)]">{titulo}</p>
      </div>
      <div className="mt-3 text-[26px] font-bold leading-none tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
        {valor}
      </div>
      {nota && (
        <p className="mt-2 text-[12px] font-medium" style={{ color: notaColor }}>
          {nota}
        </p>
      )}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { db, plan, monedaPrincipal, tasas, perfil, gastos, cargando } = useAppData();
  const capacidades = capacidadesDe(plan);

  if (cargando) return <SkeletonDashboard />;

  const nombreUsuario = nombreParaMostrar(perfil);
  const proyectos = proyectosConDatos(db);
  const cobradoPorMoneda = cobradoEsteMesPorMoneda(db);
  const gastadoPorMoneda = gastadoEsteMesPorMoneda(gastos);
  const utilidadNeta = (cobradoPorMoneda[monedaPrincipal] ?? 0) - (gastadoPorMoneda[monedaPrincipal] ?? 0);
  const cobradoAnteriorPorMoneda = cobradoMesAnteriorPorMoneda(db);
  const cobradoAnioPorMoneda = cobradoEsteAnioPorMoneda(db);

  const pendientes = proyectos.filter((p) => p.saldo > 0);
  const pendientePorMoneda = totalesPorMoneda(pendientes.map((p) => ({ moneda: p.cliente.moneda, monto: p.saldo })));
  const atrasados = pendientes.filter((p) => p.estado === 'atrasado');
  const clientesAtrasados = new Set(atrasados.map((p) => p.cliente.id)).size;
  const proximos = pendientes
    .filter((p) => p.estado === 'proximo' || p.estado === 'vence_hoy')
    .sort((a, b) => a.fechaPromesa.localeCompare(b.fechaPromesa));

  const seguimientoHoy = [...pendientes].sort((a, b) => ORDEN_URGENCIA[a.estado] - ORDEN_URGENCIA[b.estado]).slice(0, 6);

  const monedasCobradas = Object.keys(cobradoPorMoneda);
  const comparacionMes =
    monedasCobradas.length === 1 ? calcularComparacion(cobradoPorMoneda[monedasCobradas[0]] ?? 0, cobradoAnteriorPorMoneda[monedasCobradas[0]] ?? 0) : null;

  const cCobradoAnio = totalConsolidado(cobradoAnioPorMoneda, monedaPrincipal, tasas);
  const cPendiente = totalConsolidado(pendientePorMoneda, monedaPrincipal, tasas);

  const serieMes = serieCobrosDelMes(db, monedaPrincipal);

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10 md:max-w-none md:px-8 md:pb-12">
      {/* Saludo — solo en móvil (el AppShell ya lo muestra en la barra superior de desktop/tablet) */}
      <motion.div {...entra(0)} className="md:hidden">
        <p className="text-[13px] text-[var(--text-secondary)]">Hola</p>
        <h1 className="truncate text-[20px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
          {nombreUsuario ? `${nombreUsuario.split(' ')[0]} 👋` : 'tu negocio'}
        </h1>
      </motion.div>

      {/* ── 3 tarjetas principales ── */}
      <div className="mt-5 grid grid-cols-1 gap-3 md:mt-0 md:grid-cols-3">
        <TarjetaStat
          i={1}
          icono={DollarSign}
          tono="accent"
          titulo="Cobrado este mes"
          valor={
            monedasCobradas.length <= 1 ? (
              <NumeroAnimado valor={cobradoPorMoneda[monedasCobradas[0]] ?? 0} prefijo={`${monedasCobradas[0] ?? monedaPrincipal} ${simboloMoneda(monedasCobradas[0] ?? monedaPrincipal)}`} />
            ) : (
              <span className="text-[16px] leading-tight">
                {monedasCobradas.map((m) => (
                  <span key={m} className="block">
                    {monto(m, cobradoPorMoneda[m])}
                  </span>
                ))}
              </span>
            )
          }
          nota={comparacionMes?.texto}
          notaTono={comparacionMes?.positivo ? 'positivo' : 'negativo'}
        />
        <TarjetaStat
          i={2}
          icono={Clock}
          tono="accent-2"
          titulo="Pendiente por cobrar"
          valor={
            Object.keys(pendientePorMoneda).length <= 1 ? (
              <NumeroAnimado valor={Object.values(pendientePorMoneda)[0] ?? 0} prefijo={`${Object.keys(pendientePorMoneda)[0] ?? monedaPrincipal} ${simboloMoneda(Object.keys(pendientePorMoneda)[0] ?? monedaPrincipal)}`} />
            ) : (
              <span className="text-[16px] leading-tight">
                {Object.entries(pendientePorMoneda).map(([m, v]) => (
                  <span key={m} className="block">
                    {monto(m, v)}
                  </span>
                ))}
              </span>
            )
          }
        />
        <TarjetaStat
          i={3}
          icono={AlertTriangle}
          tono="error"
          titulo="Clientes atrasados"
          valor={clientesAtrasados}
          nota={clientesAtrasados > 0 ? 'Requieren tu atención' : undefined}
          notaTono="error"
        />
      </div>

      {/* ── Columnas: seguimiento+gráfica (ancha) / próximos+resumen (angosta) ── */}
      <div className="mt-6 grid grid-cols-1 gap-5 md:mt-6 md:grid-cols-[1.7fr_1fr] md:items-start">
        <div className="flex flex-col gap-5">
          {/* Seguimiento de hoy */}
          <motion.section {...entra(4)} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] md:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Seguimiento de hoy</h2>
                {pendientes.length > 0 && (
                  <span className="rounded-full bg-[var(--chip-bg)] px-2 py-0.5 text-[11px] font-bold text-[var(--accent)]">
                    {pendientes.length} pendiente{pendientes.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              {pendientes.length > 0 && (
                <Link href="/app/cobros" className="text-[12.5px] font-semibold text-[var(--accent)]">
                  Ver todos
                </Link>
              )}
            </div>

            {seguimientoHoy.length === 0 ? (
              <div className="mt-4 flex flex-col items-center rounded-[var(--radius-button)] border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_35%,transparent)] py-8 text-center">
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">Todo cobrado 🎉</p>
                <p className="mt-1 text-[12.5px] text-[var(--text-secondary)]">No tienes pagos pendientes ahora mismo.</p>
              </div>
            ) : (
              <>
                {/* Tabla — desktop/tablet */}
                <div className="mt-4 hidden overflow-x-auto md:block">
                  <table className="w-full border-collapse text-left text-[13px]">
                    <thead>
                      <tr className="text-[12px] text-[var(--text-tertiary)]">
                        <th className="pb-2 font-medium">Cliente</th>
                        <th className="pb-2 font-medium">Proyecto</th>
                        <th className="pb-2 font-medium">Vence</th>
                        <th className="pb-2 font-medium">Monto</th>
                        <th className="pb-2 font-medium">Estado</th>
                        <th className="pb-2 font-medium">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seguimientoHoy.map((p) => (
                        <tr key={p.id} className="border-t border-[color-mix(in_oklab,var(--text-tertiary)_14%,transparent)]">
                          <td className="py-2.5 pr-3">
                            <Link href={`/app/clientes/${p.cliente.id}`} className="flex items-center gap-2.5">
                              <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--chip-bg)] text-[11px] font-bold text-[var(--accent)]">
                                {p.cliente.nombre.slice(0, 2).toUpperCase()}
                              </span>
                              <span className="font-medium text-[var(--text-primary)]">{p.cliente.nombre}</span>
                            </Link>
                          </td>
                          <td className="py-2.5 pr-3 text-[var(--text-secondary)]">{p.nombre}</td>
                          <td className="py-2.5 pr-3 text-[var(--text-secondary)]">
                            {new Date(p.fechaPromesa).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="py-2.5 pr-3 font-semibold tabular-nums text-[var(--text-primary)]">{monto(p.cliente.moneda, p.saldo)}</td>
                          <td className="py-2.5 pr-3">
                            <EstadoBadge estado={p.estado} dias={diasAtraso(p)} />
                          </td>
                          <td className="py-2.5">
                            <Link
                              href="/app/recordatorios"
                              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] px-3 text-[12px] font-semibold text-[var(--accent)]"
                            >
                              <MessageCircle size={12} aria-hidden="true" />
                              Recordar
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cards — móvil */}
                <div className="mt-4 flex flex-col gap-2.5 md:hidden">
                  {seguimientoHoy.map((p) => (
                    <div key={p.id} className="relative overflow-hidden rounded-[var(--radius-button)] bg-[var(--surface-2)] p-3.5">
                      <Perforacion tono={p.estado === 'atrasado' ? 'accent' : 'neutro'} />
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/app/clientes/${p.cliente.id}`} className="min-w-0">
                          <p className="truncate text-[13.5px] font-semibold text-[var(--text-primary)]">{p.cliente.nombre}</p>
                          <p className="truncate text-[12px] text-[var(--text-secondary)]">{p.nombre}</p>
                        </Link>
                        <EstadoBadge estado={p.estado} dias={diasAtraso(p)} />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-[12px] text-[var(--text-secondary)]">
                          Vence {new Date(p.fechaPromesa).toLocaleDateString('es', { day: 'numeric', month: 'short' })} · {monto(p.cliente.moneda, p.saldo)}
                        </p>
                        <Link href="/app/recordatorios" className="flex h-8 items-center gap-1 rounded-[var(--radius-button)] bg-[var(--accent)] px-3 text-[11.5px] font-semibold text-[var(--bg)]">
                          <MessageCircle size={11} aria-hidden="true" />
                          Recordar
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.section>

          {/* Cobros del mes — gráfica, Pro+ */}
          <motion.section {...entra(5)} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] md:p-5">
            <div className="flex items-center gap-1.5">
              <h2 className="text-[16px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Cobros del mes</h2>
              <Info size={13} className="text-[var(--text-tertiary)]" aria-hidden="true" />
            </div>
            {capacidades.canUseCharts ? (
              <>
                <p className="mt-3 text-[24px] font-bold tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
                  {monto(monedaPrincipal, cobradoPorMoneda[monedaPrincipal] ?? 0)}
                </p>
                <p className="text-[12px] text-[var(--text-secondary)]">Total cobrado en {monedaPrincipal}</p>
                <div className="mt-3 h-[180px] w-full">
                  {serieMes.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={serieMes} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="cobrosGradiente" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="dia" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} width={44} />
                        <Tooltip
                          formatter={(v) => monto(monedaPrincipal, Number(v))}
                          labelFormatter={(d) => `Día ${d}`}
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-2)', fontSize: 12 }}
                        />
                        <Area type="monotone" dataKey="acumulado" stroke="var(--accent)" strokeWidth={2.5} fill="url(#cobrosGradiente)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-[12.5px] text-[var(--text-tertiary)]">
                      Aparecerá aquí cuando registres pagos este mes.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-3">
                <BloqueoPlan
                  plan="pro"
                  titulo="Desbloquea tus estadísticas"
                  descripcion="Visualiza cómo evolucionan tus cobros mes a mes con una gráfica clara."
                  email={perfil.email}
                />
              </div>
            )}
          </motion.section>
        </div>

        <div className="flex flex-col gap-5">
          {/* Próximos cobros */}
          <motion.section {...entra(4.5)} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] md:p-5">
            <h2 className="text-[16px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Próximos cobros</h2>
            {proximos.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-[var(--text-secondary)]">No tienes cobros por vencer pronto.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                {proximos.slice(0, 4).map((p) => (
                  <Link key={p.id} href={`/app/clientes/${p.cliente.id}`} className="flex items-center gap-2.5">
                    <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--chip-bg)] text-[11.5px] font-bold text-[var(--accent)]">
                      {p.cliente.nombre.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{p.cliente.nombre}</p>
                      <p className="truncate text-[11.5px] text-[var(--text-secondary)]">{p.nombre}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11.5px] text-[var(--text-secondary)]">
                        {new Date(p.fechaPromesa).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-[12.5px] font-bold tabular-nums text-[var(--text-primary)]">{monto(p.cliente.moneda, p.saldo)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/app/cobros" className="mt-4 flex items-center justify-between text-[12.5px] font-semibold text-[var(--accent)]">
              Ver todos los próximos cobros
              <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </motion.section>

          {/* Meta mensual — Premium */}
          {capacidades.canUseGoals && (
            <motion.section {...entra(5)} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] md:p-5">
              <MetaMensual />
            </motion.section>
          )}

          {/* Resumen rápido */}
          <motion.section {...entra(5.5)} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] md:p-5">
            <h2 className="text-[16px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Resumen rápido</h2>
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                  <DollarSign size={14} className="text-[var(--accent)]" aria-hidden="true" />
                  Total cobrado (año)
                </span>
                <span className="text-[13.5px] font-bold tabular-nums text-[var(--text-primary)]">
                  {cCobradoAnio.faltantes.length === 0 ? monto(monedaPrincipal, cCobradoAnio.total) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                  <Clock size={14} className="text-[var(--accent-2)]" aria-hidden="true" />
                  Pendiente por cobrar
                </span>
                <span className="text-[13.5px] font-bold tabular-nums text-[var(--text-primary)]">
                  {cPendiente.faltantes.length === 0 ? monto(monedaPrincipal, cPendiente.total) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                  <AlertTriangle size={14} className="text-[var(--status-error)]" aria-hidden="true" />
                  Clientes atrasados
                </span>
                <span className="text-[13.5px] font-bold tabular-nums text-[var(--text-primary)]">{clientesAtrasados}</span>
              </div>
              {capacidades.canUseExpenses && (
                <div className="flex items-center justify-between border-t border-[color-mix(in_oklab,var(--text-tertiary)_14%,transparent)] pt-3">
                  <Link href="/app/gastos" className="text-[13px] text-[var(--text-secondary)]">
                    Utilidad neta (mes)
                  </Link>
                  <span
                    className="text-[13.5px] font-bold tabular-nums"
                    style={{ color: utilidadNeta >= 0 ? 'var(--status-success)' : 'var(--status-error)' }}
                  >
                    {monto(monedaPrincipal, utilidadNeta)}
                  </span>
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
