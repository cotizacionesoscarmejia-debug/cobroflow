// Skeleton genérico para las pantallas internas que listan datos (Clientes,
// Proyectos, Pagos, Gastos, Estadísticas, Cobros, Recordatorios). Antes estas
// pantallas no revisaban `cargando` y mostraban su estado vacío ("Registra tu
// primer cliente") mientras los datos reales todavía viajaban desde Supabase
// — confuso para alguien que SÍ tiene datos (auditoría, hallazgo importante #4).

export function SkeletonPantalla() {
  return (
    <div className="mx-auto w-full max-w-[480px] animate-pulse px-5 pt-6 pb-10 md:max-w-none md:px-8 md:pb-12">
      <div className="h-7 w-40 rounded-[var(--radius-button)] bg-[var(--surface-2)]" />
      <div className="mt-2 h-4 w-64 max-w-full rounded-[var(--radius-button)] bg-[var(--surface-2)]" />
      <div className="mt-6 flex flex-col gap-3">
        <div className="h-16 rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
        <div className="h-16 rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
        <div className="h-16 rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
      </div>
    </div>
  );
}
