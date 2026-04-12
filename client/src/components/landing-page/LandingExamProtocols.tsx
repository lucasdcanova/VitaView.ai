import { motion } from "framer-motion";
import { ClipboardList, Plus, FlaskConical, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { tokens } from "./landing-tokens";

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
            aria-labelledby="protocolos-exames-heading"
            className={`${tokens.section.dark} ${tokens.section.paddingFull} relative overflow-hidden text-white`}
        >
            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
                <div className="absolute top-16 left-[8%] w-72 h-72 bg-white/5 rounded-full blur-[100px] opacity-20" />
                <div className="absolute bottom-10 right-[10%] w-80 h-80 bg-white/5 rounded-full blur-[120px] opacity-20" />
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-24">
                    <motion.div
                        className="lg:w-1/2 w-full max-w-md lg:max-w-none"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <span className={tokens.eyebrow.lineDark} />
                            <span className={tokens.eyebrow.dark}>Protocolos para pedidos recorrentes</span>
                        </div>

                        <h2 id="protocolos-exames-heading" className={`${tokens.h2.dark} mb-6`}>
                            Exames laboratoriais <br />
                            <span className={tokens.h2.splitDark}>sem retrabalho.</span>
                        </h2>

                        <p className={`${tokens.body.dark} max-w-xl mb-10`}>
                            Crie protocolos personalizados para os cenários que mais se repetem na sua rotina
                            e transforme a solicitação de exames em um fluxo rápido, organizado e seguro.
                        </p>

                        <div className="grid grid-cols-1 gap-3 md:hidden">
                            {benefits.map((benefit) => (
                                <div key={benefit.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">{benefit.title}</p>
                                    <p className="mt-2 text-sm text-white/65 leading-relaxed">{benefit.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="hidden md:block space-y-5">
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
                                                ? "bg-white text-[#0A0A0A] border-white"
                                                : "bg-white/[0.04] text-white border-white/10"
                                        }`}
                                    >
                                        {benefit.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-heading font-bold text-[17px] text-white tracking-tight">
                                            {benefit.title}
                                        </h3>
                                        <p className="mt-1 text-[14px] text-white/55 leading-relaxed">{benefit.desc}</p>
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
                        <div className="relative max-w-[420px] md:max-w-[460px] mx-auto">
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
                                            <div className="rounded-full border border-white/20 bg-white/10 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
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

                                    <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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

                                    <div className="hidden md:flex rounded-2xl border border-white/10 bg-[#161616] px-4 py-3 items-start gap-3">
                                        <Sparkles className="w-4 h-4 text-white mt-0.5 shrink-0" />
                                        <p className="text-[11px] sm:text-xs leading-relaxed text-white/55">
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
