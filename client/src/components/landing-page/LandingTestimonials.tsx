import { motion } from "framer-motion";
import { tokens } from "./landing-tokens";

const testimonials = [
  {
    quote:
      "O que mais pesou pra mim foi parar de caçar exame em PDF. Parece detalhe, mas no retorno isso muda tudo. Hoje eu abro o prontuário e consigo retomar o caso bem mais rápido.",
    name: "Dra. Isabela Moura",
    role: "Endocrinologista",
    context: "Consultório próprio",
    usage: "usa há 7 meses",
    initials: "IM",
    metric: "Chego no retorno com os últimos exames e pendências mais fáceis de localizar.",
  },
  {
    quote:
      "Uso no ambulatório há quase 1 ano, com retorno em cima de retorno. Antes eu me perdia fácil entre histórico, prescrição e o último exame que importava. Agora consigo revisar tudo na mesma tela e a consulta fica mais objetiva, sem aquela sensação de estar correndo atrás da informação.",
    name: "Dr. André Nogueira",
    role: "Cardiologista",
    context: "Ambulatório de alto volume",
    usage: "usa há 11 meses",
    initials: "AN",
    metric: "A revisão pré-consulta ficou mais estável, principalmente nos dias com agenda apertada.",
  },
  {
    quote:
      "No começo achei que seria só mais um sistema bonito. Não foi isso. Na clínica a gente atende bastante volume e cada médico acaba registrando de um jeito; mesmo assim o VitaView entrou sem muito atrito. O que ajudou de verdade foi concentrar histórico, exames e documentos no mesmo fluxo. Parece simples, mas evita retrabalho o dia inteiro.",
    name: "Dra. Renata Paes",
    role: "Clínica médica",
    context: "Clínica com 3 profissionais",
    usage: "usa há 8 meses",
    initials: "RP",
    metric: "A equipe passou a revisar o caso no mesmo contexto, sem abrir várias telas para montar a consulta.",
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
      aria-labelledby="depoimentos-heading"
      className={`relative overflow-hidden ${tokens.section.darkAlt} ${tokens.section.paddingFull} scroll-mt-16`}
    >
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="absolute right-[6%] top-12 h-72 w-72 rounded-full bg-white/[0.06] blur-3xl" />
        <div className="absolute bottom-0 left-[4%] h-64 w-64 rounded-full bg-white/[0.04] blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-12 max-w-4xl text-center md:mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className={tokens.eyebrow.lineDark} />
            <span className={tokens.eyebrow.dark}>Relatos de uso em rotina real</span>
            <span className={tokens.eyebrow.lineDark} />
          </div>
          <h2 id="depoimentos-heading" className={`${tokens.h2.dark} mb-6`}>
            Quem usa no{" "}
            <span className={tokens.h2.splitDark}>dia a dia.</span>
          </h2>
          <p className={`${tokens.body.dark} mx-auto max-w-2xl`}>
            Relatos diretos de médicos que já colocaram o VitaView entre retorno,
            revisão de exames e acompanhamento contínuo.
          </p>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.article
              key={testimonial.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.04] p-6 md:p-7 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/20"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white text-[12px] font-heading font-bold text-[#111111]">
                  {testimonial.initials}
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/60">
                    {testimonial.context}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    {testimonial.usage}
                  </span>
                </div>
              </div>

              <p className="font-body text-[14px] leading-relaxed text-white/90">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  o que mudou na prática
                </p>
                <p className="mt-2 font-body text-[13px] leading-relaxed text-white/75">
                  {testimonial.metric}
                </p>
              </div>

              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <h3 className="font-heading text-[14px] font-bold text-white tracking-tight">
                    {testimonial.name}
                  </h3>
                  <p className="font-body text-[12px] text-white/55">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-8 grid max-w-5xl gap-px overflow-hidden rounded-[20px] border border-white/10 bg-white/10 md:mt-10 md:grid-cols-3"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[#111111] px-6 py-7 text-center md:px-8">
              <p className="font-heading text-[22px] font-bold tracking-tight text-white md:text-[1.6rem]">
                {stat.value}
              </p>
              <p className="mt-2 font-body text-[13px] text-white/55 leading-relaxed">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
