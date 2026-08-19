'use client';

// Fuente ÚNICA de los datos del usuario para toda la app interna (rediseño
// integral, Sesión 6). Antes cada pantalla llamaba a obtenerDB()/obtenerPerfil()
// por su cuenta — duplicaba peticiones al backend y arriesgaba que dos
// pantallas mostraran cifras distintas para el mismo dato. Ahora se carga UNA
// vez aquí y toda la app lee de este mismo contexto (recargar() tras cada
// mutación para que TODAS las pantallas se actualicen a la vez).

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  obtenerDB,
  obtenerPerfilMoneda,
  obtenerPerfil,
  obtenerTasas,
  obtenerTourCompletado,
  marcarTourCompletado,
  obtenerMetaMensual,
  obtenerGastos,
  type DB,
  type TasaCambio,
  type Perfil,
  type Gasto,
} from '@/lib/app-data';
import type { Plan } from '@/lib/planes';

interface AppDataContextValue {
  db: DB;
  plan: Plan;
  monedaPrincipal: string;
  tasas: TasaCambio[];
  perfil: Perfil;
  userId: string;
  metaMensual: number | null;
  gastos: Gasto[];
  cargando: boolean;
  recargar: () => Promise<void>;
  tourVisible: boolean;
  cerrarTour: () => void;
  reabrirTour: () => void;
}

const DB_VACIA: DB = { clientes: [], proyectos: [], pagos: [] };
const PERFIL_VACIO: Perfil = { email: '', nombre: '', apellido: '', nombreNegocio: '' };

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [db, setDb] = useState<DB>(DB_VACIA);
  const [plan, setPlan] = useState<Plan>('free');
  const [monedaPrincipal, setMonedaPrincipal] = useState('USD');
  const [tasas, setTasas] = useState<TasaCambio[]>([]);
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_VACIO);
  const [userId, setUserId] = useState('');
  const [metaMensual, setMetaMensual] = useState<number | null>(null);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tourVisible, setTourVisible] = useState(false);

  const cargar = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    setUserId(user.id);
    const [dbData, perfilMoneda, tasasData, perfilData, tourCompletado, meta, gastosData] = await Promise.all([
      obtenerDB(),
      obtenerPerfilMoneda(),
      obtenerTasas(),
      obtenerPerfil(),
      obtenerTourCompletado(),
      obtenerMetaMensual(),
      obtenerGastos(),
    ]);
    setDb(dbData);
    setPlan(perfilMoneda.plan);
    setMonedaPrincipal(perfilMoneda.monedaPrincipal);
    setTasas(tasasData);
    setPerfil(perfilData);
    setMetaMensual(meta);
    setGastos(gastosData);
    setCargando(false);
    if (!tourCompletado) setTourVisible(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cerrarTour = useCallback(() => {
    setTourVisible(false);
    marcarTourCompletado();
  }, []);

  const reabrirTour = useCallback(() => {
    setTourVisible(true);
  }, []);

  return (
    <AppDataContext.Provider
      value={{ db, plan, monedaPrincipal, tasas, perfil, userId, metaMensual, gastos, cargando, recargar: cargar, tourVisible, cerrarTour, reabrirTour }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData debe usarse dentro de <AppDataProvider>');
  return ctx;
}
