import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyHotmart } from '@/lib/hotmart-verify';
import { statusForEvent, planForOfferCode } from '@/lib/membership-fsm';

// Necesitamos node:crypto y el raw body — no corre en el runtime Edge.
export const runtime = 'nodejs';

const REPLAY_WINDOW_MS = 5 * 60 * 1000;

// Suscripción cancelada: sigue con acceso completo hasta el fin del ciclo ya
// pagado. Hotmart no siempre manda la fecha exacta de fin de ciclo en este
// evento — 30 días es un colchón conservador mientras no se confirme el campo
// real del payload de tu cuenta.
const ACCESS_GRACE_DAYS_CANCEL = 30;
// Pago atrasado: ventana de gracia antes de cortar acceso (dunning).
const ACCESS_GRACE_DAYS_PAST_DUE = 5;

export async function POST(req: NextRequest) {
  const admin = createAdminClient();

  // 1. Raw body (bytes exactos) — se lee ANTES de parsear.
  const rawBody = await req.text();

  // 2. Autenticidad — hottok en tiempo constante.
  const hottok = req.headers.get('x-hotmart-hottok') ?? undefined;
  if (!verifyHotmart({ hottok })) {
    await admin.from('webhook_log').insert({ result: 'unauthorized' });
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 3. Parsear SOLO después de verificar.
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  // 4. Frescura (anti-replay).
  const ts = payload.creation_date ?? payload.data?.purchase?.approved_date;
  if (ts && Date.now() - Number(ts) > REPLAY_WINDOW_MS) {
    console.error('webhook hotmart stale', { ts, now: Date.now() });
    return NextResponse.json({ error: 'stale' }, { status: 400 });
  }

  const event: string = payload.event;
  const eventId: string =
    payload.id ?? payload.event_id ?? payload.data?.purchase?.transaction ?? `${event}:${payload.data?.buyer?.email}:${ts ?? ''}`;
  const email: string | undefined = payload.data?.buyer?.email;
  const subscriberCode: string | undefined = payload.data?.subscription?.subscriber?.code;
  const productId: string | undefined = payload.data?.product?.id?.toString();
  // ⚠️ Campo sin verificar todavía contra un payload real — ver el comentario en
  // planForOfferCode (lib/membership-fsm.ts). Ajustar aquí si Hotmart manda el
  // código de oferta en otro lugar del payload.
  const offerCode: string | undefined = payload.data?.purchase?.offer?.code;

  const newStatus = statusForEvent(event);
  if (!newStatus) {
    // Evento que no nos interesa (ej. uno que no mapeamos todavía): 200 para
    // que Hotmart no lo siga reintentando, sin tocar la base de datos.
    return NextResponse.json({ received: true, ignored: event });
  }

  // 5. Catálogo allowlisted: el producto tiene que ser el de CobroFlow (un
  //    solo producto en Hotmart con 2 planes adentro, Pro y Premium), no
  //    cualquier otro producto de la cuenta de Hotmart del dueño.
  if (productId !== process.env.HOTMART_PRODUCT_ID) {
    await admin.from('webhook_log').insert({ event_id: eventId, type: event, result: 'ignored' });
    return NextResponse.json({ received: true, ignored: 'producto distinto' });
  }

  const plan = newStatus === 'active' ? planForOfferCode(offerCode) : null;
  if (newStatus === 'active' && !plan) {
    await admin.from('webhook_log').insert({ event_id: eventId, type: event, result: 'error' });
    return NextResponse.json({ error: 'plan no reconocido' }, { status: 400 });
  }

  const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex');

  const accessUntil =
    newStatus === 'cancelled' ? new Date(Date.now() + ACCESS_GRACE_DAYS_CANCEL * 86_400_000).toISOString() : null;
  const graceEndsAt =
    newStatus === 'past_due' ? new Date(Date.now() + ACCESS_GRACE_DAYS_PAST_DUE * 86_400_000).toISOString() : null;

  // 6. Idempotencia + transición + update, todo atómico en la RPC.
  const { data, error } = await admin.rpc('apply_hotmart_event', {
    p_event_id: eventId,
    p_event_type: event,
    p_payload_hash: payloadHash,
    p_email: email ?? null,
    p_subscriber_code: subscriberCode ?? null,
    p_plan: plan,
    p_new_status: newStatus,
    p_access_until: accessUntil,
    p_grace_ends_at: graceEndsAt,
  });

  if (error) {
    console.error('webhook hotmart error', { event, code: error.code });
    await admin.from('webhook_log').insert({ event_id: eventId, type: event, result: 'error' });
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }

  return NextResponse.json({ received: true, result: data });
}
