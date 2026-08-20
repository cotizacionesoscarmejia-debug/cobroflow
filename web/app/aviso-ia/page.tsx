export const metadata = { title: "Aviso de IA — CobroFlow" };

export default function AvisoIaPage() {
  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-16 text-[var(--text-primary)]">
      <a href="/" className="text-[14px] text-[var(--text-secondary)] hover:underline">
        ← Volver a CobroFlow
      </a>
      <h1 className="mt-6 text-[32px] font-bold [font-family:var(--font-display)]">
        Aviso sobre el uso de inteligencia artificial
      </h1>
      <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">
        Última actualización: 21 de agosto de 2026.
      </p>

      <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-[var(--text-secondary)]">
        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Dónde usamos IA</h2>
          <p className="mt-2">
            Solo en el plan Premium, y solo cuando tú lo activas: al presionar &quot;Analizar mi
            negocio&quot;, enviamos un resumen numérico de tu actividad (cuánto has cobrado, cuánto
            te deben, atrasos, gastos) al modelo de lenguaje Claude, de{" "}
            <strong className="text-[var(--text-primary)]">Anthropic</strong>, para que te devuelva
            una recomendación escrita. Nunca enviamos los nombres ni datos personales de tus
            clientes — solo cifras ya calculadas.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Qué NO hace la IA</h2>
          <p className="mt-2">
            Tus saldos, estados de pago y fechas de atraso siempre se calculan con matemática exacta,
            nunca con IA — la IA solo redacta un resumen a partir de esos números ya calculados.
            Tampoco toma decisiones automáticas sobre tu cuenta ni tus cobros, y no tiene acceso para
            modificar tus datos.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">
            Esto es orientación, no asesoría profesional
          </h2>
          <p className="mt-2">
            El análisis con IA puede generar información incorrecta, incompleta o que no aplique
            bien a tu situación particular — como cualquier modelo de lenguaje, puede equivocarse.{" "}
            <strong className="text-[var(--text-primary)]">
              No es asesoría financiera, contable, fiscal ni legal profesional
            </strong>
            , y no reemplaza el criterio de un contador o asesor calificado. Las decisiones sobre tu
            negocio son tuyas y bajo tu responsabilidad.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Dónde viajan tus datos</h2>
          <p className="mt-2">
            El resumen que se envía a Claude se procesa en los servidores de Anthropic, en Estados
            Unidos, bajo sus propios términos de servicio y medidas de seguridad. Guardamos un
            registro de cada análisis que generas (para que puedas volver a verlo sin gastar un
            análisis nuevo) — si eliminas tu cuenta, ese historial se elimina también. Ver el detalle
            completo en nuestra{" "}
            <a href="/privacidad" className="underline">Política de privacidad</a>.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Un límite mensual, a propósito</h2>
          <p className="mt-2">
            El plan Premium incluye hasta 10 análisis por mes. Es un límite técnico para mantener el
            servicio estable, no una restricción de contenido.
          </p>
        </section>
      </div>
    </main>
  );
}
