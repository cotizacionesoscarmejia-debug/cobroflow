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
        Borrador — pendiente de revisión legal completa antes del lanzamiento comercial.
      </p>

      <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-[var(--text-secondary)]">
        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Dónde usamos IA</h2>
          <p className="mt-2">
            Solo en el plan Premium, y solo cuando tú lo activas: al presionar &quot;Analizar mi
            negocio&quot;, enviamos un resumen numérico de tu actividad (ingresos, pendiente,
            atrasos, gasto) a un modelo de lenguaje para que te devuelva una recomendación
            escrita. Nunca enviamos los datos personales de tus clientes.
          </p>
        </section>
        <section>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Qué NO hace la IA</h2>
          <p className="mt-2">
            Tus saldos, estados de pago y fechas de atraso siempre se calculan con matemática
            exacta, nunca con IA — la IA solo redacta un resumen a partir de esos números ya
            calculados. Tampoco toma decisiones automáticas sobre tu cuenta ni tus cobros.
          </p>
        </section>
      </div>
    </main>
  );
}
