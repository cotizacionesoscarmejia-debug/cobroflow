import crypto from 'node:crypto';

function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Verifica el hottok en tiempo constante (anti timing-attack).
 * Fail-secure: si falta HOTMART_HOTTOK en el entorno, revienta AL PRIMER intento
 * de verificar (no al importar el módulo — Next.js evalúa este archivo durante
 * `next build` para recolectar la config de la ruta, y un throw a nivel de
 * módulo rompería el build entero aunque el secreto solo falte en local).
 */
export function verifyHotmart(opts: { hottok?: string }): boolean {
  const HOTTOK = process.env.HOTMART_HOTTOK;
  if (!HOTTOK) throw new Error('FALTA HOTMART_HOTTOK — el webhook no puede operar de forma segura');
  if (!opts.hottok) return false;
  return timingSafeEqualStr(opts.hottok, HOTTOK);
}
