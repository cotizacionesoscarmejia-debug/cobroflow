// Redirección que registra el clic ANTES de mandar a Hotmart — es la fuente
// real del "carrito abandonado" (B, 18/35): en CobroFlow siempre hay una
// cuenta registrada antes de llegar al checkout, así que en vez de adivinar el
// nombre de un evento de webhook de Hotmart sin confirmar, registramos el clic
// nosotros mismos. El cron de emails (app/api/cron/emails) compara este
// registro contra el plan actual para saber si la persona convirtió o no.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hotmartCheckoutUrl } from '@/lib/hotmart-links';

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get('plan');
  if (plan !== 'pro' && plan !== 'premium') {
    return NextResponse.redirect(new URL('/app/cuenta', req.url));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Best-effort: si el insert falla, igual mandamos al usuario a pagar — no
  // bloquear una venta real por un problema de tracking.
  await supabase.from('checkout_intentos').insert({ user_id: user.id, plan });

  const destino = hotmartCheckoutUrl(plan, { email: user.email ?? undefined, userId: user.id });
  return NextResponse.redirect(destino);
}
