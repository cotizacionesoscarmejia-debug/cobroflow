export const metadata = { title: "Privacidad — CobroFlow" };

export default function PrivacidadPage() {
  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-16 text-[var(--text-primary)]">
      <a href="/" className="text-[14px] text-[var(--text-secondary)] hover:underline">
        ← Volver a CobroFlow
      </a>
      <h1 className="mt-6 text-[32px] font-bold [font-family:var(--font-display)]">
        Política de privacidad
      </h1>
      <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">
        Borrador — pendiente de revisión legal completa antes del lanzamiento comercial.
      </p>

      <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-[var(--text-secondary)]">
        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Qué datos guardamos</h2>
          <p className="mt-2">
            Tu correo, tu nombre, y los datos de tus clientes y cobros que registras dentro de la
            app (nombre del cliente, proyectos, montos y fechas de pago). Nunca guardamos los
            datos de tu tarjeta — el pago lo procesa Stripe directamente.
          </p>
        </section>
        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Cómo los usamos</h2>
          <p className="mt-2">
            Para hacer funcionar la app (calcular tus saldos, mostrarte tu Dashboard) y, si tienes
            el plan Premium y lo activas tú mismo, para generar el análisis de tu negocio con IA —
            en ese caso solo enviamos un resumen numérico, nunca los datos de tus clientes.
          </p>
        </section>
        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Con quién los compartimos</h2>
          <p className="mt-2">
            Con nadie fuera de los proveedores que hacen funcionar CobroFlow (base de datos, envío
            de correos, procesamiento de pago). Nunca vendemos ni compartimos los datos de tus
            clientes con terceros ni con otros usuarios.
          </p>
        </section>
        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Tus derechos</h2>
          <p className="mt-2">
            Puedes pedir que exportemos o eliminemos tu cuenta y tus datos escribiendo a{" "}
            <a href="mailto:hola@cobroflow.app" className="underline">
              hola@cobroflow.app
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
