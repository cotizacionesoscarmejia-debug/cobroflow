import { Resend } from 'resend';
import type { SupabaseClient } from '@supabase/supabase-js';

// Cliente único de Resend — un solo RESEND_API_KEY para mantener la puesta en
// marcha simple (la doctrina del SO recomienda dos keys separadas a más
// volumen; con un solo remitente por tipo hoy alcanza). Lo que SÍ separa la
// reputación es el DOMINIO de envío (ver FROM_TX/FROM_MKT abajo) — eso es lo
// que de verdad protege el correo transaccional si el marketing se quema.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// tx.cobroflow.app = transaccional (nunca puede fallar) · news.cobroflow.app =
// marketing/nurturing (más volumen, más riesgo de queja) — subdominios
// distintos para que una reputación no contamine a la otra (46-EMAIL-DELIVERABILITY).
export const FROM_TX = 'CobroFlow <acceso@tx.cobroflow.app>';
export const FROM_MKT = 'CobroFlow <hola@news.cobroflow.app>';
export const REPLY_TO = 'soporte@cobroflow.app';

export interface EnvioEmail {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

/**
 * Envía un correo con Resend. Nunca revienta el flujo que lo llama (webhook de
 * pago, cron) si el correo falla — el envío es best-effort: la transacción de
 * dinero/estado ya se aplicó ANTES de intentar el correo, así que un fallo de
 * email nunca debe tumbar ni reintentar un webhook que ya hizo su trabajo real.
 */
export async function enviarEmail(opts: EnvioEmail): Promise<{ id: string | null; error: string | null }> {
  if (!resend) {
    console.error('RESEND_API_KEY no configurada — correo NO enviado', { to: opts.to, subject: opts.subject });
    return { id: null, error: 'sin_configurar' };
  }
  const { data, error } = await resend.emails.send({
    from: opts.from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    replyTo: opts.replyTo ?? REPLY_TO,
  });
  if (error) {
    console.error('resend error', { to: opts.to, subject: opts.subject, error: error.message });
    return { id: null, error: error.message };
  }
  return { id: data?.id ?? null, error: null };
}

/** ¿Ya le mandamos esta plantilla a este correo? (opcionalmente, solo después de una fecha). Evita reenvíos duplicados en las secuencias por cron. */
export async function yaSeEnvio(
  admin: SupabaseClient,
  params: { email: string; template: string; despuesDe?: Date }
): Promise<boolean> {
  let query = admin.from('email_log').select('id', { count: 'exact', head: true }).eq('email', params.email).eq('template', params.template);
  if (params.despuesDe) query = query.gte('sent_at', params.despuesDe.toISOString());
  const { count } = await query;
  return (count ?? 0) > 0;
}

export async function registrarEnvio(
  admin: SupabaseClient,
  params: { userId?: string | null; email: string; template: string; resendId: string | null }
): Promise<void> {
  await admin.from('email_log').insert({
    user_id: params.userId ?? null,
    email: params.email,
    template: params.template,
    resend_id: params.resendId,
  });
}

/** Antes de mandar marketing (nunca transaccional): ¿está en la lista de supresión? */
export async function estaSuprimido(admin: SupabaseClient, email: string): Promise<boolean> {
  const { data } = await admin.from('email_suppression').select('email').eq('email', email).maybeSingle();
  return !!data;
}
