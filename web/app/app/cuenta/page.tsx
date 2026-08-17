'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, ChevronRight, Coins, Check, FileDown, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { hotmartCheckoutUrl } from '@/lib/hotmart-links';
import {
  obtenerPerfilMoneda,
  obtenerPerfil,
  actualizarNombre,
  actualizarNegocio,
  nombreParaMostrar,
  inicialesParaMostrar,
  obtenerDB,
  obtenerTasas,
} from '@/lib/app-data';
import { generarReportePDF, type PeriodoReporte } from '@/lib/pdf-report';

const NOMBRE_PLAN: Record<string, string> = { free: 'Free', pro: 'Pro', premium: 'Premium' };
const PERIODOS: { valor: PeriodoReporte; etiqueta: string }[] = [
  { valor: 'mes', etiqueta: 'Este mes' },
  { valor: 'trimestre', etiqueta: 'Últimos 3 meses' },
  { valor: 'todo', etiqueta: 'Todo el historial' },
];

export default function CuentaPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [plan, setPlan] = useState<'free' | 'pro' | 'premium'>('free');
  const [monedaPrincipal, setMonedaPrincipal] = useState('USD');
  const [perfil, setPerfil] = useState({ email: '', nombre: '', apellido: '', nombreNegocio: '' });
  const [nombreEditado, setNombreEditado] = useState('');
  const [apellidoEditado, setApellidoEditado] = useState('');
  const [negocioEditado, setNegocioEditado] = useState('');
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [nombreGuardado, setNombreGuardado] = useState(false);
  const [periodoReporte, setPeriodoReporte] = useState<PeriodoReporte>('todo');
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [errorPDF, setErrorPDF] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      setUserId(user.id);
      const [perfilMoneda, perfilUsuario] = await Promise.all([obtenerPerfilMoneda(), obtenerPerfil()]);
      setPlan(perfilMoneda.plan);
      setMonedaPrincipal(perfilMoneda.monedaPrincipal);
      setPerfil(perfilUsuario);
      setNombreEditado(perfilUsuario.nombre);
      setApellidoEditado(perfilUsuario.apellido);
      setNegocioEditado(perfilUsuario.nombreNegocio);
    });
  }, [router]);

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  async function guardarNombre() {
    if (!nombreEditado.trim() || !apellidoEditado.trim()) return;
    setGuardandoNombre(true);
    try {
      await Promise.all([
        actualizarNombre(nombreEditado.trim(), apellidoEditado.trim()),
        actualizarNegocio(negocioEditado.trim()),
      ]);
      setPerfil((p) => ({
        ...p,
        nombre: nombreEditado.trim(),
        apellido: apellidoEditado.trim(),
        nombreNegocio: negocioEditado.trim(),
      }));
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
    nombreEditado.trim() !== perfil.nombre.trim() ||
    apellidoEditado.trim() !== perfil.apellido.trim() ||
    negocioEditado.trim() !== perfil.nombreNegocio.trim();

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
          {tieneNombre ? (
            <p className="truncate text-[15px] font-semibold text-[var(--text-primary)]">{nombreCompleto}</p>
          ) : (
            <p className="truncate text-[15px] font-semibold text-[var(--text-tertiary)]">
              {perfil.email ? 'Completa tu nombre abajo' : 'Cargando…'}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Información personal</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
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
          <p className="h-11 flex items-center rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[14px] text-[var(--text-tertiary)]">
            {perfil.email || 'Cargando…'}
          </p>
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

      <div className="mt-4 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
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
      </div>

      <div className="mt-4 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--chip-bg)]"
          >
            <FileDown size={18} color="var(--accent)" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Reporte financiero en PDF</p>
            <p className="truncate text-[12px] text-[var(--text-secondary)]">
              {plan === 'premium' ? 'Con tus datos reales, listo para descargar' : 'Función de Premium'}
            </p>
          </div>
        </div>

        {plan === 'premium' ? (
          <>
            <div className="mt-4 flex gap-2">
              {PERIODOS.map((p) => (
                <button
                  key={p.valor}
                  type="button"
                  onClick={() => setPeriodoReporte(p.valor)}
                  className={`flex h-9 flex-1 items-center justify-center rounded-[var(--radius-button)] px-2 text-[12px] font-medium transition-colors duration-150 ${
                    periodoReporte === p.valor
                      ? 'bg-[var(--accent)] text-[var(--bg)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
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
            href={hotmartCheckoutUrl('premium', { email: perfil.email, userId })}
            className="mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] text-[13px] font-semibold text-[var(--accent)]"
          >
            <Lock size={14} aria-hidden="true" />
            Desbloquear con Premium
          </a>
        )}
      </div>

      <Link
        href="/app/cuenta/monedas"
        className="mt-4 flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]"
      >
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--chip-bg)]"
        >
          <Coins size={18} color="var(--accent)" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">Moneda y tipo de cambio</p>
          <p className="truncate text-[12px] text-[var(--text-secondary)]">Moneda principal: {monedaPrincipal}</p>
        </div>
        <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
      </Link>

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
