'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LogOut,
  ChevronRight,
  Coins,
  Check,
  FileDown,
  Lock,
  Sparkles,
  AlertTriangle,
  ListChecks,
  ArrowRight,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { hotmartCheckoutUrl, HOTMART_AREA_COMPRAS_URL } from '@/lib/hotmart-links';
import { useAppData } from '@/components/app/AppDataProvider';
import { actualizarNombre, actualizarNegocio, nombreParaMostrar, inicialesParaMostrar, obtenerDB, obtenerTasas } from '@/lib/app-data';
import { generarReportePDF, type PeriodoReporte } from '@/lib/pdf-report';
import { generarAnalisisPDF } from '@/lib/pdf-analisis';
import { capacidadesDe, NOMBRE_PLAN, planQueDesbloquea } from '@/lib/planes';

interface Analisis {
  resumen: string;
  positivos: string[];
  alertas: string[];
  recomendaciones: string[];
  proximos_pasos: string[];
}

const PERIODOS: { valor: PeriodoReporte; etiqueta: string }[] = [
  { valor: 'mes', etiqueta: 'Este mes' },
  { valor: 'trimestre', etiqueta: 'Últimos 3 meses' },
  { valor: 'todo', etiqueta: 'Todo el historial' },
];

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mt-7 first:mt-6">
      <h2 className="px-1 text-[12px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{titulo}</h2>
      <div className="mt-2 flex flex-col gap-3">{children}</div>
    </div>
  );
}

export default function CuentaPage() {
  const router = useRouter();
  const { plan, monedaPrincipal, perfil, userId, recargar, reabrirTour } = useAppData();
  const capacidades = capacidadesDe(plan);

  const [nombreEditado, setNombreEditado] = useState('');
  const [apellidoEditado, setApellidoEditado] = useState('');
  const [negocioEditado, setNegocioEditado] = useState('');
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [nombreGuardado, setNombreGuardado] = useState(false);
  const [periodoReporte, setPeriodoReporte] = useState<PeriodoReporte>('todo');
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [errorPDF, setErrorPDF] = useState<string | null>(null);
  const [analisis, setAnalisis] = useState<Analisis | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [errorAnalisis, setErrorAnalisis] = useState<string | null>(null);
  const [usadosEsteMes, setUsadosEsteMes] = useState(0);
  const [limiteMes, setLimiteMes] = useState(10);
  const [cargandoAnalisis, setCargandoAnalisis] = useState(false);
  const [analisisFecha, setAnalisisFecha] = useState<string>('');
  const [sincronizado, setSincronizado] = useState(false);

  useEffect(() => {
    if (!perfil.email) return;
    setNombreEditado(perfil.nombre);
    setApellidoEditado(perfil.apellido);
    setNegocioEditado(perfil.nombreNegocio);
  }, [perfil]);

  useEffect(() => {
    if (sincronizado || plan !== 'premium') return;
    setSincronizado(true);
    setCargandoAnalisis(true);
    fetch('/api/ai/analizar-negocio')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.ultimo) {
          setAnalisis({
            resumen: data.ultimo.resumen,
            positivos: data.ultimo.positivos ?? [],
            alertas: data.ultimo.alertas ?? [],
            recomendaciones: data.ultimo.recomendaciones ?? [],
            proximos_pasos: data.ultimo.proximos_pasos ?? [],
          });
          setAnalisisFecha(data.ultimo.created_at ?? '');
        }
        setUsadosEsteMes(data.usadosEsteMes ?? 0);
        setLimiteMes(data.limiteMes ?? 10);
      })
      .finally(() => setCargandoAnalisis(false));
  }, [plan, sincronizado]);

  async function analizarNegocio() {
    setAnalizando(true);
    setErrorAnalisis(null);
    try {
      const res = await fetch('/api/ai/analizar-negocio', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'limite_mensual_alcanzado') {
          setErrorAnalisis(`Llegaste al límite de ${data.limiteMes} análisis este mes. Vuelve el próximo mes.`);
        } else if (data.error === 'sin_datos') {
          setErrorAnalisis('Agrega al menos un cliente antes de analizar tu negocio.');
        } else if (data.error === 'servicio_no_configurado') {
          setErrorAnalisis('El análisis con IA todavía no está disponible. Intenta más tarde.');
        } else {
          setErrorAnalisis('No pudimos generar el análisis. Intenta de nuevo.');
        }
        return;
      }
      setAnalisis(data.analisis);
      setAnalisisFecha(new Date().toISOString());
      setUsadosEsteMes(data.usadosEsteMes ?? usadosEsteMes + 1);
    } catch {
      setErrorAnalisis('No pudimos generar el análisis. Intenta de nuevo.');
    } finally {
      setAnalizando(false);
    }
  }

  function exportarAnalisisPDF() {
    if (!analisis) return;
    generarAnalisisPDF(analisis, perfil, analisisFecha ? new Date(analisisFecha) : new Date());
  }

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  async function guardarNombre() {
    if (!nombreEditado.trim() || !apellidoEditado.trim()) return;
    setGuardandoNombre(true);
    try {
      await Promise.all([actualizarNombre(nombreEditado.trim(), apellidoEditado.trim()), actualizarNegocio(negocioEditado.trim())]);
      await recargar();
      setNombreGuardado(true);
      setTimeout(() => setNombreGuardado(false), 2000);
    } finally {
      setGuardandoNombre(false);
    }
  }

  async function descargarReporte() {
    setGenerandoPDF(true);
    setErrorPDF(null);
    try {
      const [db, tasas] = await Promise.all([obtenerDB(), obtenerTasas()]);
      generarReportePDF({ db, perfil, monedaPrincipal, tasas, periodo: periodoReporte });
    } catch {
      setErrorPDF('No pudimos generar el reporte. Intenta de nuevo.');
    } finally {
      setGenerandoPDF(false);
    }
  }

  const iniciales = inicialesParaMostrar(perfil);
  const nombreCompleto = nombreParaMostrar(perfil);
  const tieneNombre = Boolean(perfil.nombre && perfil.apellido);
  const cambioSinGuardar =
    nombreEditado.trim() !== perfil.nombre.trim() || apellidoEditado.trim() !== perfil.apellido.trim() || negocioEditado.trim() !== perfil.nombreNegocio.trim();

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10 md:max-w-[640px] md:px-8">
      <h1 className="text-[22px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)] md:text-[24px]">Configuración</h1>

      <div className="mt-6 flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
        <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-[var(--chip-bg)] text-[15px] font-bold text-[var(--accent)]">
          {iniciales}
        </span>
        <div className="min-w-0">
          {tieneNombre ? (
            <p className="truncate text-[15px] font-semibold text-[var(--text-primary)]">{nombreCompleto}</p>
          ) : (
            <p className="truncate text-[15px] font-semibold text-[var(--text-tertiary)]">{perfil.email ? 'Completa tu nombre abajo' : 'Cargando…'}</p>
          )}
          <p className="truncate text-[12px] text-[var(--text-tertiary)]">{perfil.email}</p>
        </div>
      </div>

      <Seccion titulo="Perfil">
        <div className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-[var(--text-secondary)]">Nombre</span>
              <input
                type="text"
                value={nombreEditado}
                onChange={(e) => setNombreEditado(e.target.value)}
                placeholder="Ana"
                className="h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--bg)] px-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-[var(--text-secondary)]">Apellido</span>
              <input
                type="text"
                value={apellidoEditado}
                onChange={(e) => setApellidoEditado(e.target.value)}
                placeholder="López"
                className="h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--bg)] px-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
              />
            </label>
          </div>
          <label className="mt-3 flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">Nombre de tu negocio (opcional)</span>
            <input
              type="text"
              value={negocioEditado}
              onChange={(e) => setNegocioEditado(e.target.value)}
              placeholder="Ej. Estudio Nova"
              className="h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--bg)] px-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
          </label>
          <label className="mt-3 flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">Correo electrónico</span>
            <p className="flex h-11 items-center rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[14px] text-[var(--text-tertiary)]">{perfil.email || 'Cargando…'}</p>
          </label>
          {cambioSinGuardar && (
            <button
              type="button"
              onClick={guardarNombre}
              disabled={guardandoNombre || !nombreEditado.trim() || !apellidoEditado.trim()}
              className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--accent)] text-[13px] font-semibold text-[var(--bg)] disabled:opacity-40"
            >
              {guardandoNombre ? 'Guardando…' : 'Guardar'}
            </button>
          )}
          {nombreGuardado && (
            <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-[var(--status-success)]">
              <Check size={13} strokeWidth={3} aria-hidden="true" />
              Guardado
            </p>
          )}
        </div>
      </Seccion>

      <Seccion titulo="Preferencias">
        <Link href="/app/cuenta/monedas" className="flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--chip-bg)]">
            <Coins size={18} color="var(--accent)" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Moneda y tipo de cambio</p>
            <p className="truncate text-[12px] text-[var(--text-secondary)]">Moneda principal: {monedaPrincipal}</p>
          </div>
          <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
        </Link>
      </Seccion>

      <Seccion titulo="Plan">
        <div className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[var(--text-secondary)]">Tu plan</p>
              <p className="text-[16px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">{NOMBRE_PLAN[plan]}</p>
            </div>
            {plan === 'premium' && <span className="text-[12px] font-semibold text-[var(--accent)]">Ya tienes todo</span>}
          </div>
          {plan !== 'premium' && (
            <div className="mt-4 flex flex-col gap-2">
              {plan === 'free' && (
                <a
                  href={hotmartCheckoutUrl('pro', { email: perfil.email, userId })}
                  className="flex h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-[var(--bg)]"
                >
                  Pasar a Pro — $7.99/mes
                </a>
              )}
              <a
                href={hotmartCheckoutUrl('premium', { email: perfil.email, userId })}
                className="flex h-11 items-center justify-center rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] px-4 text-[13px] font-semibold text-[var(--accent)]"
              >
                Pasar a Premium — $14.99/mes
              </a>
            </div>
          )}
          {plan !== 'free' && (
            <a
              href={HOTMART_AREA_COMPRAS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--surface-2)] px-4 text-[13px] font-semibold text-[var(--text-primary)]"
            >
              Gestionar o cancelar tu suscripción
            </a>
          )}
        </div>
        {plan !== 'free' && (
          <p className="mt-2 text-[11.5px] text-[var(--text-tertiary)]">
            Tu pago lo procesa Hotmart — ahí mismo cambias tu tarjeta o cancelas cuando quieras, con el correo que usaste al comprar.
          </p>
        )}
      </Seccion>

      <Seccion titulo="Reportes y análisis">
        <div className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--chip-bg)]">
              <FileDown size={18} color="var(--accent)" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">Reporte financiero en PDF</p>
              <p className="truncate text-[12px] text-[var(--text-secondary)]">{capacidades.canExportPDF ? 'Con tus datos reales, listo para descargar' : 'Función de Pro'}</p>
            </div>
          </div>

          {capacidades.canExportPDF ? (
            <>
              <div className="mt-4 flex gap-2">
                {PERIODOS.map((p) => (
                  <button
                    key={p.valor}
                    type="button"
                    onClick={() => setPeriodoReporte(p.valor)}
                    className={`flex h-9 flex-1 items-center justify-center rounded-[var(--radius-button)] px-2 text-[12px] font-medium transition-colors duration-150 ${
                      periodoReporte === p.valor ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {p.etiqueta}
                  </button>
                ))}
              </div>
              {errorPDF && <p className="mt-3 text-[12px] font-medium text-[var(--status-error)]">{errorPDF}</p>}
              <button
                type="button"
                onClick={descargarReporte}
                disabled={generandoPDF}
                className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--accent)] text-[13px] font-semibold text-[var(--bg)] disabled:opacity-40"
              >
                <FileDown size={15} aria-hidden="true" />
                {generandoPDF ? 'Generando…' : 'Descargar reporte PDF'}
              </button>
            </>
          ) : (
            <a
              href={hotmartCheckoutUrl(planQueDesbloquea('canExportPDF'), { email: perfil.email, userId })}
              className="mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] text-[13px] font-semibold text-[var(--accent)]"
            >
              <Lock size={14} aria-hidden="true" />
              Desbloquear con Pro
            </a>
          )}
        </div>

        <div className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--chip-bg)]">
              <Sparkles size={18} color="var(--accent)" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">Análisis de tu negocio con IA</p>
              <p className="truncate text-[12px] text-[var(--text-secondary)]">{capacidades.canUseAI ? 'Un vistazo interpretado de cómo va tu negocio' : 'Función de Premium'}</p>
            </div>
          </div>

          {capacidades.canUseAI ? (
            <>
              {cargandoAnalisis && <p className="mt-4 text-[13px] text-[var(--text-tertiary)]">Cargando…</p>}

              {!cargandoAnalisis && analisis && (
                <div className="mt-4 flex flex-col gap-4">
                  <p className="text-[13px] leading-relaxed text-[var(--text-primary)]">{analisis.resumen}</p>

                  {analisis.positivos.length > 0 && (
                    <div>
                      <p className="text-[12px] font-semibold text-[var(--status-success)]">Lo que va bien</p>
                      <ul className="mt-1.5 flex flex-col gap-1">
                        {analisis.positivos.map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[13px] text-[var(--text-primary)]">
                            <Check size={14} strokeWidth={3} className="mt-0.5 shrink-0 text-[var(--status-success)]" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analisis.alertas.length > 0 && (
                    <div>
                      <p className="text-[12px] font-semibold text-[var(--status-error)]">Alertas</p>
                      <ul className="mt-1.5 flex flex-col gap-1">
                        {analisis.alertas.map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[13px] text-[var(--text-primary)]">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[var(--status-error)]" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analisis.recomendaciones.length > 0 && (
                    <div>
                      <p className="text-[12px] font-semibold text-[var(--text-secondary)]">Recomendaciones</p>
                      <ul className="mt-1.5 flex flex-col gap-1">
                        {analisis.recomendaciones.map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[13px] text-[var(--text-primary)]">
                            <ListChecks size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analisis.proximos_pasos.length > 0 && (
                    <div>
                      <p className="text-[12px] font-semibold text-[var(--text-secondary)]">Próximos pasos</p>
                      <ul className="mt-1.5 flex flex-col gap-1">
                        {analisis.proximos_pasos.map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[13px] text-[var(--text-primary)]">
                            <ArrowRight size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <p className="mt-4 text-[11px] text-[var(--text-tertiary)]">
                {usadosEsteMes} de {limiteMes} análisis usados este mes
              </p>
              {errorAnalisis && <p className="mt-2 text-[12px] font-medium text-[var(--status-error)]">{errorAnalisis}</p>}
              <div className="mt-3 flex gap-2">
                {analisis && (
                  <button
                    type="button"
                    onClick={exportarAnalisisPDF}
                    className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] text-[13px] font-semibold text-[var(--accent)]"
                  >
                    <FileDown size={15} aria-hidden="true" />
                    Exportar a PDF
                  </button>
                )}
                <button
                  type="button"
                  onClick={analizarNegocio}
                  disabled={analizando || cargandoAnalisis || usadosEsteMes >= limiteMes}
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--accent)] text-[13px] font-semibold text-[var(--bg)] disabled:opacity-40"
                >
                  <Sparkles size={15} aria-hidden="true" />
                  {analizando ? 'Analizando…' : analisis ? 'Analizar de nuevo' : 'Analizar mi negocio'}
                </button>
              </div>
            </>
          ) : (
            <a
              href={hotmartCheckoutUrl('premium', { email: perfil.email, userId })}
              className="mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] text-[13px] font-semibold text-[var(--accent)]"
            >
              <Lock size={14} aria-hidden="true" />
              Desbloquear con Premium
            </a>
          )}
        </div>
      </Seccion>

      <Seccion titulo="Ayuda y aprendizaje">
        <button
          type="button"
          onClick={reabrirTour}
          className="flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-1)]"
        >
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--chip-bg)]">
            <RotateCcw size={18} color="var(--accent)" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Volver a ver el recorrido</p>
            <p className="truncate text-[12px] text-[var(--text-secondary)]">Un repaso breve de cómo funciona CobroFlow</p>
          </div>
          <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
        </button>
        <a
          href="mailto:soporte@cobroflow.app"
          className="flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]"
        >
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--chip-bg)]">
            <HelpCircle size={18} color="var(--accent)" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Contactar soporte</p>
            <p className="truncate text-[12px] text-[var(--text-secondary)]">soporte@cobroflow.app</p>
          </div>
          <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
        </a>
      </Seccion>

      <Seccion titulo="Cuenta">
        <button
          type="button"
          onClick={cerrarSesion}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] text-[14px] font-semibold text-[var(--text-primary)] shadow-[var(--shadow-1)]"
        >
          <LogOut size={16} aria-hidden="true" />
          Cerrar sesión
        </button>
      </Seccion>
    </div>
  );
}
