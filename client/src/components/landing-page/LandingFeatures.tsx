import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUp, Brain, FileText, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { tokens } from "./landing-tokens";
import { useIsMobile } from "@/hooks/use-mobile";

const mockupStates = [
    {
        label: "Resumo do caso",
        user: "Organize os pontos principais antes da consulta.",
        assistantTitle: "Contexto carregado",
        assistantText:
            "Sintomas persistentes, ferritina reduzida e histórico recente já reunidos em um único resumo para revisão rápida.",
        chips: ["Histórico clínico", "Exames recentes", "Paciente em atendimento"],
    },
    {
        label: "Hipóteses e próximos passos",
        user: "Quais pontos devo revisar agora com base nesse quadro?",
        assistantTitle: "Apoio ao raciocínio",
        assistantText:
            "O Vita Assist ajuda a estruturar hipóteses, destacar sinais de atenção e sugerir próximos passos para avaliação individual.",
        chips: ["Hipóteses clínicas", "Sinais de alerta", "Próximos exames"],
    },
    {
        label: "Rascunho clínico",
        user: "Monte um rascunho objetivo para evolução e orientação.",
        assistantTitle: "Texto pronto para lapidar",
        assistantText:
            "Transforma a conversa em rascunhos claros para evolução, resumo do atendimento e orientação ao paciente.",
        chips: ["Evolução clínica", "Orientação", "Texto mais objetivo"],
    },
];

const capabilities = [
    {
        icon: <Brain className="w-4 h-4" />,
        title: "Entende o contexto do caso",
        description: "Histórico, exames e conversa ativa reunidos no mesmo fluxo.",
    },
    {
        icon: <Sparkles className="w-4 h-4" />,
        title: "Ajuda a pensar mais rápido",
        description: "Organiza hipóteses, dúvidas e próximos passos sem tirar o paciente do centro.",
    },
    {
        icon: <FileText className="w-4 h-4" />,
        title: "Acelera a documentação",
        description: "Gera rascunhos claros para evolução e orientação clínica.",
    },
];

export function LandingFeatures() {
    const [activeState, setActiveState] = useState(0);
    const isMobile = useIsMobile();
    const stableMobileMotion = isMobile;

    useEffect(() => {
        if (stableMobileMotion) {
            setActiveState(0);
            return;
        }

        const timer = setInterval(() => {
            setActiveState((current) => (current + 1) % mockupStates.length);
        }, 3200);

        return () => clearInterval(timer);
    }, [stableMobileMotion]);

    const currentState = mockupStates[activeState];

    return (
        <section
            id="recursos"
            aria-labelledby="recursos-heading"
            className={`${tokens.section.dark} ${tokens.section.paddingFull} relative overflow-hidden`}
        >
            <div className="absolute inset-0 pointer-events-none hidden md:block">
                <div className="absolute left-[10%] top-16 w-72 h-72 rounded-full bg-white/[0.04] blur-[120px]" />
                <div className="absolute right-[8%] bottom-12 w-80 h-80 rounded-full bg-white/[0.03] blur-[140px]" />
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-14">
                    <motion.div
                        className="lg:w-[42%] w-full max-w-md lg:max-w-none"
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-120px" }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <span className={tokens.eyebrow.lineDark} />
                            <span className={tokens.eyebrow.dark}>Assistente clínico contextual</span>
                        </div>

                        <h2 id="recursos-heading" className={`${tokens.h2.dark} mb-6`}>
                            Vita Assist <br />
                            <span className={tokens.h2.splitDark}>na rotina do atendimento.</span>
                        </h2>

                        <p className={`${tokens.body.dark} max-w-xl`}>
                            Um assistente clínico dentro da plataforma, com contexto do paciente, chat contínuo e apoio
                            para resumir, organizar e documentar melhor cada consulta.
                        </p>

                        <div className="mt-6 grid grid-cols-1 gap-3 md:hidden">
                            {capabilities.map((item) => (
                                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">{item.title}</p>
                                    <p className="mt-2 text-sm leading-relaxed text-white/60">{item.description}</p>
                                </div>
                            ))}
                        </div>

                        <div className="hidden md:block mt-7 space-y-4">
                            {capabilities.map((item, index) => (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-120px" }}
                                    transition={{ duration: 0.4, delay: 0.08 * index }}
                                    className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                                >
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-black">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">{item.title}</h3>
                                        <p className="mt-1 text-sm leading-relaxed text-white/55">{item.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-10 md:mt-12">
                            <Link href="/auth?next=%2Fvita-assist">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="border border-white/30 text-white hover:bg-white hover:text-black w-full sm:w-auto px-6 py-4 text-sm rounded-lg transition-all"
                                >
                                    Abrir Vita Assist <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        className="lg:w-[58%] w-full"
                        initial={{ opacity: 0, y: 22 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-120px" }}
                        transition={{ duration: 0.55, delay: 0.08 }}
                    >
                        <div className="relative max-w-[560px] mx-auto">
                            <div className="absolute -inset-2 rounded-[32px] bg-white/[0.05] blur-2xl opacity-60" />

                            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
                                <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-4 sm:px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                                            <Sparkles className="w-5 h-5 text-white/80" />
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-white">Vita Assist</p>
                                            <p className="text-sm text-white/60">Chat clínico contextual dentro da plataforma</p>
                                        </div>
                                    </div>

                                    <div
                                        className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white"
                                        style={{ color: "#D7D7D7" }}
                                    >
                                        <MessageSquare className="w-3 h-3" />
                                        Atendimento ativo
                                    </div>
                                </div>

                                <div className="min-h-[320px] md:min-h-[360px] flex flex-col">
                                    <div className="hidden md:block border-b border-white/10 px-4 py-4 sm:px-6">
                                        <div className="mb-3">
                                            <p className="text-sm font-semibold text-white">Conversa ativa com o paciente em atendimento</p>
                                            <p className="mt-1 text-xs text-white/50">
                                                O Vita Assist entende o contexto clínico, responde no chat e ajuda a estruturar a próxima ação.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
                                                <Sparkles className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-semibold text-white">Dor abdominal persistente</p>
                                                <p className="text-[11px] text-white/45">Assistente acompanhando o caso em tempo real</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="hidden md:block border-b border-white/10 px-4 py-3 sm:px-6">
                                            <div className="flex flex-wrap gap-2">
                                                <AnimatePresence mode="wait">
                                                    <motion.div
                                                        key={currentState.label}
                                                        initial={{ opacity: 0, y: 6 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -6 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="flex flex-wrap gap-2"
                                                    >
                                                        {currentState.chips.map((chip) => (
                                                            <span
                                                                key={chip}
                                                                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white"
                                                                style={{ color: "#E5E5E5" }}
                                                            >
                                                                {chip}
                                                            </span>
                                                        ))}
                                                    </motion.div>
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-5 p-4 sm:p-6 min-h-[240px] md:min-h-0">
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={`user-${activeState}`}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={stableMobileMotion ? { duration: 0 } : { duration: 0.25 }}
                                                    className="ml-auto w-fit max-w-[78%] rounded-[20px] rounded-br-md bg-white px-4 py-3 text-sm text-black shadow-[0_10px_24px_rgba(255,255,255,0.06)] min-h-[68px] md:min-h-0"
                                                >
                                                    {currentState.user}
                                                </motion.div>
                                            </AnimatePresence>

                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={`assistant-${activeState}`}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={stableMobileMotion ? { duration: 0 } : { duration: 0.28 }}
                                                    className="max-w-[94%] rounded-[22px] rounded-bl-md border border-white/10 bg-white/[0.04] px-4 py-4 text-white min-h-[150px] md:min-h-0"
                                                >
                                                    <div className="mb-3 flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-[0_8px_20px_rgba(255,255,255,0.08)]">
                                                            <Sparkles className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white">Vita Assist</p>
                                                            <p
                                                                className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70"
                                                                style={{ color: "#BDBDBD" }}
                                                            >
                                                                {currentState.label}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70" style={{ color: "#B0B0B0" }}>
                                                            {currentState.assistantTitle}
                                                        </p>
                                                        <p className="mt-2 text-[15px] leading-relaxed text-white/82">
                                                            {currentState.assistantText}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            </AnimatePresence>
                                        </div>

                                        <div className="border-t border-white/10 px-4 py-4 sm:px-6">
                                            <div className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-[#161616] px-4 py-3">
                                                <p className="flex-1 text-sm text-white" style={{ color: "#D8D8D8" }}>
                                                    Pergunte sobre o caso, peça um resumo ou monte um rascunho clínico.
                                                </p>
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
                                                    <ArrowUp className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
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
