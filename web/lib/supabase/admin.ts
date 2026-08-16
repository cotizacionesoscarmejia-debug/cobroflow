import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// SOLO servidor (route handlers de confianza: webhook de Hotmart, cron, admin).
// Usa la secret key — salta RLS. JAMÁS importar este archivo desde código que
// se ejecute en el navegador.
export function createAdminClient() {
  return createSupabaseClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
