'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { CtaFunnel } from '@/components/onboarding/ui';
import { useAppData } from '@/components/app/AppDataProvider';
import { agregarProyecto } from '@/lib/app-data';
import { simboloMoneda } from '@/lib/onboarding';

function hoyISO(offsetDias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return d.toISOString().slice(0, 10);
}

export default function NuevoProyectoPage() {
  const router = useRouter();
  const { db, recargar } = useAppData();
  const [clienteId, setClienteId] = useState(db.clientes[0]?.id ?? '');
  const [nombre, setNombre] = useState('');
  const [total, setTotal] = useState('');
  const [anticipo, setAnticipo] = useState('');
  const [fecha, setFecha] = useState(hoyISO(14));
  const [error, setError] = useState<string | null>(null);
  const [requierePro, setRequierePro] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cliente = db.clientes.find((c) => c.id === clienteId);

  async function enviar() {
    if (!clienteId) {
      setError('Elige a qué cliente pertenece este proyecto.');
      return;
    }
    const totalNum = Number(total.replace(',', '.')) || 0;
    if (totalNum <= 0) {
      setError('Escribe el precio total acordado.');
      return;
    }
    const anticipoNum = Number(anticipo.replace(',', '.')) || 0;
    if (anticipoNum > totalNum) {
      setError('Lo que ya te pagó no puede ser más que el precio total.');
      return;
    }
    setGuardando(true);
    setRequierePro(false);
    try {
      await agregarProyecto({ clienteId, nombre: nombre.trim(), precioTotal: totalNum, anticipo: anticipoNum, fechaPromesa: fecha });
      await recargar();
      router.push('/app/proyectos');
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : '';
      if (mensaje.includes('limite_free_proyectos')) {
        setError('Llegaste al límite de 5 proyectos del plan Free. Mejora a Pro para agregar más.');
        setRequierePro(true);
      } else {
        setError('No pudimos guardar tu proyecto. Intenta de nuevo.');
      }
      setGuardando(false);
    }
  }

  if (db.clientes.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10 text-center">
        <button type="button" onClick={() => router.back()} aria-label="Atrás" className="flex size-11 items-center justify-center rounded-full text-[var(--text-secondary)]">
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <p className="mt-6 text-[15px] text-[var(--text-secondary)]">Primero necesitas agregar un cliente para poder crearle un proyecto.</p>
        <Link href="/app/clientes/nuevo" className="mt-3 inline-block text-[14px] font-semibold text-[var(--accent)]">
          + Agregar cliente
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 pt-6 pb-10">
      <button type="button" onClick={() => router.back()} aria-label="Atrás" className="flex size-11 items-center justify-center rounded-full text-[var(--text-secondary)]">
        <ChevronLeft size={22} aria-hidden="true" />
      </button>

      <h1 className="mt-4 text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">Nuevo proyecto</h1>
      <p className="mt-1 text-[14px] text-[var(--text-secondary)]">Vincúlalo a un cliente y el Radar calcula el saldo solo.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Cliente</span>
            <div className="relative">
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="h-14 w-full appearance-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 pr-11 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
              >
                {db.clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.moneda})
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Nombre del proyecto</span>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Rediseño de marca"
              autoFocus
              className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none placeholder:text-[color-mix(in_oklab,var(--text-tertiary)_75%,transparent)] focus-visible:border-[var(--accent)]"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--text-secondary)]">Precio total {cliente ? `(${cliente.moneda})` : ''}</span>
              <input
                type="text"
                inputMode="decimal"
                value={total}
                onChange={(e) => setTotal(e.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="900"
                className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none placeholder:text-[color-mix(in_oklab,var(--text-tertiary)_75%,transparent)] focus-visible:border-[var(--accent)]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--text-secondary)]">Ya te pagó</span>
              <input
                type="text"
                inputMode="decimal"
                value={anticipo}
                onChange={(e) => setAnticipo(e.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="450"
                className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none placeholder:text-[color-mix(in_oklab,var(--text-tertiary)_75%,transparent)] focus-visible:border-[var(--accent)]"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Fecha en la que debería pagar el resto</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 text-[15px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
          </label>

          {cliente && total && (
            <p className="text-[12.5px] text-[var(--text-tertiary)]">
              Saldo pendiente: {cliente.moneda} {simboloMoneda(cliente.moneda)}
              {Math.max(0, (Number(total.replace(',', '.')) || 0) - (Number(anticipo.replace(',', '.')) || 0)).toLocaleString('es')}
            </p>
          )}
        </div>

        {error && (
          <div className="mt-4">
            <p role="alert" className="text-[13px] font-medium text-[var(--status-error)]">
              {error}
            </p>
            {requierePro && (
              <Link href="/app/cuenta" className="mt-2 inline-block text-[13px] font-semibold text-[var(--accent)]">
                Actualizar a Pro
              </Link>
            )}
          </div>
        )}

        <div className="mt-8">
          <CtaFunnel type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar proyecto'}
          </CtaFunnel>
        </div>
      </form>
    </div>
  );
}
