import { motion } from "framer-motion";
import { ClipboardList, Plus, FlaskConical, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

export function LandingExamProtocols() {
    const protocolItems = [
        { name: "Hemograma Completo", tag: "Base" },
        { name: "Ferritina", tag: "Anemia" },
        { name: "Vitamina B12", tag: "Deficiência" },
        { name: "TSH + T4 Livre", tag: "Tireoide" },
    ];

    const benefits = [
        {
            icon: <ClipboardList className="w-5 h-5" />,
            title: "Protocolos personalizados",
            desc: "Monte combinações por objetivo clínico, especialidade ou perfil de atendimento."
        },
        {
            icon: <Plus className="w-5 h-5" />,
            title: "Solicitação mais rápida",
            desc: "Adicione exames recorrentes em poucos cliques, sem reconstruir o pedido do zero."
        },
        {
            icon: <ShieldCheck className="w-5 h-5" />,
            title: "Mais clareza na solicitação",
            desc: "Organize pedidos frequentes com mais consistência documental, sem perder a individualização de cada caso."
        }
    ];

    return (
        <section
            id="protocolos-exames"
            className="py-12 md:py-20 bg-[#0A0A0A] relative overflow-hidden text-white min-h-[100dvh] flex flex-col justify-center"
        >
            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
                <div className="absolute top-16 left-[8%] w-72 h-72 bg-white/5 rounded-full blur-[100px] opacity-20" />
                <div className="absolute bottom-10 right-[10%] w-80 h-80 bg-white/5 rounded-full blur-[120px] opacity-20" />
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
                    <motion.div
                        className="lg:w-1/2"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="mb-4 inline-flex items-center gap-3 text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                            <span aria-hidden="true" className="h-px w-8 md:w-12 bg-gradient-to-r from-transparent to-white/45" />
                            <FlaskConical className="w-3.5 h-3.5 text-white/70" />
                            <span>Protocolos para pedidos recorrentes</span>
                            <span aria-hidden="true" className="h-px w-8 md:w-12 bg-gradient-to-l from-transparent to-white/45" />
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white leading-[1.1] mb-5 tracking-tight">
                            Exames laboratoriais <br />
                            <span className="text-white/45">sem retrabalho.</span>
                        </h2>

                        <p className="text-base md:text-lg text-white/65 leading-relaxed mb-8 max-w-xl">
                            Crie protocolos personalizados para os cenários que mais se repetem na sua rotina
                            e transforme a solicitação de exames em um fluxo rápido, organizado e seguro.
                        </p>

                        <div className="space-y-5">
                            {benefits.map((benefit, index) => (
                                <motion.div
                                    key={benefit.title}
                                    className="flex items-start gap-4"
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 + (index * 0.1) }}
                                >
                                    <div
                                        className={`p-2 rounded-xl border ${
                                            index === 0
                                                ? "bg-[#7BE0C3]/10 text-[#7BE0C3] border-[#7BE0C3]/20"
                                                : "bg-white/6 text-white border-white/10"
                                        }`}
                                    >
                                        {benefit.icon}
                                    </div>
                                    <div>
                                        <h4
                                            className={`font-bold text-lg ${
                                                index === 0
                                                    ? "text-[#7BE0C3] underline decoration-[#7BE0C3]/40 underline-offset-4 decoration-1"
                                                    : "text-white"
                                            }`}
                                        >
                                            {benefit.title}
                                        </h4>
                                        <p className="text-sm text-white/55 leading-relaxed">{benefit.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        className="lg:w-1/2 w-full"
                        initial={{ opacity: 0, x: 20, scale: 0.97 }}
                        whileInView={{ opacity: 1, x: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.55, delay: 0.15 }}
                    >
                        <div className="relative max-w-[460px] mx-auto">
                            <div className="absolute -inset-1 bg-white/10 rounded-[28px] blur-2xl opacity-30" />

                            <div className="relative rounded-[28px] border border-white/10 bg-[#111111] shadow-2xl overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.03]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
                                            <ClipboardList className="w-5 h-5 text-white/80" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">Protocolos de Exames</h3>
                                            <p className="text-[11px] text-white/45">Solicitação laboratorial personalizada</p>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                                        ativo
                                    </div>
                                </div>

                                <div className="p-5 sm:p-6 space-y-4">
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                                                    protocolo salvo
                                                </p>
                                                <h4 className="mt-2 text-lg font-bold text-white">
                                                    Check-up Metabólico Completo
                                                </h4>
                                                <p className="mt-1 text-sm text-white/50">
                                                    Pronto para reutilizar em consultas de acompanhamento e primeira avaliação.
                                                </p>
                                            </div>
                                            <div className="rounded-full border border-[#7BE0C3]/20 bg-[#7BE0C3]/12 text-[#7BE0C3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
                                                Modelo
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {protocolItems.map((item, index) => (
                                            <motion.div
                                                key={item.name}
                                                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3"
                                                initial={{ opacity: 0, y: 8 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.25 + (index * 0.08) }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center">
                                                        <CheckCircle2 className="w-4 h-4 text-white/75" />
                                                    </div>
                                                    <span className="text-sm font-medium text-white/88">{item.name}</span>
                                                </div>
                                                <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                                                    {item.tag}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                                                ação
                                            </p>
                                            <p className="mt-2 text-sm font-medium text-white/85">
                                                Aplicar protocolo inteiro em um clique
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                                                resultado
                                            </p>
                                            <p className="mt-2 text-sm font-medium text-white/85">
                                                Pedido mais rápido, claro e fácil de revisar
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-[#161616] px-4 py-3 flex items-start gap-3">
                                        <Sparkles className="w-4 h-4 text-white mt-0.5 shrink-0" />
                                        <p className="text-xs leading-relaxed text-white/55">
                                            Protocolos podem refletir sua forma de solicitar exames por hipótese, especialidade
                                            ou linha de cuidado, reduzindo repetição manual ao longo do dia.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
