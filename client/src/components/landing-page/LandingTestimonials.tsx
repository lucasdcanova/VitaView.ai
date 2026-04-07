import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "O que mais pesou pra mim foi parar de caçar exame em PDF. Parece detalhe, mas no retorno isso muda tudo. Hoje eu abro o prontuário e consigo retomar o caso bem mais rápido.",
    name: "Dra. Isabela Moura",
    role: "Endocrinologista",
    context: "Consultório próprio",
    usage: "usa há 7 meses",
    initials: "IM",
    accent: "#E7E7E7",
    metric: "Chego no retorno com os últimos exames e pendências mais fáceis de localizar.",
    surfaceClassName: "bg-white/[0.07] hover:bg-white/[0.095]",
    quoteClassName: "md:min-h-[6.7rem]",
  },
  {
    quote:
      "Uso no ambulatório há quase 1 ano, com retorno em cima de retorno. Antes eu me perdia fácil entre histórico, prescrição e o último exame que importava. Agora consigo revisar tudo na mesma tela e a consulta fica mais objetiva, sem aquela sensação de estar correndo atrás da informação.",
    name: "Dr. André Nogueira",
    role: "Cardiologista",
    context: "Ambulatório de alto volume",
    usage: "usa há 11 meses",
    initials: "AN",
    accent: "#DCDCDC",
    metric: "A revisão pré-consulta ficou mais estável, principalmente nos dias com agenda apertada.",
    surfaceClassName: "bg-white/[0.09] hover:bg-white/[0.11]",
    quoteClassName: "md:min-h-[8.9rem]",
  },
  {
    quote:
      "No começo achei que seria só mais um sistema bonito. Não foi isso. Na clínica a gente atende bastante volume e cada médico acaba registrando de um jeito; mesmo assim o VitaView entrou sem muito atrito. O que ajudou de verdade foi concentrar histórico, exames e documentos no mesmo fluxo. Parece simples, mas evita retrabalho o dia inteiro.",
    name: "Dra. Renata Paes",
    role: "Clínica médica",
    context: "Clínica com 3 profissionais",
    usage: "usa há 8 meses",
    initials: "RP",
    accent: "#D1D1D1",
    metric: "A equipe passou a revisar o caso no mesmo contexto, sem abrir várias telas para montar a consulta.",
    surfaceClassName: "bg-white/[0.065] hover:bg-white/[0.09]",
    quoteClassName: "md:min-h-[10.4rem]",
  },
];

const stats = [
  { value: "Retomada do caso", label: "menos tempo procurando histórico e exames antes da consulta" },
  { value: "Revisão mais direta", label: "prescrição, documentos e últimas condutas no mesmo fluxo" },
  { value: "Adoção sem atrito", label: "entrada gradual na rotina, inclusive em clínica com equipe" },
];

export function LandingTestimonials() {
  return (
    <section
      id="depoimentos"
      className="relative overflow-hidden py-10 scroll-mt-16 md:py-20 md:min-h-[100dvh] flex flex-col justify-center"
    >
      <div className="absolute inset-0 bg-[#111111]" />
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="absolute right-[6%] top-12 h-72 w-72 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute bottom-0 left-[4%] h-64 w-64 rounded-full bg-[#7A7A7A]/10 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-6 max-w-4xl text-center md:mb-7"
        >
          <div
            className="inline-flex items-center gap-3 text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.24em] !text-white/55"
            style={{ color: "rgba(255,255,255,0.62)" }}
          >
            <span aria-hidden="true" className="h-px w-8 md:w-12 bg-gradient-to-r from-transparent to-white/45" />
            <span>Relatos de uso em rotina real</span>
            <span aria-hidden="true" className="h-px w-8 md:w-12 bg-gradient-to-l from-transparent to-white/45" />
          </div>
          <h2
            className="mt-3 text-2xl font-heading font-semibold leading-[1.06] tracking-tight !text-[#F5F5F5] md:text-[2.3rem] lg:text-[2.7rem]"
            style={{ color: "#F5F5F5" }}
          >
            Quem usa no{" "}
            <span
              className="font-normal !text-[#A8A8A8]"
              style={{ color: "#A8A8A8" }}
            >
              dia a dia.
            </span>
          </h2>
          <p
            className="mx-auto mt-3 max-w-2xl font-body text-[13px] leading-relaxed !text-[#B0B0B0] md:text-[14px]"
            style={{ color: "#B0B0B0" }}
          >
            Relatos diretos de médicos que já colocaram o VitaView entre retorno,
            revisão de exames e acompanhamento contínuo.
          </p>
        </motion.div>

        <div className="grid gap-3 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.article
              key={testimonial.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              whileHover={{ y: -6 }}
              className={`group relative overflow-hidden rounded-[28px] border border-white/12 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] transition-shadow duration-300 hover:shadow-[0_24px_70px_rgba(0,0,0,0.34)] ${testimonial.surfaceClassName}`}
            >
              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ background: `linear-gradient(90deg, ${testimonial.accent}, transparent)` }}
              />

              <div className="mb-4 flex items-start justify-between gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-[11px] font-semibold text-[#111111] shadow-[0_8px_24px_rgba(255,255,255,0.12)]"
                  style={{ backgroundColor: testimonial.accent }}
                >
                  {testimonial.initials}
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  <span
                    className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] !text-[#C8C8C8]"
                    style={{ color: "#D0D0D0" }}
                  >
                    {testimonial.context}
                  </span>
                  <span
                    className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] !text-[#AFAFAF]"
                    style={{ color: "#B8B8B8" }}
                  >
                    {testimonial.usage}
                  </span>
                </div>
              </div>

              <p
                className={`text-[13px] leading-5 !text-white/92 ${testimonial.quoteClassName}`}
                style={{ color: "#FFFFFF" }}
              >
                "{testimonial.quote}"
              </p>

              <div className="mt-4 border-t border-white/10 pt-3.5">
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.14em] !text-[#B5B5B5]"
                  style={{ color: "#B5B5B5" }}
                >
                  o que mudou na prática
                </p>
                <p
                  className="mt-1.5 text-[12px] font-medium leading-5 !text-[#E1E1E1]"
                  style={{ color: "#E1E1E1" }}
                >
                  {testimonial.metric}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <h3
                    className="text-[14px] font-semibold !text-[#FAFAFA]"
                    style={{ color: "#FAFAFA" }}
                  >
                    {testimonial.name}
                  </h3>
                  <p
                    className="text-[12px] !text-[#C3C3C3]"
                    style={{ color: "#C3C3C3" }}
                  >
                    {testimonial.role}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-[12px] font-medium !text-[#F5F5F5]"
                    style={{ color: "#F5F5F5" }}
                  >
                    Uso real no dia a dia
                  </p>
                  <p
                    className="text-[10px] !text-[#B5B5B5]"
                    style={{ color: "#B5B5B5" }}
                  >
                    rotina ativa de atendimento
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="mx-auto mt-6 grid max-w-5xl gap-px overflow-hidden rounded-[28px] border border-white/12 bg-white/12 md:mt-7 md:grid-cols-3"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white/[0.08] px-6 py-5 text-center backdrop-blur-sm md:px-8">
              <p
                className="text-[26px] font-heading font-semibold tracking-tight !text-[#FAFAFA] md:text-[1.8rem]"
                style={{ color: "#FAFAFA" }}
              >
                {stat.value}
              </p>
              <p
                className="mt-1 text-[12px] !text-[#C0C0C0]"
                style={{ color: "#C0C0C0" }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
