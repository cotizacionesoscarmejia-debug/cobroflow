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
        Última actualización: 21 de agosto de 2026.
      </p>

      <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-[var(--text-secondary)]">
        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Quién es responsable de tus datos</h2>
          <p className="mt-2">
            CobroFlow es operado por Oscar Mejía, persona física, con domicilio en Guatemala. Para
            cualquier duda sobre tus datos personales o esta política, escribe a{" "}
            <a href="mailto:soporte@cobroflow.app" className="underline">
              soporte@cobroflow.app
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Qué datos recopilamos</h2>
          <p className="mt-2">Recopilamos solo lo necesario para que la app funcione:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Tu nombre, apellido y correo electrónico, al crear tu cuenta.</li>
            <li>Tu contraseña — nunca la vemos en texto plano: la guarda cifrada nuestro proveedor de autenticación (Supabase).</li>
            <li>
              Los datos de negocio que tú mismo cargas: nombres de clientes, proyectos, montos, fechas
              de pago y gastos que registras dentro de la app.
            </li>
            <li>
              Datos técnicos básicos de uso (ej. cuándo iniciaste sesión) para mantener tu cuenta
              segura y diagnosticar errores.
            </li>
          </ul>
          <p className="mt-2">
            <strong className="text-[var(--text-primary)]">Nunca guardamos los datos de tu tarjeta</strong> — el
            pago de tu suscripción lo procesa Hotmart directamente, nunca pasa por nuestros servidores.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Con qué base legal tratamos tus datos</h2>
          <p className="mt-2">
            Con tu consentimiento, que nos das al marcar la casilla de aceptación al crear tu cuenta, y
            porque tratar estos datos es necesario para poder darte el servicio que contrataste
            (llevar el control de tus cobros).
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Cómo usamos tus datos</h2>
          <p className="mt-2">
            Para hacer funcionar la app (calcular tus saldos, mostrarte tu Panel principal, mandarte
            los correos que tú pides — confirmación de cuenta, recuperación de contraseña) y, solo si
            tienes el plan Premium y tú mismo lo activas, para generar el análisis de tu negocio con
            inteligencia artificial.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Con quién compartimos tus datos</h2>
          <p className="mt-2">
            Nunca vendemos tus datos ni los de tus clientes, y nunca los compartimos con otros
            usuarios de CobroFlow. Sí trabajamos con estos proveedores, cada uno con una función
            específica y necesaria para operar la app:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <strong className="text-[var(--text-primary)]">Supabase</strong> (Estados Unidos) — guarda tu cuenta,
              tu contraseña cifrada y los datos de negocio que registras.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Vercel</strong> (Estados Unidos) — aloja y sirve la
              aplicación web que estás usando.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Resend</strong> — envía los correos que tú generas
              (confirmar tu cuenta, recuperar tu contraseña).
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Hotmart</strong> (Brasil) — procesa el pago de tu
              suscripción Pro o Premium. Nosotros nunca vemos ni guardamos los datos de tu tarjeta.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Anthropic (Claude)</strong> (Estados Unidos) — SOLO si
              tienes el plan Premium y presionas &quot;Analizar mi negocio&quot;: recibe un resumen
              numérico de tu actividad (cuánto cobraste, cuánto te deben, atrasos, gastos) para
              devolverte una recomendación escrita. Nunca le enviamos los nombres ni datos personales
              de tus clientes.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Transferencia internacional de datos</h2>
          <p className="mt-2">
            Como los proveedores de arriba operan desde Estados Unidos y Brasil, tus datos viajan
            fuera de tu país para que la app funcione. Cada proveedor procesa esos datos bajo sus
            propios términos de servicio y medidas de seguridad — puedes revisarlos en sus sitios
            (supabase.com, vercel.com, resend.com, hotmart.com, anthropic.com). Al aceptar esta
            política, aceptas también esa transferencia.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Cookies</h2>
          <p className="mt-2">
            Usamos únicamente cookies esenciales de sesión (para mantenerte con la sesión iniciada,
            provistas por nuestro proveedor de autenticación). Hoy CobroFlow no usa cookies de
            publicidad ni de rastreo de terceros. Si eso cambia en el futuro, actualizaremos esta
            página y te lo avisaremos antes de activarlas.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Tus derechos sobre tus datos</h2>
          <p className="mt-2">
            Sin importar el país de LATAM desde el que uses CobroFlow, tienes derecho a acceder,
            corregir, eliminar y pedir una copia de tus datos personales. Para ejercer cualquiera de
            estos derechos, o para eliminar tu cuenta por completo (incluyendo el historial que le
            enviaste a la IA), escríbenos a{" "}
            <a href="mailto:soporte@cobroflow.app" className="underline">
              soporte@cobroflow.app
            </a>{" "}
            desde el correo de tu cuenta — lo resolvemos directamente, sin pasos adicionales.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Menores de edad</h2>
          <p className="mt-2">
            CobroFlow es una herramienta de negocio y está pensada para mayores de 18 años. No
            recopilamos intencionalmente datos de menores de edad.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Cambios a esta política</h2>
          <p className="mt-2">
            Si hacemos un cambio importante a esta política, se lo avisaremos por correo a los
            usuarios con cuenta activa antes de que entre en vigor, además de actualizar la fecha de
            arriba.
          </p>
        </section>
      </div>
    </main>
  );
}
