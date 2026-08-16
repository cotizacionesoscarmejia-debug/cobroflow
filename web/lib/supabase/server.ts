import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cliente para Server Components / Route Handlers — lee/escribe cookies de
// sesión. Usa la publishable key (RLS protege los datos, no la secret).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Se llama desde un Server Component sin permiso de escritura —
            // el middleware ya refresca la sesión, esto es seguro de ignorar.
          }
        },
      },
    }
  );
}
