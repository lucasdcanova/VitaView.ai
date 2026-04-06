import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "Antes eu precisava abrir vários PDFs e cruzar tudo manualmente. Hoje entro no prontuário e já encontro a evolução organizada. Isso reduziu muito o tempo de preparo antes da consulta.",
    name: "Dra. Mariana Tavares",
    role: "Endocrinologista",
    context: "Consultório particular",
    initials: "MT",
    accent: "#E7E7E7",
    metric: "Menos tempo entre exames e decisão clínica",
  },
  {
    quote:
      "O que mais me ganhou foi a clareza. Em retornos rápidos, consigo revisar histórico, prescrição e exames sem quebrar o fluxo. A consulta fica mais objetiva e o paciente percebe isso.",
    name: "Dr. Felipe Azevedo",
    role: "Cardiologista",
    context: "Rotina ambulatorial intensa",
    initials: "FA",
    accent: "#D8D8D8",
    metric: "Mais fluidez durante atendimentos consecutivos",
  },
  {
    quote:
      "A plataforma não parece um sistema genérico adaptado para saúde. Ela acompanha a rotina real do consultório. Registro, revisão e acompanhamento ficaram no mesmo lugar, de forma muito mais natural.",
    name: "Dra. Camila Rocha",
    role: "Clínica Geral",
    context: "Equipe multidisciplinar",
    initials: "CR",
    accent: "#C9C9C9",
    metric: "Adoção rápida pela equipe desde a primeira semana",
  },
];

const stats = [
  { value: "4.9/5", label: "avaliação média" },
  { value: "10 mil+", label: "profissionais impactados" },
  { value: "500 mil+", label: "exames organizados na plataforma" },
];

export function LandingTestimonials() {
  return (
    <section
      id="depoimentos"
      className="relative overflow-hidden py-12 scroll-mt-16 md:py-20 min-h-[100dvh] flex flex-col justify-center"
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
          <span
            className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] !text-white/65"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Depoimentos
          </span>
          <h2
            className="mt-3 text-2xl font-heading font-semibold leading-[1.06] tracking-tight !text-[#F5F5F5] md:text-[2.3rem] lg:text-[2.7rem]"
            style={{ color: "#F5F5F5" }}
          >
            O Que Dizem Nossos{" "}
            <span
              className="font-normal !text-[#A8A8A8]"
              style={{ color: "#A8A8A8" }}
            >
              Usuários
            </span>
          </h2>
          <p
            className="mx-auto mt-3 max-w-2xl font-body text-[13px] leading-relaxed !text-[#B0B0B0] md:text-[14px]"
            style={{ color: "#B0B0B0" }}
          >
            Relatos de profissionais que adotaram o VitaView AI na rotina e passaram a conduzir
            consultas, acompanhamento e revisão de exames com mais clareza.
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
              className="group relative overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.08] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] transition-shadow duration-300 hover:bg-white/[0.1] hover:shadow-[0_24px_70px_rgba(0,0,0,0.34)]"
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
                <span
                  className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] !text-[#C8C8C8]"
                  style={{ color: "#D0D0D0" }}
                >
                  {testimonial.context}
                </span>
              </div>

              <p
                className="min-h-[7.5rem] text-[13px] leading-5 !text-white/92 md:min-h-[8.5rem]"
                style={{ color: "#FFFFFF" }}
              >
                "{testimonial.quote}"
              </p>

              <div className="mt-4 border-t border-white/10 pt-3.5">
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.14em] !text-[#B5B5B5]"
                  style={{ color: "#B5B5B5" }}
                >
                  impacto percebido
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
                    Verificado
                  </p>
                  <p
                    className="text-[10px] !text-[#B5B5B5]"
                    style={{ color: "#B5B5B5" }}
                  >
                    uso em rotina clínica
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
