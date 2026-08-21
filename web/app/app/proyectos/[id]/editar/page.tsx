'use client';

// Editar proyecto (preauditoría, P1) — mismo patrón visual que Nuevo proyecto.
// El precio total no puede bajar de lo que ya se cobró (evita un saldo
// negativo sin sentido) — misma lógica de validación que ya usa el resto de
// los formularios de dinero de la app.

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { CtaFunnel } from '@/components/onboarding/ui';
import { useAppData } from '@/components/app/AppDataProvider';
import { actualizarProyecto, proyectosConDatos } from '@/lib/app-data';
import { simboloMoneda } from '@/lib/onboarding';

export default function EditarProyectoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { db, cargando, recargar } = useAppData();

  const proyecto = useMemo(() => proyectosConDatos(db).find((p) => p.id === id), [db, id]);

  const [nombre, setNombre] = useState('');
  const [total, setTotal] = useState('');
  const [fecha, setFecha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (proyecto) {
      setNombre(proyecto.nombre);
      setTotal(String(proyecto.precioTotal));
      setFecha(proyecto.fechaPromesa);
    }
  }, [proyecto]);

  if (cargando) return null;
  if (!proyecto) {
    return (
      <div className="mx-auto w-full max-w-[480px] px-5 pt-6 text-center">
        <p className="text-[15px] text-[var(--text-secondary)]">No encontramos este proyecto.</p>
        <button onClick={() => router.push('/app/proyectos')} className="mt-3 text-[14px] font-semibold text-[var(--accent)]">
          Volver a Proyectos
        </button>
      </div>
    );
  }

  async function enviar() {
    if (!proyecto) return;
    const totalNum = Number(total.replace(',', '.')) || 0;
    if (totalNum <= 0) {
      setError('Escribe el precio total acordado.');
      return;
    }
    if (totalNum < proyecto.pagado) {
      setError(
        `No puede ser menor que lo que ya cobraste (${proyecto.cliente.moneda} ${simboloMoneda(proyecto.cliente.moneda)}${proyecto.pagado.toLocaleString('es')}).`
      );
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await actualizarProyecto(id, { nombre, precioTotal: totalNum, fechaPromesa: fecha });
      await recargar();
      router.push(`/app/clientes/${proyecto.cliente.id}`);
    } catch {
      setError('No pudimos guardar los cambios. Intenta de nuevo.');
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Atrás"
        className="flex size-11 items-center justify-center rounded-full text-[var(--text-secondary)]"
      >
        <ChevronLeft size={22} aria-hidden="true" />
      </button>

      <h1 className="mt-4 text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
        Editar proyecto
      </h1>
      <p className="mt-1 text-[14px] text-[var(--text-secondary)]">{proyecto.cliente.nombre}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Nombre del proyecto</span>
            <input
              type="text"
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Rediseño de marca"
              className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Precio total ({proyecto.cliente.moneda})</span>
            <input
              type="text"
              inputMode="decimal"
              value={total}
              onChange={(e) => setTotal(e.target.value.replace(/[^0-9.,]/g, ''))}
              placeholder="900"
              className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
            {proyecto.pagado > 0 && (
              <span className="text-[12px] text-[var(--text-tertiary)]">
                Ya cobraste {proyecto.cliente.moneda} {simboloMoneda(proyecto.cliente.moneda)}
                {proyecto.pagado.toLocaleString('es')} de este proyecto.
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Fecha en la que debería pagar el resto</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 text-[15px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-[13px] font-medium text-[var(--status-error)]">
            {error}
          </p>
        )}

        <div className="mt-8">
          <CtaFunnel type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </CtaFunnel>
        </div>
      </form>
    </div>
  );
}
