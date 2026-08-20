import type { NextConfig } from "next";

// Cabeceras de seguridad (auditoría, hallazgo importante #7) — el sitio no
// tenía ninguna defensa a nivel de navegador contra clickjacking, sniffing de
// MIME ni fuga de referrer. CSP queda deliberadamente permisiva en script/style
// ('unsafe-inline'/'unsafe-eval') porque la app usa estilos inline de React en
// decenas de componentes y Next.js necesita scripts inline para hidratar sin
// una infraestructura de nonce — implementarla es una mejora futura, no algo
// seguro de improvisar sin poder probar cada pantalla. Igual bloquea lo más
// grave: scripts/frames de terceros, iframes que empotren el sitio (clickjacking)
// y conexiones fuera de la lista permitida.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // wss:/ws: — Supabase realtime (si se usa a futuro) y el HMR de "next dev" en
  // local, que abre un WebSocket al mismo host y algunos navegadores no lo
  // cubren con 'self' solo.
  `connect-src 'self' https://*.supabase.co ${supabaseUrl} wss: ws:`.trim(),
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
  /* config options here */
  // Apaga el indicador flotante de Next dev (el círculo "N") — solo ensucia
  // los screenshots de revisión, no existe en producción de todas formas.
  devIndicators: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
