'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Wallet } from 'lucide-react';
import { Marca, EncabezadoPaso, Chip, PasoTransicion, CtaFunnel, NumeroAnimado } from '@/components/onboarding/ui';
import { Perforacion } from '@/components/landing/ui';
import { guardarEstado, leerEstado, saldoPendiente, simboloMoneda, monedaSugerida, MONEDAS, PERFILES } from '@/lib/onboarding';

type Paso = 'perfil' | 'moneda' | 'cliente' | 'calculando' | 'resultado';
const ORDEN: Paso[] = ['perfil', 'moneda', 'cliente', 'calculando', 'resultado'];

export default function OnboardingPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>('perfil');
  const [perfil, setPerfil] = useState<string | undefined>();
  const [moneda, setMoneda] = useState<string | undefined>();
  const [nombre, setNombre] = useState('');
  const [proyecto, setProyecto] = useState('');
  const [total, setTotal] = useState('');
  const [anticipo, setAnticipo] = useState('');
  const [errorCliente, setErrorCliente] = useState<string | null>(null);

  useEffect(() => {
    const e = leerEstado();
    if (e.perfil) setPerfil(e.perfil);
    setMoneda(e.moneda ?? monedaSugerida());
    // Si ya respondió perfil+moneda (ej. volvió desde /paywall a corregir su
    // cliente), saltar directo al paso donde puede corregir — no repetir preguntas
    // ya respondidas.
    if (e.perfil && e.moneda) {
      if (e.primerCliente) {
        setNombre(e.primerCliente.nombre);
        setProyecto(e.primerCliente.proyecto);
        setTotal(String(e.primerCliente.total || ''));
        setAnticipo(String(e.primerCliente.anticipo || ''));
      }
      setPaso('cliente');
    }
  }, []);

  const idx = ORDEN.indexOf(paso);

  function elegirPerfil(v: string) {
    setPerfil(v);
    guardarEstado({ perfil: v });
    setTimeout(() => setPaso('moneda'), 300);
  }

  function elegirMoneda(v: string) {
    setMoneda(v);
    guardarEstado({ moneda: v });
    setTimeout(() => setPaso('cliente'), 300);
  }

  function cambiarNombre(v: string) {
    setNombre(v);
    if (errorCliente) setErrorCliente(null);
  }

  function cambiarTotal(v: string) {
    setTotal(v);
    if (errorCliente) setErrorCliente(null);
  }

  function cambiarAnticipo(v: string) {
    setAnticipo(v);
    if (errorCliente) setErrorCliente(null);
  }

  function enviarCliente() {
    if (nombre.trim().length === 0) {
      setErrorCliente('Escribe el nombre de tu cliente para poder calcular su saldo.');
      return;
    }
    const totalNum = Number(total.replace(',', '.')) || 0;
    if (totalNum <= 0) {
      setErrorCliente('Escribe el precio total acordado — es lo que necesita el Radar para calcular.');
      return;
    }
    const anticipoRevisar = Number(anticipo.replace(',', '.')) || 0;
    if (anticipoRevisar > totalNum) {
      setErrorCliente('Lo que ya te pagó no puede ser más que el precio total — revisa los montos.');
      return;
    }
    setErrorCliente(null);
    const anticipoNum = Number(anticipo.replace(',', '.')) || 0;
    guardarEstado({
      primerCliente: { nombre: nombre.trim(), proyecto: proyecto.trim(), total: totalNum, anticipo: anticipoNum },
    });
    setPaso('calculando');
    setTimeout(() => setPaso('resultado'), 1400);
  }
  const saldo = saldoPendiente({
    nombre,
    proyecto,
    total: Number(total.replace(',', '.')) || 0,
    anticipo: Number(anticipo.replace(',', '.')) || 0,
  });

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[var(--bg)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(640px 420px at 15% 100%, color-mix(in oklab, var(--accent) 7%, transparent) 0%, transparent 60%), ' +
            'radial-gradient(520px 360px at 100% 0%, color-mix(in oklab, var(--accent-2) 6%, transparent) 0%, transparent 55%)',
        }}
      />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-8 pt-6">
        <div className="mb-8">
          <Marca confirmarSalida={idx > 0} />
        </div>

      {paso !== 'calculando' && paso !== 'resultado' && (
        <div className="mb-8">
          <EncabezadoPaso
            pasoActual={idx + 1}
            totalPasos={3}
            onAtras={idx > 0 ? () => setPaso(ORDEN[idx - 1] as Paso) : undefined}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {paso === 'perfil' && (
          <PasoTransicion pasoKey="perfil">
            <h1 className="text-balance text-[28px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              ¿Qué te describe mejor?
            </h1>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">Así adaptamos CobroFlow a tu forma de trabajar.</p>
            <div className="mt-8 flex flex-col gap-3">
              {PERFILES.map((p, i) => (
                <Chip key={p} label={p} seleccionado={perfil === p} onSelect={() => elegirPerfil(p)} index={i} />
              ))}
            </div>
          </PasoTransicion>
        )}

        {paso === 'moneda' && (
          <PasoTransicion pasoKey="moneda">
            <h1 className="text-balance text-[28px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              ¿Cuál es tu moneda principal?
            </h1>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">La que más usas para cobrar a tus clientes.</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {MONEDAS.map((m, i) => (
                <Chip key={m} label={m} seleccionado={moneda === m} onSelect={() => elegirMoneda(m)} index={i} />
              ))}
            </div>
          </PasoTransicion>
        )}

        {paso === 'cliente' && (
          <PasoTransicion pasoKey="cliente">
            <h1 className="text-balance text-[28px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              Agrega tu primer cliente
            </h1>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              Uno real — vas a ver tu saldo calculado al instante.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                enviarCliente();
              }}
            >
              <div className="mt-8 flex flex-col gap-4">
                <Campo label="Nombre del cliente" placeholder="Ej. Clínica Nova" value={nombre} onChange={cambiarNombre} autoFocus />
                <Campo label="Proyecto (opcional)" placeholder="Ej. Página web profesional" value={proyecto} onChange={setProyecto} />
                <div className="grid grid-cols-2 gap-3">
                  <Campo
                    label={`Precio total (${moneda ?? 'USD'})`}
                    placeholder="900"
                    value={total}
                    onChange={cambiarTotal}
                    numerico
                  />
                  <Campo
                    label="Ya te pagó"
                    placeholder="450"
                    value={anticipo}
                    onChange={cambiarAnticipo}
                    numerico
                  />
                </div>
              </div>
              {errorCliente && (
                <p role="alert" className="mt-4 text-[13px] font-medium text-[var(--status-error)]">
                  {errorCliente}
                </p>
              )}
              <div className="mt-8">
                <CtaFunnel type="submit">Calcular mi saldo</CtaFunnel>
              </div>
            </form>
          </PasoTransicion>
        )}

        {paso === 'calculando' && (
          <PasoTransicion pasoKey="calculando">
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="flex size-14 items-center justify-center rounded-full border-2 border-[color-mix(in_oklab,var(--accent)_25%,transparent)] border-t-[var(--accent)]"
                aria-hidden="true"
              />
              <p className="text-[16px] font-medium text-[var(--text-secondary)]">
                Calculando el saldo de {nombre || 'tu cliente'}…
              </p>
            </div>
          </PasoTransicion>
        )}

        {paso === 'resultado' && (
          <PasoTransicion pasoKey="resultado">
            <div className="flex min-h-[70vh] flex-col">
              <div className="flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] px-3 py-1.5 text-[12px] font-semibold text-[var(--accent)]">
                  <Wallet size={13} aria-hidden="true" />
                  Tu Radar de Cobros ya calculó esto
                </span>

                <h1 className="mt-4 text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
                  {nombre || 'Tu cliente'} te debe:
                </h1>

                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 }}
                  className="relative mt-6 overflow-hidden rounded-[var(--radius-card)] bg-[var(--surface)] p-6 shadow-[var(--shadow-2)]"
                >
                  <Perforacion />
                  <p className="text-[13px] text-[var(--text-secondary)]">Saldo pendiente</p>
                  <p className="mt-1 text-[42px] font-bold leading-none tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
                    <NumeroAnimado valor={saldo} prefijo={`${moneda ?? 'USD'} ${simboloMoneda(moneda)}`} />
                  </p>
                  <div className="mt-5 flex justify-between border-t border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] pt-4 text-[13px]">
                    <span className="text-[var(--text-secondary)]">Precio total</span>
                    <span className="tabular-nums font-medium text-[var(--text-primary)]">
                      {moneda ?? 'USD'} {simboloMoneda(moneda)}
                      {(Number(total.replace(',', '.')) || 0).toLocaleString('es')}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-[13px]">
                    <span className="text-[var(--text-secondary)]">Ya te pagó</span>
                    <span className="tabular-nums font-medium text-[var(--text-primary)]">
                      {moneda ?? 'USD'} {simboloMoneda(moneda)}
                      {(Number(anticipo.replace(',', '.')) || 0).toLocaleString('es')}
                    </span>
                  </div>
                </motion.div>

                <p className="mt-5 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                  Esto lo calculó solo, sin que hicieras la cuenta. Así se ve cada cliente que agregues
                  a partir de ahora — y el Radar te va a avisar antes de que se te olvide cobrar.
                </p>
              </div>

              <div className="mt-6">
                <CtaFunnel onClick={() => router.push('/paywall')}>Ver mi plan</CtaFunnel>
              </div>
            </div>
          </PasoTransicion>
        )}
      </AnimatePresence>
      </div>
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
