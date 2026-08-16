export const metadata = { title: "Términos y Condiciones — CobroFlow" };

export default function TerminosPage() {
  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-16 text-[var(--text-primary)]">
      <a href="/" className="text-[14px] text-[var(--text-secondary)] hover:underline">
        ← Volver a CobroFlow
      </a>
      <h1 className="mt-6 text-[32px] font-bold [font-family:var(--font-display)]">
        Términos y condiciones
      </h1>
      <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">
        Borrador — pendiente de revisión legal completa antes del lanzamiento comercial.
      </p>

      <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-[var(--text-secondary)]">
        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Qué es CobroFlow</h2>
          <p className="mt-2">
            CobroFlow es una herramienta para llevar el control de tus clientes, proyectos y
            cobros pendientes. No es un sistema contable ni de facturación fiscal: no genera
            facturas electrónicas ni declaraciones de impuestos, y no procesa los pagos de tus
            clientes — solo te ayuda a darles seguimiento.
          </p>
        </section>
        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Planes y pagos</h2>
          <p className="mt-2">
            El plan Free es gratuito y no requiere tarjeta. Los planes Pro y Premium se cobran por
            suscripción mensual a través de Stripe. Puedes cancelar tu suscripción cuando quieras
            desde tu cuenta; al cancelar, conservas acceso a tus datos ya cargados en el plan Free.
          </p>
        </section>
        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Tu responsabilidad</h2>
          <p className="mt-2">
            Los datos de clientes y montos que registras son tuyos y de tu responsabilidad.
            CobroFlow te muestra cálculos automáticos de saldos y fechas, pero no reemplaza tu
            criterio ni el de un contador para decisiones fiscales o legales.
          </p>
        </section>
        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Cambios a estos términos</h2>
          <p className="mt-2">
            Si actualizamos estos términos de forma importante, te avisaremos por correo antes de
            que entren en vigor.
          </p>
        </section>
      </div>
    </main>
  );
}
