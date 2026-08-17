'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { CtaFunnel } from '@/components/onboarding/ui';
import { agregarClienteYProyecto } from '@/lib/app-data';
import { MONEDAS } from '@/lib/onboarding';

function hoyISO(offsetDias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return d.toISOString().slice(0, 10);
}

export default function NuevoClientePage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [proyecto, setProyecto] = useState('');
  const [moneda, setMoneda] = useState<string>('USD');
  const [total, setTotal] = useState('');
  const [anticipo, setAnticipo] = useState('');
  const [fecha, setFecha] = useState(hoyISO(14));
  const [error, setError] = useState<string | null>(null);

  const [guardando, setGuardando] = useState(false);

  async function enviar() {
    if (nombre.trim().length === 0) {
      setError('Escribe el nombre de tu cliente.');
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
    try {
      await agregarClienteYProyecto(
        { clientes: [], proyectos: [], pagos: [] },
        {
          nombre: nombre.trim(),
          moneda,
          proyecto: proyecto.trim(),
          precioTotal: totalNum,
          anticipo: anticipoNum,
          fechaPromesa: fecha,
        }
      );
      router.push('/app/clientes');
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : '';
      if (mensaje.includes('limite_free_clientes')) {
        setError('Llegaste al límite de 3 clientes del plan Free. Mejora a Pro para agregar más.');
      } else if (mensaje.includes('limite_free_proyectos')) {
        setError('Llegaste al límite de 5 proyectos del plan Free. Mejora a Pro para agregar más.');
      } else {
        setError('No pudimos guardar tu cliente. Intenta de nuevo.');
      }
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
        Nuevo cliente
      </h1>
      <p className="mt-1 text-[14px] text-[var(--text-secondary)]">Registra el proyecto y el Radar calcula el saldo solo.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <div className="mt-6 flex flex-col gap-4">
          <Campo label="Nombre del cliente" placeholder="Ej. Clínica Nova" value={nombre} onChange={setNombre} autoFocus />
          <Campo label="Proyecto (opcional)" placeholder="Ej. Página web profesional" value={proyecto} onChange={setProyecto} />
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
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Campo label={`Precio total (${moneda})`} placeholder="900" value={total} onChange={setTotal} numerico />
            <Campo label="Ya te pagó" placeholder="450" value={anticipo} onChange={setAnticipo} numerico />
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
        </div>

        {error && (
          <p role="alert" className="mt-4 text-[13px] font-medium text-[var(--status-error)]">
            {error}
          </p>
        )}

        <div className="mt-8">
          <CtaFunnel type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cliente'}
          </CtaFunnel>
        </div>
      </form>
    </div>
  );
}

function Campo({
  label,
  placeholder,
  value,
  onChange,
  numerico = false,
  autoFocus = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  numerico?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[var(--text-secondary)]">{label}</span>
      <input
        type="text"
        autoFocus={autoFocus}
        inputMode={numerico ? 'decimal' : 'text'}
        value={value}
        onChange={(e) => onChange(numerico ? e.target.value.replace(/[^0-9.,]/g, '') : e.target.value)}
        placeholder={placeholder}
        className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none placeholder:text-[color-mix(in_oklab,var(--text-tertiary)_75%,transparent)] focus-visible:border-[var(--accent)]"
      />
    </label>
  );
}
