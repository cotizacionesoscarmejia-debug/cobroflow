'use client';

import { CircleAlert, Clock, MessageCircle, Search } from 'lucide-react';
import { Hero } from '@/components/landing/Hero';
import { Problema } from '@/components/landing/Problema';
import { Agitacion } from '@/components/landing/Agitacion';
import { Solucion } from '@/components/landing/Solucion';
import { AppPorDentro } from '@/components/landing/AppPorDentro';
import { OfertaPlanes } from '@/components/landing/OfertaPlanes';
import { Garantia } from '@/components/landing/Garantia';
import { Faq } from '@/components/landing/Faq';
import { CtaFinal } from '@/components/landing/CtaFinal';
import { FooterLegal } from '@/components/landing/FooterLegal';
import { StickyCtaMobile } from '@/components/landing/ui';

// Modelo freemium (Free/Pro/Premium, sin trial — ver ESTADO.md): el CTA lleva a
// /onboarding, nunca a un checkout directo desde la landing.
const CTA_HREF = '/onboarding';
const CTA_LABEL = 'Ver quién me debe — gratis';

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)]">
      {/* 1. HERO */}
      <Hero
        appName="CobroFlow"
        logo={<img src="/logo.png" alt="" aria-hidden="true" className="size-7 object-contain" />}
        loginHref="/login"
        h1Marked="Cobra lo que te deben. [acento]Controla lo que ganas[/acento]."
        subtitleMarked="CobroFlow te muestra cuánto has cobrado, cuánto te deben y qué clientes necesitan seguimiento."
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        socialProof={<span>Sin tarjeta de crédito para empezar</span>}
        visualPlaceholderSugerencia="captura del Panel principal con el saldo cobrado, lo pendiente y los clientes atrasados"
      />

      {/* 2. PROBLEMA */}
      <Problema
        titulo="¿Te suena?"
        preguntas={[
          { icon: Search, textoMarked: '¿Sabes ahora mismo [b]cuánto te deben[/b] en total?' },
          { icon: MessageCircle, textoMarked: '¿Revisas WhatsApp buscando en qué quedaste con un pago?' },
          { icon: Clock, textoMarked: '¿Se te ha olvidado cobrarle a un cliente por semanas?' },
          { icon: CircleAlert, textoMarked: '¿Te da pena recordarle a alguien que te debe dinero?' },
        ]}
      />

      {/* 3. AGITACIÓN */}
      <Agitacion
        frases={[
          'En un año, eso son [acento]30 horas[/acento] buscando dinero que ya es tuyo.',
          'Y cada cobro que se te olvida es dinero que [b]nunca vuelves a pedir[/b].',
        ]}
        contraste={{
          labelHoy: 'Hoy',
          hoy: 'Buscas en 3 chats de WhatsApp para confirmar cuánto te deben.',
          labelFuturo: 'En 6 meses, si nada cambia',
          futuro: 'El mismo lío — con más clientes y más dinero sin cobrar.',
        }}
      />

      {/* 4. SOLUCIÓN */}
      <Solucion
        tituloMarked="Sabe cuánto te deben, [acento]sin que calcules nada[/acento]."
        mecanismo="el Radar de Cobros"
        bigIdeaMarked="No necesitas ser bueno con los números: el Radar de Cobros [b]calcula tu saldo automáticamente[/b] apenas registras un cliente y un pago."
        pasos={[
          { titulo: 'Agrega tu cliente', detalle: 'Nombre, proyecto y el precio acordado — 30 segundos.' },
          { titulo: 'Registra el pago', detalle: 'Anticipo, parcial o pago final — el Radar calcula lo que falta.' },
          { titulo: 'Mira quién te debe', detalle: 'El Panel te dice, hoy, a quién seguirle y cuánto.' },
        ]}
        antesDespues={{
          labelAntes: 'Antes',
          antes: 'Hojas de cálculo desactualizadas y capturas de WhatsApp perdidas.',
          labelDespues: 'Después',
          despues: 'Un saldo exacto, siempre al día, sin que muevas un dedo.',
        }}
      />

      {/* 5. LA APP POR DENTRO */}
      <AppPorDentro
        tituloMarked="Tu negocio, [acento]de un vistazo[/acento]."
        frames={[
          { label: 'Sabes cuánto has cobrado este mes', nombrePantalla: 'Panel principal' },
          { label: 'Ves quién necesita seguimiento hoy', nombrePantalla: 'Centro de cobros' },
          { label: 'Mandas el recordatorio en un toque', nombrePantalla: 'Recordatorio de pago' },
          { label: 'Ves tu progreso mes a mes', nombrePantalla: 'Estadísticas' },
        ]}
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
      />

      {/* 6. OFERTA — 3 planes (variante propia del kit, ver OfertaPlanes.tsx) */}
      <OfertaPlanes
        tituloMarked="Empieza gratis. [acento]Crece cuando lo necesites[/acento]."
        subtituloMarked="Sin tarjeta para el plan gratis. Cancela cuando quieras."
        planes={[
          {
            nombre: 'Free',
            precioMes: '$0',
            descripcion: 'Para empezar a controlar tus cobros hoy mismo.',
            ctaLabel: 'Empezar gratis',
            ctaHref: `${CTA_HREF}?plan=free`,
            features: [
              'Hasta 3 clientes activos',
              'Hasta 5 proyectos',
              'Registro de pagos y saldo automático',
              'Panel básico y estado de cobros',
              'Recordatorios manuales para WhatsApp',
            ],
          },
          {
            nombre: 'Pro',
            precioMes: '$7.99',
            descripcion: 'Para freelancers con varios clientes activos a la vez.',
            ctaLabel: 'Empezar con Pro',
            ctaHref: `${CTA_HREF}?plan=pro`,
            destacado: true,
            badge: 'MÁS POPULAR',
            features: [
              'Clientes y proyectos ilimitados',
              'Centro de cobros con seguimiento',
              'Recordatorios con plantillas y WhatsApp',
              'Reportes, gráficas y varias monedas',
              'Exportar en CSV y PDF',
            ],
          },
          {
            nombre: 'Premium',
            precioMes: '$14.99',
            descripcion: 'Para quien quiere proyectar y entender su negocio a fondo.',
            ctaLabel: 'Empezar con Premium',
            ctaHref: `${CTA_HREF}?plan=premium`,
            features: [
              'Todo lo de Pro, sin límites',
              'Proyección de tu flujo de dinero',
              'Metas mensuales con tu progreso',
              'Análisis de tu negocio con IA',
            ],
          },
        ]}
      />

      {/* 7. GARANTÍA — riesgo real del modelo freemium, no un plazo inventado */}
      <Garantia
        nombre="la Garantía de Cero Riesgo"
        condicionMarked="Empiezas en el plan Free sin poner tarjeta. Si más adelante pasas a Pro o Premium, [b]cancelas cuando quieras[/b], sin permanencia ni preguntas."
        pisoLegal="Pagos procesados de forma segura por Hotmart"
      />

      {/* 8. FAQ */}
      <Faq
        items={[
          {
            pregunta: '¿CobroFlow es un programa de contabilidad?',
            respuestaMarked:
              'No. No hace facturas fiscales ni impuestos — es el lugar simple donde ves [b]quién te debe y cuánto[/b], para usar junto a lo que ya tienes.',
          },
          {
            pregunta: '¿Necesito tarjeta para el plan gratis?',
            respuestaMarked:
              'No. Empiezas con Free sin dar ningún dato de pago — [b]agregas tu tarjeta solo si decides subir de plan[/b].',
          },
          {
            pregunta: '¿Es como las apps de facturación que ya probé y abandoné?',
            respuestaMarked:
              'No — esas están hechas para facturar y declarar impuestos. CobroFlow solo hace una cosa: [b]decirte quién te debe y cuánto[/b], sin módulos que no vas a usar.',
          },
          {
            pregunta: '¿Necesito usar inteligencia artificial para usar la app?',
            respuestaMarked:
              'No. Tus saldos y atrasos siempre se calculan con matemática exacta. La IA es opcional y [b]solo aparece en Premium[/b], para un resumen de tu negocio.',
          },
          {
            pregunta: '¿Es seguro poner los datos de mi tarjeta?',
            respuestaMarked:
              'Sí — el cobro lo procesa Hotmart, la misma pasarela que usan miles de negocios. [b]CobroFlow nunca ve ni guarda tu tarjeta[/b].',
          },
          {
            pregunta: '¿Puedo cancelar cuando quiera?',
            respuestaMarked:
              'Sí, sin permanencia. Y si vuelves al plan gratis, [b]no pierdes tu historial ya cargado[/b].',
          },
        ]}
      />

      {/* 9. CTA FINAL */}
      <CtaFinal
        h2Marked="Deja de [acento]buscar en WhatsApp[/acento] quién te debe."
        futurePacingMarked="Abres CobroFlow, ves tu saldo real en 5 segundos, y sabes exactamente a quién seguirle hoy."
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        recap="Empieza gratis, sin tarjeta — sube de plan cuando lo necesites."
        psMarked="PS: CobroFlow calcula solo cuánto te deben, quién está atrasado y cuánto vas a recibir, con el Radar de Cobros. [b]Hoy puedes empezar gratis, sin tarjeta[/b], y ver tu primer saldo calculado en menos de 2 minutos."
      />

      {/* 10. FOOTER LEGAL */}
      <FooterLegal
        appName="CobroFlow"
        soporteEmail="soporte@cobroflow.app"
        enlaces={[
          { label: 'Privacidad', href: '/privacidad' },
          { label: 'Términos y Condiciones', href: '/terminos' },
          { label: 'Cancelación y Reembolsos', href: '/cancelacion-reembolsos' },
          { label: 'Aviso de IA', href: '/aviso-ia' },
        ]}
      />

      <StickyCtaMobile labelComercial={CTA_LABEL} href={CTA_HREF} />
    </div>
  );
}
