'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, Wallet, User } from 'lucide-react';

const DESTINOS = [
  { href: '/app', label: 'Inicio', icon: LayoutGrid },
  { href: '/app/clientes', label: 'Clientes', icon: Users },
  { href: '/app/cobros', label: 'Cobros', icon: Wallet },
  { href: '/app/cuenta', label: 'Cuenta', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] pb-[max(8px,env(safe-area-inset-bottom))] pt-2"
    >
      <div className="mx-auto flex w-full max-w-[480px] justify-around">
        {DESTINOS.map(({ href, label, icon: Icono }) => {
          const activo = href === '/app' ? pathname === '/app' : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex min-w-[64px] flex-col items-center gap-1 px-2 py-1.5"
            >
              <Icono
                size={22}
                strokeWidth={activo ? 2.4 : 1.8}
                color={activo ? 'var(--accent)' : 'var(--text-tertiary)'}
                aria-hidden="true"
              />
              <span
                className="text-[11px] font-medium"
                style={{ color: activo ? 'var(--accent)' : 'var(--text-tertiary)' }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
