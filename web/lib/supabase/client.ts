import { createBrowserClient } from '@supabase/ssr';

// Cliente para componentes 'use client' — usa la publishable key (segura de
// exponer: la protege RLS, nunca la secret key).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
