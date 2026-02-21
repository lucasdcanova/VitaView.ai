import { motion, useInView, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import { LineChart, ArrowRight } from "lucide-react";
import { useRef } from "react";

type TrendBarProps = {
    delay: number;
    isActive: boolean;
    prefersReducedMotion: boolean;
    tone: "soft" | "solid";
    value: string;
    width: `${number}%` | string;
};

function TrendBar({ delay, isActive, prefersReducedMotion, tone, value, width }: TrendBarProps) {
    const barClasses = tone === "solid"
        ? "bg-white text-black"
        : "bg-white/30 text-white";

    return (
        <div className="flex-1 bg-white/10 rounded-full h-6 relative overflow-hidden">
            <motion.div
                className={`${barClasses} h-full rounded-full flex items-center justify-end pr-2 relative overflow-hidden`}
                initial={prefersReducedMotion ? false : { width: 0, opacity: 0.86, filter: "blur(1.5px)" }}
                animate={isActive ? { width, opacity: 1, filter: "blur(0px)" } : { width: 0, opacity: 0.86, filter: "blur(1.5px)" }}
                transition={
                    prefersReducedMotion
                        ? { duration: 0 }
                        : { duration: 0.95, delay, ease: [0.22, 1, 0.36, 1] }
                }
            >
                {!prefersReducedMotion && (
                    <motion.span
                        aria-hidden="true"
                        className={`absolute inset-y-0 -left-8 w-10 ${
                            tone === "solid"
                                ? "bg-gradient-to-r from-transparent via-[#f5f5f5]/70 to-transparent"
                                : "bg-gradient-to-r from-transparent via-white/45 to-transparent"
                        }`}
                        initial={{ x: "-120%" }}
                        animate={isActive ? { x: "240%" } : { x: "-120%" }}
                        transition={{ duration: 1.08, delay: delay + 0.28, ease: [0.4, 0, 0.2, 1] }}
                    />
                )}
                <span className="relative z-10 text-xs font-semibold">{value}</span>
            </motion.div>
        </div>
    );
}

export function LandingLabView() {
    const analyzerRef = useRef<HTMLDivElement | null>(null);
    const isAnalyzerInView = useInView(analyzerRef, {
        once: true,
        amount: 0.22,
        margin: "0px 0px -12% 0px",
    });
    const prefersReducedMotion = useReducedMotion() ?? false;

    return (
        <section id="como-funciona" className="py-12 md:py-20 bg-[#0A0A0A] relative overflow-hidden">
            {/* Elementos decorativos de fundo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
                <div className="absolute left-0 top-20 w-72 h-72 bg-white rounded-full opacity-5 blur-3xl"></div>
                <div className="absolute right-0 bottom-20 w-80 h-80 bg-white rounded-full opacity-5 blur-3xl"></div>
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8 md:mb-16"
                >
                    <motion.span
                        className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full text-sm font-medium mb-4 md:mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        Análise Inteligente
                    </motion.span>

                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6">
                        Leitura de Exames <span className="text-[#9E9E9E]">via IA</span>
                    </h2>
                    <p className="text-base md:text-lg text-[#E0E0E0] mb-6 md:mb-8 max-w-2xl mx-auto px-2">
                        Nossa Inteligência Artificial lê, interpreta e organiza os resultados dos exames automaticamente.
                        Transforme PDFs em gráficos de evolução em segundos.
                    </p>
                </motion.div>

                {/* Lab Results Analyzer Interface */}
                <motion.div
                    className="bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden max-w-6xl mx-auto border border-white/10"
                    ref={analyzerRef}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
                    animate={isAnalyzerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                    transition={
                        prefersReducedMotion
                            ? { duration: 0 }
                            : { duration: 0.62, delay: 0.08, ease: [0.22, 1, 0.36, 1] }
                    }
                >
                    {/* Analyzer Header */}
                    <div className="bg-[#111111] p-6 text-white border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <LineChart className="w-8 h-8 text-white" />
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Análise Comparativa</h3>
                                    <p className="text-sm text-[#9E9E9E]">Paciente: Maria Silva - Últimos 6 meses</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors text-white">
                                    Exportar PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Lab Results Grid */}
                    <div className="p-4 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {/* Hemoglobina Chart */}
                            <motion.div
                                className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10"
                                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                                animate={isAnalyzerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                                transition={
                                    prefersReducedMotion
                                        ? { duration: 0 }
                                        : { duration: 0.48, delay: 0.14, ease: [0.22, 1, 0.36, 1] }
                                }
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-white">Hemoglobina</h4>
                                        <p className="text-sm text-[#9E9E9E]">Referência: 12.0 - 16.0 g/dL</p>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-500/30">
                                        Normal
                                    </span>
                                </div>

                                {/* Simple Bar Chart */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#9E9E9E] w-16">Mar</span>
                                        <TrendBar
                                            delay={0.22}
                                            isActive={isAnalyzerInView}
                                            prefersReducedMotion={prefersReducedMotion}
                                            tone="soft"
                                            value="13.2"
                                            width="75%"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#9E9E9E] w-16">Abr</span>
                                        <TrendBar
                                            delay={0.3}
                                            isActive={isAnalyzerInView}
                                            prefersReducedMotion={prefersReducedMotion}
                                            tone="solid"
                                            value="14.2"
                                            width="80%"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-sm">
                                    <div className="flex items-center gap-1 text-emerald-400">
                                        <span className="text-lg">↗</span>
                                        <span className="font-semibold">+7.6%</span>
                                    </div>
                                    <span className="text-[#9E9E9E]">vs. mês anterior</span>
                                </div>
                            </motion.div>

                            {/* Glicemia Chart */}
                            <motion.div
                                className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10"
                                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                                animate={isAnalyzerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                                transition={
                                    prefersReducedMotion
                                        ? { duration: 0 }
                                        : { duration: 0.48, delay: 0.2, ease: [0.22, 1, 0.36, 1] }
                                }
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-white">Glicemia em Jejum</h4>
                                        <p className="text-sm text-[#9E9E9E]">Referência: 70 - 100 mg/dL</p>
                                    </div>
                                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-semibold border border-amber-500/30">
                                        Atenção
                                    </span>
                                </div>

                                {/* Simple Bar Chart */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#9E9E9E] w-16">Mar</span>
                                        <TrendBar
                                            delay={0.26}
                                            isActive={isAnalyzerInView}
                                            prefersReducedMotion={prefersReducedMotion}
                                            tone="soft"
                                            value="102"
                                            width="85%"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#9E9E9E] w-16">Abr</span>
                                        <TrendBar
                                            delay={0.34}
                                            isActive={isAnalyzerInView}
                                            prefersReducedMotion={prefersReducedMotion}
                                            tone="solid"
                                            value="108"
                                            width="90%"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-sm">
                                    <div className="flex items-center gap-1 text-amber-400">
                                        <span className="text-lg">↗</span>
                                        <span className="font-semibold">+5.9%</span>
                                    </div>
                                    <span className="text-[#9E9E9E]">vs. mês anterior</span>
                                </div>
                            </motion.div>

                            {/* Colesterol Total Chart */}
                            <motion.div
                                className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10 hidden md:block"
                                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                                animate={isAnalyzerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                                transition={
                                    prefersReducedMotion
                                        ? { duration: 0 }
                                        : { duration: 0.48, delay: 0.26, ease: [0.22, 1, 0.36, 1] }
                                }
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-white">Colesterol Total</h4>
                                        <p className="text-sm text-[#9E9E9E]">Referência: {'<'} 200 mg/dL</p>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-500/30">
                                        Normal
                                    </span>
                                </div>

                                {/* Simple Bar Chart */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#9E9E9E] w-16">Mar</span>
                                        <TrendBar
                                            delay={0.28}
                                            isActive={isAnalyzerInView}
                                            prefersReducedMotion={prefersReducedMotion}
                                            tone="soft"
                                            value="195"
                                            width="78%"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#9E9E9E] w-16">Abr</span>
                                        <TrendBar
                                            delay={0.36}
                                            isActive={isAnalyzerInView}
                                            prefersReducedMotion={prefersReducedMotion}
                                            tone="solid"
                                            value="180"
                                            width="72%"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-sm">
                                    <div className="flex items-center gap-1 text-emerald-400">
                                        <span className="text-lg">↘</span>
                                        <span className="font-semibold">-7.7%</span>
                                    </div>
                                    <span className="text-[#9E9E9E]">vs. mês anterior</span>
                                </div>
                            </motion.div>

                            {/* Creatinina Chart */}
                            <motion.div
                                className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10 hidden md:block"
                                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                                animate={isAnalyzerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                                transition={
                                    prefersReducedMotion
                                        ? { duration: 0 }
                                        : { duration: 0.48, delay: 0.32, ease: [0.22, 1, 0.36, 1] }
                                }
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-white">Creatinina</h4>
                                        <p className="text-sm text-[#9E9E9E]">Referência: 0.6 - 1.2 mg/dL</p>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-500/30">
                                        Normal
                                    </span>
                                </div>

                                {/* Simple Bar Chart */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#9E9E9E] w-16">Mar</span>
                                        <TrendBar
                                            delay={0.3}
                                            isActive={isAnalyzerInView}
                                            prefersReducedMotion={prefersReducedMotion}
                                            tone="soft"
                                            value="0.9"
                                            width="65%"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#9E9E9E] w-16">Abr</span>
                                        <TrendBar
                                            delay={0.38}
                                            isActive={isAnalyzerInView}
                                            prefersReducedMotion={prefersReducedMotion}
                                            tone="solid"
                                            value="0.92"
                                            width="67%"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-sm">
                                    <div className="flex items-center gap-1 text-white/60">
                                        <span className="text-lg">→</span>
                                        <span className="font-semibold">+2.2%</span>
                                    </div>
                                    <span className="text-[#9E9E9E]">vs. mês anterior</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Summary Section */}
                        <motion.div
                            className="mt-8 bg-white/5 rounded-xl p-6 border border-white/10"
                            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                            animate={isAnalyzerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
                            transition={
                                prefersReducedMotion
                                    ? { duration: 0 }
                                    : { duration: 0.52, delay: 0.42, ease: [0.22, 1, 0.36, 1] }
                            }
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/10 rounded-lg">
                                    <LineChart className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold text-white mb-2">Resumo da Análise</h4>
                                    <p className="text-[#E0E0E0] text-sm mb-3">
                                        Visualização comparativa dos últimos 2 meses. Os dados apresentados são apenas informativos e não substituem a avaliação clínica profissional.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-white border border-white/10">
                                            3 valores normais
                                        </span>
                                        <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-white border border-white/10">
                                            1 requer atenção
                                        </span>
                                        <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-white border border-white/10">
                                            Período: Mar-Abr 2025
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* CTA após análise */}
                <motion.div
                    className="mt-8 md:mt-16 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                >
                    <Link href="/auth?tab=register">
                        <button
                            className="bg-white hover:bg-[#E0E0E0] text-[#111111] font-bold py-4 px-8 rounded-lg shadow-lg text-lg transition-colors"
                        >
                            Comece agora gratuitamente
                            <ArrowRight className="ml-2 h-5 w-5 inline text-[#111111]" />
                        </button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
