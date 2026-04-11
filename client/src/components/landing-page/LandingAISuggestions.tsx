import { motion } from "framer-motion";
import { Sparkles, Zap, Brain, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { tokens } from "./landing-tokens";

export function LandingAISuggestions() {
    return (
        <section id="dose-inteligente" className={`${tokens.section.dark} ${tokens.section.paddingFull} relative overflow-hidden text-white`}>
            {/* Background Effects - Subtle Monochrome */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] opacity-20"></div>
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] opacity-20"></div>
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col items-center gap-7 lg:flex-row lg:gap-24">

                    {/* Visual Mockup - Prescription Input with AI Suggestion */}
                    <div className="order-2 lg:order-1 lg:w-1/2 w-full max-w-md lg:max-w-none flex flex-col gap-4 md:gap-8 relative">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="relative z-20"
                        >
                            {/* Glow behind the mockup */}
                            <div className="absolute -inset-1 bg-white/10 rounded-xl blur-xl opacity-30"></div>

                            <div className="bg-[#111111] border border-white/10 rounded-xl shadow-2xl p-5 sm:p-8 relative overflow-hidden">
                                <div className="space-y-5">
                                    {/* Mock Label */}
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-white/80">Medicamento / Substância</label>
                                        <span className="text-xs text-white/40">Busca contextual</span>
                                    </div>

                                    {/* Mock Input Field */}
                                    <div className="relative">
                                        <div className="flex items-center bg-[#1A1A1A] border border-white/20 rounded-lg p-3.5 sm:p-4 shadow-inner">
                                            <div className="w-px h-6 bg-white/20 mr-4 animate-pulse"></div>
                                            <span className="text-lg text-white font-medium">Dipi</span>
                                        </div>

                                        {/* AI Suggestion Dropdown/Tooltip */}
                                        <motion.div
                                            className="absolute top-full left-0 mt-2 w-full bg-[#1A1A1A] border border-white/20 rounded-lg shadow-xl overflow-hidden z-20"
                                            initial={{ opacity: 0, y: -10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6, duration: 0.4 }}
                                            viewport={{ once: true }}
                                        >
                                            <div className="p-1">
                                                <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded">
                                                    <span className="text-white font-medium">Dipirona 500mg</span>
                                                    <span className="text-xs bg-white text-black px-1.5 py-0.5 rounded font-bold">Vita</span>
                                                </div>
                                            </div>

                                            <div className="p-3 border-t border-white/10 bg-[#111111]">
                                                <div className="flex items-start gap-3">
                                                    <Sparkles className="w-4 h-4 text-white mt-1 shrink-0" />
                                                    <div>
                                                        <p className="text-sm text-white/90 font-medium mb-1">
                                                            Sugestão para Dor/Febre:
                                                        </p>
                                                        <p className="text-xs text-white/60">
                                                            Tomar 1 comprimido (500mg) a cada 6 horas se necessário.
                                                        </p>
                                                        <div className="mt-2 flex gap-2">
                                                            <span className="text-[10px] border border-white/20 rounded px-1.5 py-0.5 text-white/50 whitespace-nowrap">Baseado no histórico</span>
                                                            <span className="text-[10px] border border-white/20 rounded px-1.5 py-0.5 text-white/50 whitespace-nowrap">Peso: 70kg</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                    
                                    {/* Spacing for dropdown */}
                                    <div className="h-14 lg:h-24"></div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Second Mockup: Context Analysis */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="relative lg:ml-12 z-10 hidden md:block"
                        >
                            <div className="bg-[#111111] border border-white/10 rounded-xl shadow-2xl p-5 relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                                        <Brain className="w-4 h-4 text-white/60" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/40">Análise de Contexto Clínico</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[11px] text-white/60 bg-white/5 p-2 rounded">
                                        <span>Idade: 42 anos</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-white/60 bg-white/5 p-2 rounded border-l-2 border-yellow-500/50">
                                        <span>Alergia: AAS / AINEs</span>
                                        <span className="text-[10px] font-bold text-yellow-500">ALERTA</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-white/60 bg-white/5 p-2 rounded">
                                        <span>Peso: 70kg</span>
                                        <span className="bg-white/10 px-1 rounded">Normal</span>
                                    </div>
                                </div>
                                <p className="mt-4 text-[11px] text-white/40 italic text-center">
                                    Dosagem sugerida a partir do contexto farmacológico do paciente.
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Text Content */}
                    <div className="order-1 lg:order-2 lg:w-1/2 w-full max-w-md lg:max-w-none">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <span className={tokens.eyebrow.lineDark} />
                                <span className={tokens.eyebrow.dark}>Preenchimento assistido na prescrição</span>
                            </div>
                            <h2 className={`${tokens.h2.dark} mb-6`}>
                                Sugestão de dose <br />
                                <span className={tokens.h2.splitDark}>
                                    pronta para revisar.
                                </span>
                            </h2>
                            <p className={`${tokens.body.dark} max-w-xl mb-10`}>
                                Esqueça a busca manual por posologias. O VitaView considera o contexto do paciente e antecipa a dose mais provável diretamente no campo de prescrição. O controle e a decisão final são sempre seus.
                            </p>

                            <div className="grid grid-cols-1 gap-3 mb-8 md:hidden">
                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Contexto do paciente</p>
                                    <p className="mt-2 text-sm text-white/65 leading-relaxed">Peso, histórico e alertas entram na dose sugerida antes do preenchimento final.</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Preenchimento mais direto</p>
                                    <p className="mt-2 text-sm text-white/65 leading-relaxed">A melhor hipótese de posologia já aparece no campo para revisão rápida.</p>
                                </div>
                            </div>

                            <div className="hidden md:grid grid-cols-1 gap-6 mb-8">
                                {[
                                    {
                                        icon: <Brain className="w-5 h-5" />,
                                        title: "Contexto Clínico",
                                        desc: "Ajusta a sugestão baseada no peso, idade e histórico do paciente."
                                    },
                                    {
                                        icon: <Zap className="w-5 h-5" />,
                                        title: "Preenchimento Instantâneo",
                                        desc: "Aceite a sugestão com um clique ou tecla de atalho."
                                    },
                                    {
                                        icon: <ShieldCheck className="w-5 h-5" />,
                                        title: "Redução de Erros",
                                        desc: "Padronização que evita erros de digitação e dosagem."
                                    }
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="p-2 bg-white/5 rounded-lg text-white border border-white/10">
                                            {feature.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">{feature.title}</h4>
                                            <p className="text-sm text-white/50">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Link href="/auth">
                                <Button className="bg-white text-[#0A0A0A] hover:bg-gray-200 font-bold w-full sm:w-auto py-6 px-8 rounded-lg text-lg shadow-lg hover:shadow-white/10 transition-all border border-transparent">
                                    Ver na Prática
                                </Button>
                            </Link>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
