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
        Última actualización: 21 de agosto de 2026. Operado por Oscar Mejía (persona física),
        Guatemala.
      </p>

      <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-[var(--text-secondary)]">
        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Qué es CobroFlow</h2>
          <p className="mt-2">
            CobroFlow es una herramienta para llevar el control de tus clientes, proyectos y cobros
            pendientes. Al usarla, aceptas estos términos junto con nuestra{" "}
            <a href="/privacidad" className="underline">Política de privacidad</a>.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Qué NO es ni hace CobroFlow</h2>
          <p className="mt-2">
            No es un sistema contable ni de facturación fiscal: no genera facturas electrónicas ni
            declaraciones de impuestos. No procesa los pagos de tus clientes — solo te ayuda a llevar
            el seguimiento de a quién le debes cobrar. Tus saldos y fechas de atraso se calculan con
            matemática exacta, nunca con inteligencia artificial.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Quién puede usar CobroFlow</h2>
          <p className="mt-2">
            Debes tener al menos 18 años y proporcionar información veraz al crear tu cuenta. Eres
            responsable de mantener segura tu contraseña y de toda la actividad que ocurra en tu
            cuenta.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Licencia de uso</h2>
          <p className="mt-2">
            Te damos una licencia personal, para el uso normal de tu propio negocio: llevar tus
            propios cobros, no para revender el acceso a la app ni para operarla en nombre de
            terceros que no sean tus clientes reales.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Tus datos y los análisis con IA</h2>
          <p className="mt-2">
            Los datos de clientes, proyectos y montos que registras son tuyos — puedes exportarlos o
            pedir que se eliminen cuando quieras (ver{" "}
            <a href="/privacidad" className="underline">Privacidad</a>). El análisis de negocio con
            IA (plan Premium) es una orientación generada solo para ti a partir de tus propios
            números — no es un producto que licenciamos ni compartimos con nadie más, y no
            reemplaza el criterio de un contador o asesor financiero. Ver el detalle en el{" "}
            <a href="/aviso-ia" className="underline">Aviso sobre el uso de IA</a>.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Planes y pagos</h2>
          <p className="mt-2">
            El plan Free es gratuito, permanente y no requiere tarjeta. Los planes Pro y Premium son
            suscripciones que se renuevan automáticamente cada mes y se cobran a través de Hotmart,
            nuestro procesador de pagos. El precio y lo que incluye cada plan se muestra antes de
            pagar, en el paywall y en la página de precios.
          </p>
          <p className="mt-2">
            Puedes cancelar tu suscripción cuando quieras, sin permanencia mínima ni penalización —
            ver cómo en{" "}
            <a href="/cancelacion-reembolsos" className="underline">Cancelación y reembolsos</a>. Al
            cancelar, conservas acceso al plan pago hasta el final del período ya pagado; después,
            tu cuenta pasa automáticamente al plan Free, sin borrar tus datos ya cargados.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Suspensión o cierre de cuentas</h2>
          <p className="mt-2">
            Podemos suspender o cerrar tu cuenta si detectamos un uso indebido (por ejemplo, intentar
            acceder a datos de otra cuenta, abusar del servicio de IA, o impago sostenido de tu
            suscripción). Te avisaremos por correo cuando sea posible antes de tomar esa medida.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Limitación de responsabilidad</h2>
          <p className="mt-2">
            CobroFlow se ofrece &quot;tal cual&quot;. Hacemos lo posible por mantener la app
            funcionando y tus cálculos correctos, pero no garantizamos que esté libre de errores en
            todo momento. En la medida que lo permita la ley, nuestra responsabilidad frente a ti se
            limita al monto que hayas pagado por tu suscripción en los últimos 12 meses. No somos
            responsables por decisiones de negocio que tomes basado en el análisis con IA — esa
            responsabilidad es tuya (ver el{" "}
            <a href="/aviso-ia" className="underline">Aviso de IA</a>).
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Ley aplicable</h2>
          <p className="mt-2">
            Estos términos se rigen por las leyes de Guatemala. Esto no te quita ningún derecho de
            protección al consumidor que te corresponda de forma obligatoria en el país donde vives.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Cambios a estos términos</h2>
          <p className="mt-2">
            Si actualizamos estos términos de forma importante, te avisaremos por correo antes de que
            entren en vigor.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Contacto</h2>
          <p className="mt-2">
            ¿Dudas sobre estos términos? Escríbenos a{" "}
            <a href="mailto:soporte@cobroflow.app" className="underline">
              soporte@cobroflow.app
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
