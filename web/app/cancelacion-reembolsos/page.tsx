export const metadata = { title: "Cancelación y Reembolsos — CobroFlow" };

export default function CancelacionReembolsosPage() {
  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-16 text-[var(--text-primary)]">
      <a href="/" className="text-[14px] text-[var(--text-secondary)] hover:underline">
        ← Volver a CobroFlow
      </a>
      <h1 className="mt-6 text-[32px] font-bold [font-family:var(--font-display)]">
        Cancelación y reembolsos
      </h1>
      <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">
        Última actualización: 21 de agosto de 2026.
      </p>

      <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-[var(--text-secondary)]">
        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Renovación automática</h2>
          <p className="mt-2">
            Los planes Pro y Premium son suscripciones que se renuevan automáticamente cada mes,
            cobradas por Hotmart. No hay periodo de prueba pagado ni cobro sorpresa: el precio y la
            fecha de tu primer cobro se muestran antes de pagar, en el paywall.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Cómo cancelar</h2>
          <p className="mt-2">
            Puedes cancelar tu suscripción cuando quieras, sin permanencia mínima ni penalización, de
            dos formas:
          </p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5">
            <li>
              Dentro de CobroFlow: entra a <strong className="text-[var(--text-primary)]">Configuración → Plan</strong> y
              presiona <strong className="text-[var(--text-primary)]">&quot;Gestionar o cancelar tu suscripción&quot;</strong>.
            </li>
            <li>
              Directamente en Hotmart: entra a{" "}
              <a href="https://consumer.hotmart.com" target="_blank" rel="noopener noreferrer" className="underline">
                consumer.hotmart.com
              </a>{" "}
              con el correo con el que pagaste, ve a &quot;Mis compras&quot; y cancela desde ahí.
            </li>
          </ol>
          <p className="mt-2">
            Al cancelar, sigues teniendo acceso completo a tu plan pago hasta el final del período ya
            pagado. Después, tu cuenta pasa automáticamente al plan Free — tus datos ya cargados
            (clientes, proyectos, pagos, gastos) nunca se borran.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Ventana de reembolso</h2>
          <p className="mt-2">
            CobroFlow hoy no promete un plazo propio de &quot;devolución de dinero&quot; más allá del
            que ya aplica Hotmart como plataforma de pago: tienes derecho a pedir el reembolso
            completo de tu compra dentro de los{" "}
            <strong className="text-[var(--text-primary)]">7 días posteriores al pago</strong>, sin
            necesidad de justificarlo — es una garantía que Hotmart aplica a todas las compras hechas
            en su plataforma, en línea con la ley de protección al consumidor de Brasil (donde
            Hotmart está constituida). Puedes pedirlo directamente en{" "}
            <a href="https://consumer.hotmart.com" target="_blank" rel="noopener noreferrer" className="underline">
              consumer.hotmart.com
            </a>
            .
          </p>
          <p className="mt-2">
            Pasados esos 7 días, evaluamos cualquier solicitud de reembolso caso por caso — por
            ejemplo, si hubo un cobro duplicado o un error de facturación. Escríbenos a{" "}
            <a href="mailto:soporte@cobroflow.app" className="underline">
              soporte@cobroflow.app
            </a>{" "}
            contándonos qué pasó.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Si tu pago falla o se atrasa</h2>
          <p className="mt-2">
            Si Hotmart no logra cobrar tu suscripción a tiempo, mantienes acceso a tu plan pago
            durante unos días de gracia mientras se reintenta el cobro. Si el pago sigue sin
            completarse después de ese plazo, tu cuenta pasa automáticamente al plan Free — sin
            perder tus datos.
          </p>
        </section>
      </div>
    </main>
  );
}
