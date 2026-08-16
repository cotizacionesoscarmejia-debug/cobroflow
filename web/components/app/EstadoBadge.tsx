import type { EstadoCobro } from '@/lib/app-data';

const ESTILO: Record<EstadoCobro, { bg: string; fg: string; label: (dias?: number) => string }> = {
  pagado: { bg: 'var(--status-success-soft)', fg: 'var(--status-success)', label: () => 'Pagado' },
  atrasado: {
    bg: 'var(--status-error-soft)',
    fg: 'var(--status-error)',
    label: (dias) => (dias && dias > 0 ? `Atrasado ${dias}d` : 'Atrasado'),
  },
  vence_hoy: { bg: 'var(--status-warning-soft)', fg: 'var(--status-warning)', label: () => 'Vence hoy' },
  proximo: { bg: 'var(--status-warning-soft)', fg: 'var(--status-warning)', label: () => 'Próximo' },
  al_dia: {
    bg: 'color-mix(in oklab, var(--text-tertiary) 12%, transparent)',
    fg: 'var(--text-secondary)',
    label: () => 'Al día',
  },
};

export function EstadoBadge({ estado, dias }: { estado: EstadoCobro; dias?: number }) {
  const s = ESTILO[estado];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: s.fg }} />
      {s.label(dias)}
    </span>
  );
}
