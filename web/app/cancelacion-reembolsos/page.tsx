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
        Borrador — pendiente de revisión legal completa antes del lanzamiento comercial.
      </p>

      <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-[var(--text-secondary)]">
        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Cómo cancelar</h2>
          <p className="mt-2">
            Puedes cancelar tu suscripción Pro o Premium en cualquier momento desde tu cuenta, sin
            permanencia mínima ni penalización. Sigues teniendo acceso al plan pago hasta el final
            del período ya pagado; después, tu cuenta pasa automáticamente al plan Free — tus
            datos ya cargados no se borran.
          </p>
        </section>
        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Reembolsos</h2>
          <p className="mt-2">
            Si tuviste un cobro duplicado o un error de facturación, escríbenos a{" "}
            <a href="mailto:hola@cobroflow.app" className="underline">
              hola@cobroflow.app
            </a>{" "}
            y lo revisamos caso por caso.
          </p>
        </section>
      </div>
    </main>
  );
}
