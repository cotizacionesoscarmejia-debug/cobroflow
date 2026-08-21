'use client';

// Editar cliente (preauditoría, P1) — mismo patrón visual que Nuevo cliente,
// sin los campos de "primer proyecto" (eso vive en Nuevo proyecto/editar proyecto).

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { CtaFunnel } from '@/components/onboarding/ui';
import { useAppData } from '@/components/app/AppDataProvider';
import { actualizarCliente } from '@/lib/app-data';
import { MONEDAS } from '@/lib/onboarding';

export default function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { db, cargando, recargar } = useAppData();
  const cliente = db.clientes.find((c) => c.id === id);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [moneda, setMoneda] = useState('USD');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (cliente) {
      setNombre(cliente.nombre);
      setTelefono(cliente.telefono ?? '');
      setMoneda(cliente.moneda);
    }
  }, [cliente]);

  if (cargando) return null;
  if (!cliente) {
    return (
      <div className="mx-auto w-full max-w-[480px] px-5 pt-6 text-center">
        <p className="text-[15px] text-[var(--text-secondary)]">No encontramos este cliente.</p>
        <button onClick={() => router.push('/app/clientes')} className="mt-3 text-[14px] font-semibold text-[var(--accent)]">
          Volver a Clientes
        </button>
      </div>
    );
  }

  async function enviar() {
    if (nombre.trim().length === 0) {
      setError('Escribe el nombre de tu cliente.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await actualizarCliente(id, { nombre, telefono, moneda });
      await recargar();
      router.push(`/app/clientes/${id}`);
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
        Editar cliente
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Nombre del cliente</span>
            <input
              type="text"
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Clínica Nova"
              className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Teléfono (opcional)</span>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej. 5512-3456"
              className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Moneda de este cliente</span>
            <div className="relative">
              <select
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
                className="h-14 w-full appearance-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 pr-11 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
              >
                {MONEDAS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
                aria-hidden="true"
              />
            </div>
            <span className="text-[12px] text-[var(--text-tertiary)]">
              Cambiar la moneda no convierte los montos ya cargados — solo cambia cómo se muestran.
            </span>
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
