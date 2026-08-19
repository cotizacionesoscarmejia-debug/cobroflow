'use client';

// Shell de la app interna (rediseño integral, Sesión 6): sidebar verde oscuro
// persistente en escritorio/tablet (≥768px), barra superior con saludo +
// buscador real + accesos rápidos, y navegación inferior en móvil (5 accesos
// + hoja "Más" con el resto). Referencia visual: la imagen que dio el usuario
// del nuevo Panel Principal. Envuelve TODA /app/* con <AppDataProvider> para
// que ninguna pantalla vuelva a pedir los mismos datos por su cuenta.

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Wallet,
  Users,
  Briefcase,
  Receipt,
  TrendingDown,
  BarChart3,
  Bell,
  Settings,
  Search,
  X,
  MoreHorizontal,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { AppDataProvider, useAppData } from './AppDataProvider';
import { RecorridoGuiado } from './RecorridoGuiado';
import { NOMBRE_PLAN } from '@/lib/planes';
import { proyectosConDatos, buscarEnDB, nombreParaMostrar, inicialesParaMostrar } from '@/lib/app-data';

const SECCIONES = [
  { href: '/app', label: 'Panel principal', icon: LayoutGrid },
  { href: '/app/cobros', label: 'Centro de cobros', icon: Wallet },
  { href: '/app/clientes', label: 'Clientes', icon: Users },
  { href: '/app/proyectos', label: 'Proyectos', icon: Briefcase },
  { href: '/app/pagos', label: 'Pagos', icon: Receipt },
  { href: '/app/gastos', label: 'Gastos', icon: TrendingDown },
  { href: '/app/estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { href: '/app/recordatorios', label: 'Recordatorios', icon: Bell },
  { href: '/app/cuenta', label: 'Configuración', icon: Settings },
] as const;

// Navegación inferior en móvil: 5 accesos prioritarios + "Más" con el resto.
const MOBILE_PRINCIPAL = [
  { href: '/app', label: 'Inicio', icon: LayoutGrid },
  { href: '/app/cobros', label: 'Cobros', icon: Wallet },
  { href: '/app/clientes', label: 'Clientes', icon: Users },
  { href: '/app/pagos', label: 'Pagos', icon: Receipt },
] as const;
const MOBILE_MAS = [
  { href: '/app/proyectos', label: 'Proyectos', icon: Briefcase },
  { href: '/app/gastos', label: 'Gastos', icon: TrendingDown },
  { href: '/app/estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { href: '/app/recordatorios', label: 'Recordatorios', icon: Bell },
  { href: '/app/cuenta', label: 'Configuración', icon: Settings },
] as const;

function activo(pathname: string, href: string): boolean {
  return href === '/app' ? pathname === '/app' : pathname.startsWith(href);
}

function Marca() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-button)]"
        style={{ backgroundColor: 'var(--sidebar-bg-active)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 12a8 8 0 0 1 13.66-5.66M20 12a8 8 0 0 1-13.66 5.66"
            stroke="var(--sidebar-text)"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <path d="M17.5 4v3h-3M6.5 20v-3h3" stroke="var(--sidebar-text)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-[18px] font-bold text-[var(--sidebar-text)] [font-family:var(--font-display)]">CobroFlow</span>
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const { plan, perfil } = useAppData();
  const iniciales = inicialesParaMostrar(perfil);
  const nombre = nombreParaMostrar(perfil) || 'Tu cuenta';

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col justify-between px-4 py-6 md:flex"
      style={{ backgroundColor: 'var(--sidebar-bg)' }}
    >
      <div>
        <Marca />
        <nav aria-label="Navegación principal" className="mt-8 flex flex-col gap-1">
          {SECCIONES.map(({ href, label, icon: Icono }) => {
            const esActivo = activo(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-[var(--radius-button)] px-3 py-2.5 text-[14px] font-medium transition-colors duration-150"
                style={{
                  backgroundColor: esActivo ? 'var(--sidebar-bg-active)' : 'transparent',
                  color: esActivo ? 'var(--sidebar-text)' : 'var(--sidebar-text-muted)',
                }}
              >
                <Icono size={18} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Link
        href="/app/cuenta"
        className="flex items-center gap-3 rounded-[var(--radius-button)] px-3 py-2.5 transition-colors duration-150"
        style={{ backgroundColor: 'var(--sidebar-bg-hover)' }}
      >
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
          style={{ backgroundColor: 'var(--sidebar-bg-active)', color: 'var(--sidebar-text)' }}
        >
          {iniciales}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold" style={{ color: 'var(--sidebar-text)' }}>
            {nombre}
          </p>
          <p className="truncate text-[11.5px]" style={{ color: 'var(--sidebar-text-muted)' }}>
            Plan {NOMBRE_PLAN[plan]}
          </p>
        </div>
        <ChevronRight size={15} style={{ color: 'var(--sidebar-text-muted)' }} aria-hidden="true" />
      </Link>
    </aside>
  );
}

function Buscador() {
  const { db } = useAppData();
  const router = useRouter();
  const [termino, setTermino] = useState('');
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const resultados = useMemo(() => buscarEnDB(db, termino), [db, termino]);

  useEffect(() => {
    function alHacerClicFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', alHacerClicFuera);
    return () => document.removeEventListener('mousedown', alHacerClicFuera);
  }, []);

  function ir(clienteId: string) {
    setAbierto(false);
    setTermino('');
    router.push(`/app/clientes/${clienteId}`);
  }

  return (
    <div ref={contenedorRef} className="relative w-full max-w-[420px]">
      <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
      <input
        value={termino}
        onChange={(e) => {
          setTermino(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        placeholder="Buscar clientes, proyectos o pagos…"
        className="h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] pl-10 pr-9 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
      />
      {termino && (
        <button
          type="button"
          onClick={() => setTermino('')}
          aria-label="Limpiar búsqueda"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
        >
          <X size={15} aria-hidden="true" />
        </button>
      )}

      {abierto && termino.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-[360px] overflow-y-auto rounded-[var(--radius-card)] bg-[var(--surface)] p-2 shadow-[var(--shadow-2)]">
          {resultados.length === 0 ? (
            <p className="p-3 text-[13px] text-[var(--text-tertiary)]">Sin resultados para &quot;{termino}&quot;.</p>
          ) : (
            resultados.map((r, i) => (
              <button
                key={`${r.tipo}-${r.clienteId}-${i}`}
                type="button"
                onClick={() => ir(r.clienteId)}
                className="flex w-full flex-col items-start rounded-[var(--radius-button)] px-3 py-2 text-left hover:bg-[var(--surface-2)]"
              >
                <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">{r.titulo}</span>
                <span className="text-[12px] text-[var(--text-tertiary)]">{r.subtitulo}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Topbar() {
  const { db, perfil } = useAppData();
  const router = useRouter();
  const nombre = nombreParaMostrar(perfil);
  const iniciales = inicialesParaMostrar(perfil);
  const atrasados = useMemo(() => proyectosConDatos(db).filter((p) => p.estado === 'atrasado').length, [db]);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Hola' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <header className="sticky top-0 z-20 hidden items-center justify-between gap-6 border-b border-[color-mix(in_oklab,var(--text-tertiary)_14%,transparent)] bg-[var(--bg)] px-8 py-5 md:flex">
      <div className="min-w-0">
        <h1 className="truncate text-[20px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
          {saludo}{nombre ? `, ${nombre.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-[13px] text-[var(--text-secondary)]">Aquí tienes el resumen de tu gestión de cobros.</p>
      </div>

      <Buscador />

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => router.push('/app/cobros')}
          aria-label="Próximos cobros"
          className="flex size-10 items-center justify-center rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_22%,transparent)] text-[var(--text-secondary)]"
        >
          <CalendarDays size={17} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => router.push('/app/cobros')}
          aria-label={`${atrasados} clientes atrasados`}
          className="relative flex size-10 items-center justify-center rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_22%,transparent)] text-[var(--text-secondary)]"
        >
          <Bell size={17} aria-hidden="true" />
          {atrasados > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[var(--status-error)] text-[9px] font-bold text-white">
              {atrasados > 9 ? '9+' : atrasados}
            </span>
          )}
        </button>
        <Link
          href="/app/cuenta"
          aria-label="Mi cuenta"
          className="flex size-10 items-center justify-center rounded-full bg-[var(--chip-bg)] text-[13px] font-bold text-[var(--accent)]"
        >
          {iniciales}
        </Link>
      </div>
    </header>
  );
}

function NavInferior() {
  const pathname = usePathname();
  const [masAbierto, setMasAbierto] = useState(false);
  const masActivo = MOBILE_MAS.some((s) => activo(pathname, s.href));

  return (
    <>
      {masAbierto && (
        <div className="fixed inset-0 z-40 flex items-end bg-[color-mix(in_oklab,black_45%,transparent)] md:hidden" onClick={() => setMasAbierto(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-[var(--radius-card)] bg-[var(--surface)] p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[var(--shadow-2)]"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--surface-2)]" />
            <div className="grid grid-cols-2 gap-2">
              {MOBILE_MAS.map(({ href, label, icon: Icono }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMasAbierto(false)}
                  className="flex items-center gap-2.5 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-4 py-3.5 text-[14px] font-semibold text-[var(--text-primary)]"
                >
                  <Icono size={18} color="var(--accent)" aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] pb-[max(8px,env(safe-area-inset-bottom))] pt-2 md:hidden"
      >
        <div className="mx-auto flex w-full max-w-[520px] justify-around">
          {MOBILE_PRINCIPAL.map(({ href, label, icon: Icono }) => {
            const esActivo = activo(pathname, href);
            return (
              <Link key={href} href={href} className="flex min-w-[60px] flex-col items-center gap-1 px-2 py-1.5">
                <Icono size={22} strokeWidth={esActivo ? 2.4 : 1.8} color={esActivo ? 'var(--accent)' : 'var(--text-tertiary)'} aria-hidden="true" />
                <span className="text-[11px] font-medium" style={{ color: esActivo ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                  {label}
                </span>
              </Link>
            );
          })}
          <button type="button" onClick={() => setMasAbierto(true)} className="flex min-w-[60px] flex-col items-center gap-1 px-2 py-1.5">
            <MoreHorizontal size={22} strokeWidth={masActivo ? 2.4 : 1.8} color={masActivo ? 'var(--accent)' : 'var(--text-tertiary)'} aria-hidden="true" />
            <span className="text-[11px] font-medium" style={{ color: masActivo ? 'var(--accent)' : 'var(--text-tertiary)' }}>
              Más
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}

function ShellInterno({ children }: { children: React.ReactNode }) {
  const { cargando } = useAppData();
  return (
    <div className="min-h-dvh bg-[var(--bg)] [font-family:var(--font-body)]">
      <Sidebar />
      <div className="pb-24 md:ml-[260px] md:pb-10">
        <Topbar />
        {!cargando && <RecorridoGuiado />}
        {children}
      </div>
      <NavInferior />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppDataProvider>
      <ShellInterno>{children}</ShellInterno>
    </AppDataProvider>
  );
}
